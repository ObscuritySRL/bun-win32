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
- [`comdlg32`](./packages/comdlg32) - common dialogs: Open / Save File, Choose Color, Choose Font, Print, Page Setup, Find / Replace, and `CommDlgExtendedError`
- [`d2d1`](./packages/d2d1) - Direct2D: GPU-accelerated 2D — `ID2D1Factory` / device-context creation plus Direct2D's native affine-matrix, color-space (sRGB / scRGB), gradient-mesh (Coons-patch), and trig / vector math (`D2D1CreateFactory`, `D2D1MakeRotateMatrix`, `D2D1ConvertColorSpace`, …)
- [`d3d11`](./packages/d3d11) - Direct3D 11 device / swap-chain creation, D3D11-on-12 interop, WinRT `IDirect3DDevice` / `IDirect3DSurface` bridges
- [`d3d12`](./packages/d3d12) - Direct3D 12 device creation, debug-layer / global-interface access, and root-signature serialize/deserialize (`D3D12CreateDevice`, `D3D12GetDebugInterface`, `D3D12GetInterface`, `D3D12SerializeVersionedRootSignature`, …) — modern GPU/compute/ML path
- [`d3dcompiler_47`](./packages/d3dcompiler_47) - HLSL → DXBC shader compilation, preprocessing, disassembly, reflection, blob part extraction, shader stripping, function linking graph
- [`dcomp`](./packages/dcomp) - DirectComposition device/surface creation (`DCompositionCreateDevice`/`2`/`3`, `DCompositionCreateSurfaceHandle`) and the Windows-11 compositor-clock frame/statistics surface (`DCompositionGetFrameId`, `DCompositionGetStatistics`, `DCompositionWaitForCompositorClock`, `DCompositionBoostCompositorClock`) — live compositor heartbeat proven pure-FFI
- [`dwmapi`](./packages/dwmapi) - DWM composition, blur, thumbnails
- [`dwrite`](./packages/dwrite) - DirectWrite factory entry point (`DWriteCreateFactory`): system font enumeration, text layout, glyph metrics, and pure-FFI ClearType/grayscale glyph rasterization over the `IDWriteFactory` COM vtable
- [`dxcore`](./packages/dxcore) - DXCore adapter-factory entry point (`DXCoreCreateAdapterFactory`): DXGI-independent GPU & compute-only MCDM adapter enumeration, hardware IDs, memory pools, and capability/attribute queries over the `IDXCoreAdapterFactory`/`List`/`Adapter` COM vtable
- [`dxgi`](./packages/dxgi) - DXGI adapter enumeration, factory creation, debug interface (`CreateDXGIFactory*`, `DXGIGetDebugInterface1`)
- [`dxva2`](./packages/dxva2) - DDC/CI monitor configuration (brightness, contrast, RGB drive/gain, colour temperature, VCP), physical monitor enumeration, DXVA2 / DXVA-HD video acceleration, OPM video output
- [`gdi32`](./packages/gdi32) - graphics device interface
- [`gdiplus`](./packages/gdiplus) - GDI+ flat C API: image load/save (PNG, JPEG, BMP, GIF, TIFF, ICO), antialiased 2D drawing, paths, regions, gradients, brushes, fonts, color matrix effects, metafile recording
- [`glu32`](./packages/glu32) - OpenGL utility functions
- [`magnification`](./packages/magnification) - Magnification API: recolor the entire desktop via a 5x5 color matrix (grayscale, photo-negative, sepia, color-blindness simulation), full-screen zoom/pan transforms, magnifier-control window filtering, and pen/touch input remapping
- [`mscms`](./packages/mscms) - Image Color Management (ICM): ICC profiles, color transforms, sRGB / Adobe RGB / CMYK conversion via Win32 CMM, display calibration, and the Windows Color System (WCS) profile management API
- [`opengl32`](./packages/opengl32) - OpenGL rendering context
- [`user32`](./packages/user32) - windows, messages, input, UI
- [`uxtheme`](./packages/uxtheme) - visual styles, themed controls, buffered painting
- [`windowscodecs`](./packages/windowscodecs) - Windows Imaging Component (WIC): zero-build image decode/encode (JPEG, PNG, GIF, TIFF, BMP, HEIF), scaling, flip/rotate, pixel-format conversion, palettes, color contexts, and metadata — the full proxy-function surface

#### Multimedia

- [`avifil32`](./packages/avifil32) - Video for Windows AVIFile API: open/create `.avi` files, enumerate streams, read/write video, audio, MIDI, and text streams, decode frames to DIBs (`AVIStreamGetFrame`), mux files from streams, editable-stream cut/copy/paste
- [`avrt`](./packages/avrt) - MMCSS multimedia thread scheduling: join system-profile tasks ("Pro Audio", "Games", …), raise AVRT priority, query the system-responsiveness reservation, and coordinate thread-ordering groups (`AvSetMmThreadCharacteristicsW`, `AvSetMmThreadPriority`, `AvQuerySystemResponsiveness`, `AvRtCreateThreadOrderingGroup`) — the low-latency audio/capture scheduling primitives
- [`dinput8`](./packages/dinput8) - DirectInput 8: every non-Xbox controller — racing wheels, flight sticks / HOTAS, generic gamepads (`DirectInput8Create`, `GetdfDIJoystick`); device enumeration, capabilities, acquisition, and polling over the `IDirectInput8` COM vtable
- [`dsound`](./packages/dsound) - DirectSound: playback / capture device creation & enumeration, full-duplex, and default-device GUID resolution (`DirectSoundCreate8`, `DirectSoundEnumerateW`, `GetDeviceID`, …) — synthesize and play PCM end-to-end over the `IDirectSound8` / `IDirectSoundBuffer` COM vtable
- [`mf`](./packages/mf) - Media Foundation pipeline: source resolver, ASF authoring graph (profile / multiplexer / indexer / splitter / stream selector), container media sinks (MP3 / AC-3 / ADTS / MPEG-4 / fragmented-MP4 / 3GP), streaming sinks, video renderer, network credential / proxy, and the protected-environment / signed-library surface (`MFCreateSourceResolver`, `MFCreateASFProfile`, `MFCreateMPEG4MediaSink`, `MFGetSupportedSchemes`, …)
- [`mfplat`](./packages/mfplat) - Media Foundation platform: lifecycle, work queues, MFT registry, media type / sample / byte stream factories (`MFStartup`, `MFTEnumEx`, `MFCreateAttributes`, `MFCreateSample`)
- [`mfreadwrite`](./packages/mfreadwrite) - Media Foundation source reader / sink writer factories (`MFCreateSourceReader*`, `MFCreateSinkWriter*`)
- [`mmdevapi`](./packages/mmdevapi) - MMDevice / Core Audio class factory, WASAPI async activation (`DllGetClassObject`, `ActivateAudioInterfaceAsync`)
- [`winmm`](./packages/winmm) - multimedia audio, MIDI, mixers, timers, joysticks, MCI
- [`xaudio2_9`](./packages/xaudio2_9) - XAudio2 2.9: low-latency audio engine + voice graph, X3DAudio positional math (matrix / Doppler / LPF solve), and every built-in XAPO — volume meter, reverb, FXEQ / FXMasteringLimiter / FXReverb / FXEcho (`XAudio2Create`, `X3DAudioInitialize`, `X3DAudioCalculate`, `CreateAudioVolumeMeter`, `CreateFX`); synthesize and play PCM end-to-end over the `IXAudio2` / `IXAudio2SourceVoice` COM vtable
- [`xinput1_4`](./packages/xinput1_4) - XInput 1.4: Xbox controller state, vibration, battery, audio, keystroke
- [`xinput9_1_0`](./packages/xinput9_1_0) - XInput 9.1.0: legacy Xbox controller state, vibration, DirectSound GUIDs

#### Networking

- [`bluetoothapis`](./packages/bluetoothapis) - Bluetooth Classic radio/device discovery, BLE GATT, SDP, authentication
- [`dnsapi`](./packages/dnsapi) - DNS resolution across every record type (A, AAAA, MX, NS, SOA, TXT, SRV, CAA, etc.), name validation, configured server discovery, DNS-SD, mDNS, async queries
- [`httpapi`](./packages/httpapi) - HTTP Server API (HTTP.sys): kernel-mode listener powering IIS, request queues, URL groups, server sessions, SSL/TLS config, response caching, HTTP/2 push, request shaping
- [`iphlpapi`](./packages/iphlpapi) - network adapters, TCP/UDP tables, routing
- [`mpr`](./packages/mpr) - network drive mapping, UNC connections, resource enumeration
- [`netapi32`](./packages/netapi32) - users, groups, shares, domain joins
- [`ntdsapi`](./packages/ntdsapi) - Active Directory client: directory bind (`DsBind*`), name-format translation (`DsCrackNames`), Kerberos SPN forge/register (`DsGetSpn`, `DsClientMakeSpnForTargetServer`, `DsWriteAccountSpn`), site/server/role/DC enumeration, replication control (`DsReplicaSync`/`Add`/`GetInfo`), SID-history migration — all 81 documented exports, SPN + syntactical name-cracking work with no domain
- [`sensapi`](./packages/sensapi) - System Event Notification Service connectivity checks (`IsNetworkAlive`, `IsDestinationReachable`)
- [`winhttp`](./packages/winhttp) - HTTP/HTTPS client, WebSockets, proxy auto-detect (WPAD/PAC), TLS configuration, request tracing
- [`wininet`](./packages/wininet) - WinINet/IE-legacy stack: HTTP/HTTPS, FTP, persistent URL cache, cookie jar (`InternetGetCookieEx2`, `InternetSetCookieEx2`), autodial, per-site cookie decisions
- [`wlanapi`](./packages/wlanapi) - Native Wifi: interface enumeration, scans, profiles, Wi-Fi Direct
- [`wldap32`](./packages/wldap32) - LDAP client: directory bind/auth, search, modify, add/delete/rename/compare, extended operations, server/client controls, paged / sorted / virtual-list-view results, StartTLS, and the BER (winber) encode/decode primitives
- [`ws2_32`](./packages/ws2_32) - Winsock 2: BSD sockets, DNS, network I/O

#### Printing

- [`winspool`](./packages/winspool) - printer management, print jobs, spooler control, drivers

#### Remote Desktop & Terminal Services

- [`wtsapi32`](./packages/wtsapi32) - Terminal Services sessions, processes, virtual channels, remote desktop

#### Security & Crypto

- [`advapi32`](./packages/advapi32) - registry, security descriptors, service control
- [`amsi`](./packages/amsi) - Antimalware Scan Interface: submit scripts/buffers to the registered AV provider (Defender) for in-process scanning (`AmsiInitialize`, `AmsiScanBuffer`, `AmsiScanString`, `AmsiNotifyOperation`) — EICAR detection proven pure-FFI, no shelling out
- [`bcrypt`](./packages/bcrypt) - Cryptography Next Gen (CNG): ciphers, hashes, HMAC, PBKDF2, signatures, random bytes, key agreement
- [`credui`](./packages/credui) - credential prompts, username parsing, auth blobs, and SSPI prompt helpers
- [`crypt32`](./packages/crypt32) - certificate stores, chains, encoding, DPAPI
- [`ncrypt`](./packages/ncrypt) - CNG Key Storage: persisted keys, RSA/ECDSA/ECDH signing & key agreement, key attestation claims, DPAPI-NG protection descriptors and streaming
- [`secur32`](./packages/secur32) - SSPI authentication, credentials, LSA
- [`sspicli`](./packages/sspicli) - SSPI client-side auth and SASL
- [`tbs`](./packages/tbs) - TPM Base Services: open a TBS context, submit raw TPM 2.0 command buffers, read the TCG measured-boot log, query device ID / owner-auth (`Tbsi_Context_Create`, `Tbsip_Submit_Command`, `Tbsi_Get_TCG_Log`, `GetDeviceID`) — TPM2_GetRandom / GetCapability proven pure-FFI against real hardware
- [`webauthn`](./packages/webauthn) - WebAuthn / FIDO2: drive the Windows platform authenticator (Windows Hello biometrics + TPM-backed passkeys) — passkey registration & assertion, platform-credential enumeration/deletion, cancellation, and W3C `DOMException` error mapping (`WebAuthNAuthenticatorMakeCredential`, `WebAuthNAuthenticatorGetAssertion`, `WebAuthNGetPlatformCredentialList`) — a real Windows Hello passkey ceremony proven pure-FFI
- [`winscard`](./packages/winscard) - smart card resource manager, reader discovery, status changes, and APDU transport
- [`wintrust`](./packages/wintrust) - Authenticode signature verification (WinVerifyTrust), catalog admin, SIP, and trust-provider helpers
- [`wscapi`](./packages/wscapi) - Windows Security Center: aggregate provider health (firewall, antivirus, auto-update, UAC, WSC service) and change registration (`WscGetSecurityProviderHealth`, `WscRegisterForChanges`) — live security posture without parsing PowerShell

#### System

- [`cabinet`](./packages/cabinet) - Compression API (MSZIP / XPRESS / XPRESS-Huffman / LZMS) plus Cabinet (.cab) archive creation and extraction via the FCI / FDI callback interfaces
- [`cfgmgr32`](./packages/cfgmgr32) - device tree traversal, configuration management, device properties, interfaces, resources
- [`cldapi`](./packages/cldapi) - Cloud Files API (`cfapi.h`): all 35 documented exports — sync-root register/connect, placeholder create/convert/update/revert, hydrate/dehydrate, transfer keys, pin & in-sync state, placeholder/sync-root info, and platform version — the OneDrive Files On-Demand engine that projects zero-byte-on-disk placeholder files, proven pure-FFI
- [`clfsw32`](./packages/clfsw32) - Common Log File System: all 53 documented user-mode + management exports — dedicated/multiplexed log creation, containers, marshaling areas, durable record reserve/append, archival, the CLFS management policy surface, and the 8-byte by-value `CLFS_LSN` algebra (`LsnCreate`/`LsnContainer`/`LsnBlockOffset`/`LsnRecordSequence`) — the kernel write-ahead-log engine behind TxF/TxR, proven pure-FFI
- [`combase`](./packages/combase) - Windows Runtime activation core: `RoInitialize`/`RoActivateInstance`/`RoGetActivationFactory`, the full `HSTRING` string API, fast-pass/preallocated buffers, and the WinRT error-info surface — the pure-FFI path to toast notifications and the rest of the WinRT projection
- [`dbghelp`](./packages/dbghelp) - symbol engine, stack walking, minidumps, image helpers, source-level debugging
- [`dismapi`](./packages/dismapi) - DISM image servicing: online/offline sessions, optional features, packages, drivers, capabilities, image health (`DismInitialize`, `DismOpenSession`, `DismGetFeatures`, `DismCheckImageHealth`) — the `DISM.exe` engine in-process, no spawn
- [`fltlib`](./packages/fltlib) - Filter Manager (`fltuser.h`): minifilter / instance / volume enumeration, info queries, load/unload, attach/detach, and the minifilter communication-port channel (`FilterFindFirst`, `FilterInstanceFindFirst`, `FilterVolumeFindFirst`, `FilterConnectCommunicationPort`) — the file-system filter stack `fltmc` shows, pure-FFI
- [`hid`](./packages/hid) - HID device access, feature reports, preparsed data parsing
- [`kernel32`](./packages/kernel32) - processes, memory, files, console, threads
- [`ktmw32`](./packages/ktmw32) - Kernel Transaction Manager (KTM): create/open transactions, transaction managers, resource managers, and enlistments; two-phase commit/rollback (`CreateTransaction`, `CommitTransaction`, `RollbackTransaction`, `CreateResourceManager`, `CreateEnlistment`) — atomic transacted-NTFS / transacted-registry work, pure-FFI
- [`mi`](./packages/mi) - Windows Management Infrastructure client bootstrap and function-table discovery
- [`msi`](./packages/msi) - Windows Installer: product enumeration, install state, database, patching
- [`ntdll`](./packages/ntdll) - native NT API
- [`normaliz`](./packages/normaliz) - internationalized domain names, Nameprep, and Unicode normalization
- [`ole32`](./packages/ole32) - COM/OLE helpers, monikers, structured storage, clipboard, drag-drop
- [`oleacc`](./packages/oleacc) - Microsoft Active Accessibility (MSAA): resolve `IAccessible` from a window or screen point, walk the accessibility tree, decode role/state text, marshal objects to/from `LRESULT`
- [`oleaut32`](./packages/oleaut32) - OLE Automation: BSTR, VARIANT, SAFEARRAY, DECIMAL, CURRENCY, type libraries, IDispatch helpers, OLE pictures, full Var\*From\* conversion family
- [`pdh`](./packages/pdh) - performance counter queries, logs, and enumeration
- [`powrprof`](./packages/powrprof) - power schemes, policies, sleep states, battery management
- [`propsys`](./packages/propsys) - Windows Property System: full PROPVARIANT/VARIANT conversion families, vector/array helpers, property keys (`PSGetPropertyKeyFromName`), property descriptions, property stores/bags, and `PropVariantCompareEx` (Explorer's value comparator)
- [`psapi`](./packages/psapi) - process status and module enumeration
- [`rasapi32`](./packages/rasapi32) - Remote Access Service: dial-up/VPN dialing and hang-up, connection enumeration and status, phone-book entry/sub-entry/credentials/dial-params management, autodial, projection info, link/connection statistics, EAP user data
- [`rpcrt4`](./packages/rpcrt4) - RPC runtime: UUID generation (random + sequential), client/server bindings, endpoint mapper enumeration, authentication levels, extended error info, protocol sequences, MES pickling, string-binding compose/parse, `DceErrorInqText`
- [`rstrtmgr`](./packages/rstrtmgr) - Restart Manager sessions, lock discovery, shutdown, and restart orchestration
- [`setupapi`](./packages/setupapi) - device installation, INF parsing, class and interface enumeration
- [`shcore`](./packages/shcore) - DPI awareness, scale factors, AppUserModelID, random access streams, registry helpers, isolated-container detection, threading refs
- [`shell32`](./packages/shell32) - shell operations and file management
- [`shlwapi`](./packages/shlwapi) - shell lightweight utility functions
- [`taskschd`](./packages/taskschd) - Task Scheduler COM server entry points, class factory activation, task enumeration
- [`tdh`](./packages/tdh) - Trace Data Helper: ETW event decoding (`TdhGetEventInformation`, `TdhFormatProperty`), provider / field / event-schema enumeration, value & bitmap maps, manifest loading, and payload filters
- [`uiautomationcore`](./packages/uiautomationcore) - UI Automation nodes, pattern objects, provider bridging, and event plumbing
- [`userenv`](./packages/userenv) - user profiles, environment blocks, and Group Policy
- [`version`](./packages/version) - file version resources, string tables, installer version helpers
- [`virtdisk`](./packages/virtdisk) - VHD, VHDX, and ISO virtual disk creation, attachment, inspection, and management
- [`wer`](./packages/wer) - Windows Error Reporting report authoring/stores (`WerReportCreate`, `WerReportSubmit`, `WerStoreOpen`, `WerStoreQueryReportMetadataV2`) plus the Wait Chain Traversal deadlock-detection API (`OpenThreadWaitChainSession`, `GetThreadWaitChain`) — live kernel thread-wait X-ray proven pure-FFI
- [`wevtapi`](./packages/wevtapi) - Windows Event Log queries, rendering, subscriptions, channel configuration, publisher metadata
- [`wimgapi`](./packages/wimgapi) - Windows Imaging (WIM): create/open `.wim` archives, capture/apply/enumerate images, mount/unmount/split/export, references, and live progress via a `WIMRegisterMessageCallback` JSCallback — the `DISM.exe`/`ImageX` engine in-process
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
`-- README.md
```

## Generating a New Package

All packages in this repo are AI-generated using Claude Code. To add bindings for a new DLL:

1. Open the repo in Claude Code.
2. Set the model to **max effort** with **extended thinking** enabled.
3. Send:

```
Execute @PROMPT.md for `crypt32`.
```

Replace `crypt32` with whatever DLL you're targeting. `PROMPT.md` uses the scaffold, catalog, runtime-probe, stub-scaffold, and audit scripts to keep the work mechanical, resumable, and less error-prone.

## License

MIT
