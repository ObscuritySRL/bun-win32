# @bun-win32/all

Every `@bun-win32/*` package in one install. The full Win32 surface area — kernel32, user32, gdi32, d2d1, d3d11/12, dwrite, xaudio2, gameinput, webauthn, bcrypt, mfreadwrite, and 100+ more — exposed through a single import for [Bun](https://bun.sh) on Windows.

## Install

```sh
bun add @bun-win32/all
# or:
bun add bun-win32
```

`bun-win32` is an unscoped alias that re-exports the same surface — use whichever install you prefer.

## Usage

```ts
import { D2D1, DWrite, Kernel32, User32, Xaudio2_9 } from '@bun-win32/all';

const pid = Kernel32.GetCurrentProcessId();
const hwnd = User32.GetForegroundWindow();

// Lazy binding: the first call resolves the symbol via dlsym, every call after
// is a direct native pointer invocation with zero marshaling overhead.

// Or namespace-import the whole surface:
import * as Win32 from '@bun-win32/all';
Win32.Kernel32.GetTickCount64();
Win32.Xaudio2_9.XAudio2Create(/* ... */);
```

For TypeScript enums, structs, and packed-struct helpers, import from the specific package — those types are not re-exported here because the namespace would collide (every package defines `HRESULT`, `HANDLE`, etc.):

```ts
import { User32 } from '@bun-win32/all';
import { WindowStyles, ShowWindowCommand } from '@bun-win32/user32';
```

## What's Inside

Every published `@bun-win32/*` package. Default-export classes are re-exported as named bindings:

| Category | Packages |
| --- | --- |
| Graphics & Windowing | `Comctl32`, `Comdlg32`, `D2D1`, `D3d11`, `D3d12`, `D3dcompiler_47`, `Dcomp`, `Dwmapi`, `Dwrite`, `Dxcore`, `Dxgi`, `Dxva2`, `GDI32`, `Gdiplus`, `GLU32`, `Magnification`, `Mscms`, `OpenGL32`, `User32`, `Uxtheme`, `WindowsCodecs` |
| Multimedia | `Avifil32`, `Avrt`, `Dinput8`, `DirectML`, `DSound`, `GameInput`, `Mf`, `Mfplat`, `Mfreadwrite`, `Mmdevapi`, `Quartz`, `Winmm`, `Xaudio2_9`, `Xinput1_4`, `Xinput9_1_0` |
| Networking | `BluetoothApis`, `Dnsapi`, `FirewallApi`, `Fwpuclnt`, `Httpapi`, `Iphlpapi`, `Mpr`, `Netapi32`, `Ntdsapi`, `Sensapi`, `Winhttp`, `Wininet`, `Wlanapi`, `Wldap32`, `Ws2_32` |
| Printing | `Prntvpt`, `Winspool` |
| Remote Desktop | `Wtsapi32` |
| Security & Crypto | `Advapi32`, `Amsi`, `Bcrypt`, `Credui`, `Crypt32`, `Fveapi`, `Ncrypt`, `Secur32`, `SspiCli`, `Tbs`, `Webauthn`, `WinSCard`, `Wintrust`, `Wscapi` |
| System | `Activeds`, `Cabinet`, `Cfgmgr32`, `Cldapi`, `Clfsw32`, `Clusapi`, `Combase`, `Dbghelp`, `Dismapi`, `Fltlib`, `Hid`, `Kernel32`, `Ktmw32`, `Mi`, `Msi`, `Normaliz`, `Ntdll`, `Ole32`, `Oleacc`, `Oleaut32`, `Pdh`, `PowrProf`, `Propsys`, `Psapi`, `Rasapi32`, `Rpcrt4`, `Rstrtmgr`, `Setupapi`, `Shcore`, `Shell32`, `Shlwapi`, `Srclient`, `Taskschd`, `Tdh`, `UIAutomationCore`, `Userenv`, `Version`, `Virtdisk`, `Vssapi`, `Wer`, `Wevtapi`, `Wimgapi`, `WinUsb`, `Wuapi` |

The `Win32` namespace from `@bun-win32/core` (FFI helpers, base classes, runtime extensions) is also re-exported.

## Showcase Examples

`packages/all/example/` contains cross-package demos that compose many DLLs into one experience — visuals, audio, input, and OS introspection.

```sh
# Run any showcase example by name:
bun --filter @bun-win32/all run example:demoscene
bun --filter @bun-win32/all run example:bun-os
bun --filter @bun-win32/all run example:window-xray
bun --filter @bun-win32/all run example:synth-studio
bun --filter @bun-win32/all run example:cursor-rain
# ... (see package.json scripts for the full list)
```

These are deliberately ambitious — long-running interactive programs that prove what pure FFI can do under Bun. They are the showcase, not test fixtures. Read them as both demos and as a tour of cross-package integration patterns.

## Requirements

- [Bun](https://bun.sh) >= 1.1.0
- Windows 10 or later

## Notes

- This package has zero runtime cost — it's an index of re-exports. Importing only what you use is tree-shakeable.
- For runtime details (FFI calling conventions, handle lifetimes, pointer/buffer rules), see [`@bun-win32/core`](../core/AI.md) and individual package READMEs.
- AI agents: see `AI.md` for guidance on using the meta-package.

## License

MIT
