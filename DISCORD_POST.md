# bun-win32

A collection of **zero-dependency, type-safe FFI bindings** for the most popular Win32 DLLs — all purpose-built for Bun.

12 packages. ~5,800 functions. Pure `bun:ffi`. No native addons.

```
bun add @bun-win32/kernel32
```

Every function is **lazy-loaded** — symbols are only bound on first call, so startup stays fast. Need a hot path? Preload just what you need:
```ts
import Kernel32 from "@bun-win32/kernel32";
Kernel32.Preload(["GetTickCount64", "GetCurrentProcessId"]);
```

All packages have full TypeScript typings and autocomplete — parameter names match Microsoft Docs, Win32 types are properly mapped (`HANDLE` → `bigint`, `DWORD` → `number`, etc.), and nullability is correctly annotated.

### Packages

All packages now live in a single monorepo and share a common base class via `@bun-win32/core`.

- **[@bun-win32/kernel32](<https://www.npmjs.com/package/@bun-win32/kernel32>)** (1,401 functions) — Process, memory, files, console, threads
- **[@bun-win32/advapi32](<https://www.npmjs.com/package/@bun-win32/advapi32>)** (756 functions) — Registry, security, services, crypto
- **[@bun-win32/user32](<https://www.npmjs.com/package/@bun-win32/user32>)** (596 functions) — Windows, input, clipboard, monitors
- **[@bun-win32/opengl32](<https://www.npmjs.com/package/@bun-win32/opengl32>)** (484 functions) — OpenGL 1.1 + WGL + dynamic extensions
- **[@bun-win32/shlwapi](<https://www.npmjs.com/package/@bun-win32/shlwapi>)** (380 functions) — Path, string, URL, stream utilities
- **[@bun-win32/gdi32](<https://www.npmjs.com/package/@bun-win32/gdi32>)** (326 functions) — Device contexts, bitmaps, graphics
- **[@bun-win32/ntdll](<https://www.npmjs.com/package/@bun-win32/ntdll>)** (326 functions) — Low-level NT internals
- **[@bun-win32/shell32](<https://www.npmjs.com/package/@bun-win32/shell32>)** (253 functions) — Shell operations, file management
- **[@bun-win32/iphlpapi](<https://www.npmjs.com/package/@bun-win32/iphlpapi>)** (166 functions) — Network adapters, TCP/UDP tables, routing, ICMP
- **[@bun-win32/glu32](<https://www.npmjs.com/package/@bun-win32/glu32>)** (52 functions) — OpenGL Utility (quadrics, tessellation)
- **[@bun-win32/psapi](<https://www.npmjs.com/package/@bun-win32/psapi>)** (27 functions) — Process enumeration, memory stats
- **[@bun-win32/core](<https://www.npmjs.com/package/@bun-win32/core>)** — Shared base class, runtime extensions, and Win32 types
- More to come...

### Some cool examples included

- **OpenGL bouncing circles & physics simulations** — real-time rendering straight from Bun, no Electron, no browser
- **N-body pendulum demo** — using opengl32 + glu32
- **Global hotkey listener** — register system-wide hotkeys with user32
- **Mouse stalker** — a window that follows your cursor around
- **Console rainbow** — colorful terminal output via kernel32 console APIs
- **Process explorer** — enumerate running processes with psapi + kernel32
- **File watcher** — native `ReadDirectoryChangesW` without any npm packages
- **Registry reader** — read/write Windows registry keys with advapi32

### How it works

Every package extends a shared `Win32` base class from `@bun-win32/core`. Functions are bound lazily via `bun:ffi` `dlopen` — the DLL is loaded once, and each symbol is resolved on first access then cached. No wrappers, no indirection — it's a direct 1:1 call to the native function.

All packages are AI-generated and verified against `dumpbin` exports and Microsoft documentation.

GitHub: <https://github.com/ObscuritySRL/bun-win32>

-# MIT License
