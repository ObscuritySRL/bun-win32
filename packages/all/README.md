# @bun-win32/all

> Every `@bun-win32/*` package in one install — the full Win32 surface area for [Bun](https://bun.sh) on Windows. **Pure TypeScript. Zero native addons. Zero C. Zero build step.**

```sh
bun add @bun-win32/all     # scoped meta-package
bun add bun-win32          # unscoped alias (re-exports the same surface)
```

---

## 🤯 The Showcase

The browser confined TypeScript to a `<canvas>` and `fetch`. `@bun-win32` hands it the **entire machine** — the GPU, the audio stack, the TPM, the kernel's event stream, your monitor's firmware, another process's memory. Every demo below is one `.ts` file calling Windows directly through Bun's FFI. No addon, no Electron, no wrapper — the same native pointer calls a C program would make.

> Clone and run any of them: `git clone https://github.com/ObscuritySRL/bun-win32 && cd bun-win32 && bun install && cd packages/all` then `bun run <demo>`.
>
> They're powered by [`example/_gpu.ts`](./example/_gpu.ts) — a ~pure-TypeScript **Direct3D 11 engine** (runtime HLSL compile, compute shaders, structured buffers/UAVs, textures, the whole COM vtable) — and [`example/_audio.ts`](./example/_audio.ts) (WinMM capture + FFT + XAudio2 streaming).

### GPU — a million things at 60fps

<table>
<tr>
<td width="50%"><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/particle-galaxy.png" alt="particle-galaxy"><br><b>particle-galaxy</b> — <b>1,048,576</b> particles on a GPU compute shader, orbiting in a softened-gravity disk with curl-noise arms. Hold the mouse to drag a black-hole attractor. <code>bun run particle-galaxy</code></td>
<td width="50%"><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/blackhole.png" alt="blackhole"><br><b>blackhole</b> — a Schwarzschild black hole ray-traced on the GPU: 1/r² light-bending lenses the starfield into Einstein rings around a Doppler-beamed accretion disk. <code>bun run blackhole</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/fluid.png" alt="fluid"><br><b>fluid</b> — a real-time Navier–Stokes solver (advect → vorticity → 36 Jacobi pressure iters). Stir the ink with your mouse. <code>bun run fluid</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/slime.png" alt="slime"><br><b>slime</b> — <b>1,000,000</b> Physarum agents sensing & depositing on a trail map, growing a living vein network (compute + diffuse). <code>bun run slime</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/mandelbulb.png" alt="mandelbulb"><br><b>mandelbulb</b> — the power-8 3D fractal, ray-marched with soft shadows, AO and orbit-trap iridescence. <code>bun run mandelbulb</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/pathtracer.png" alt="pathtracer"><br><b>pathtracer</b> — a progressive Monte-Carlo path tracer (Cornell box, mirror + glass) that boils with noise then resolves to a clean render live. <code>bun run pathtracer</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/clouds.png" alt="clouds"><br><b>clouds</b> — volumetric ray-marched cloudscape with Beer–Lambert extinction, Henyey–Greenstein scatter and god rays. <code>bun run clouds</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/reaction-diffusion.png" alt="reaction-diffusion"><br><b>reaction-diffusion</b> — Gray–Scott Turing patterns morphing across spatially-varied feed/kill regimes; click to seed. <code>bun run reaction-diffusion</code></td>
</tr>
</table>

…plus **`shader-forge`** (compile HLSL at runtime and ray-march it on the GPU), **`mandelbrot`** (infinite df64 deep-zoom), **`boids`** (GPU murmuration), and **`desktop-shader`** (DXGI-duplicate your *live desktop* and run CRT / underwater / ASCII shaders on it).

### The *"wait — that's TypeScript?!"* tier — a console, a brain, and a world

Not effects on a triangle: an actual emulated game console, a neural network that learns in front of you, an explorable 3D world, a physics sim, your live network, and your live screen — each one `.ts` file on the same engine.

<table>
<tr>
<td width="50%"><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/gameboy.png" alt="gameboy"><br><b>gameboy</b> — a complete <b>Game Boy (DMG)</b> emulated in pure TypeScript: full SM83 CPU + scanline PPU, GPU-rendered through D3D11, running the MIT <code>dmg-acid2</code> PPU acceptance test (the face renders correctly). Keyboard + XInput gamepad. <code>bun run gameboy</code></td>
<td width="50%"><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/neural-descent.png" alt="neural-descent"><br><b>neural-descent</b> — a real <b>neural network that trains itself live on the GPU</b>: forward pass, backprop and an Adam optimizer all hand-written D3D11 compute shaders. Watch the <code>NEURAL NET</code> half snap into focus to match the <code>TARGET</code> as the loss falls. <code>bun run neural-descent</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/voxelscape.png" alt="voxelscape"><br><b>voxelscape</b> — an explorable <b>raytraced voxel world</b>: procedural terrain, water, trees, sun, soft shadows, AO and fog, traced entirely by Amanatides–Woo DDA in one pixel shader. Fly with WASD + mouse, place/break blocks. <code>bun run voxelscape</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/net-radar.png" alt="net-radar"><br><b>net-radar</b> — every <b>real TCP/UDP socket</b> on your machine (<code>iphlpapi</code>) as a glowing, state-colored blip on a rotating GPU radar sweep, remote IPs reverse-resolved to hostnames (<code>ws2_32</code>), new connections punching out pulse rings. <code>bun run net-radar</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/cloth.png" alt="cloth"><br><b>cloth</b> — a <b>65,536-node soft-body flag</b> rippling in the wind: a Verlet + XPBD distance-constraint solver running as compute shaders, rendered as a glowing additive point cloud. <code>bun run cloth</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/cam-filter.png" alt="cam-filter"><br><b>cam-filter</b> — your <b>live desktop</b> (DXGI Desktop Duplication) re-imagined in real time through cycling GPU pixel-shader effects: Predator thermal, Sobel edge/toon, ASCII mosaic, and a kaleidoscope. <code>bun run cam-filter</code></td>
</tr>
</table>

### Audio — sound you can see

- **`sound-bloom`** — mic FFT painted as a click-through, full-desktop bloom overlay.
- **`oscilloscope-music`** — synthesized **stereo** PCM whose X/Y waveform *draws vector art* (it spells `BUN`).
- **`audio-visualizer`** — a MilkDrop-grade feedback visualizer reacting to your mic.
- **`vocoder`** — real-time mic → phase-vocoder pitch-shift/harmonize → speakers.
- **`event-horizon`** — a black hole that gravitationally lenses your *real, live desktop* via the Magnification compositor.

### Native power — *"wait, you can't do that in TypeScript"*

These touch hardware and the OS where JavaScript has never been allowed. Real output from this machine:

**`schannel-https`** — a real HTTPS request with **zero `fetch` / `node:https`**: a raw `ws2_32` socket carrying TLS records produced by the OS Schannel (SSPI) provider, driven by a hand-written TLS state machine.

```text
── TLS HANDSHAKE ─────────────────────────────────────────────────
  handshake     complete (3 ISC round-trips)
  tls version   TLS 1.2          cipher  TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 (0xc02b)
── SERVER CERTIFICATE CHAIN ──────────────────────────────────────
  [1] example.com → Cloudflare TLS Issuing ECC CA 1 → SSL.com TLS Transit ECC CA R2 → SSL.com TLS ECC Root CA 2022
── APPLICATION DATA (HTTP/1.1) ───────────────────────────────────
  │ HTTP/1.1 200 OK   (838 plaintext bytes decrypted by Schannel AEAD)
```

**`firmware-inventory`** — your machine's true hardware identity, parsed by hand out of the raw SMBIOS blob from `GetSystemFirmwareTable`:

```text
BIOS         American Megatrends Inc.  v2103 (09/30/2022)
SYSTEM       ASUS · ROG MAXIMUS Z690 HERO · UUID C7F1320B-…
PROCESSOR    12th Gen Intel(R) Core(TM) i9-12900KS · LGA1700 · 5148 MHz
MEMORY       2/4 slots · 64 GB · DIMM1 32 GB @ 5600 MT/s (Corsair)
```

| Demo | What it does that JS "can't" |
|------|------------------------------|
| **`http-server`** | A working HTTP/1.1 server on a raw `ws2_32` socket — no `node:http`, no `Bun.serve`. Open it in a browser. |
| **`tpm-oracle`** | Hand-crafts raw **TPM 2.0** command bytes to the security chip (`tbs`): true silicon RNG, the SHA-256 boot-attestation PCR banks, manufacturer/firmware. |
| **`crypto-forge`** | OS-native CNG (`bcrypt`): true RNG, SHA-256/512, AES-256-GCM + ECDSA/RSA sign/verify — with tamper-rejection round-trips. |
| **`etw-firehose`** | Subscribes to the kernel's **ETW** event stream — a live Procmon (process/image events) in TypeScript. |
| **`process-xray`** | Opens another process and reads its **live memory**, modules, threads, and full virtual-address-space map. |
| **`ddc-monitor`** | Talks **DDC/CI** over I²C to your physical monitor's firmware — read/set brightness, contrast, input source. |
| **`uia-automation`** | Drives another app's UI via **UI Automation** — walks the control tree and *clicks real buttons* (computes 5+3 in Calculator). |

## What's inside

Every published `@bun-win32/*` package — kernel32, user32, gdi32, gdiplus, d2d1, **d3d11**, dxgi, **d3dcompiler_47**, dwrite, dcomp, **xaudio2**, mfreadwrite, **secur32**, **bcrypt**, **tbs**, **dxva2**, **advapi32**/**tdh** (ETW), ws2_32, magnification, uiautomationcore, and 90+ more — re-exported as named bindings, plus the shared `Win32` namespace from `@bun-win32/core`. Methods bind lazily on first call; every call after that is a direct native pointer invocation with zero marshaling overhead.

```ts
import { D3d11, Kernel32, Secur32, Xaudio2_9 } from '@bun-win32/all';
```

For TypeScript enums, struct helpers, and packed-struct types, import from the specific package (those would collide across the namespace):

```ts
import { User32 } from '@bun-win32/all';
import { WindowStyles, ShowWindowCommand } from '@bun-win32/user32';
```

## Requirements

- [Bun](https://bun.sh) >= 1.1.0
- Windows 10 or later (the showcase GPU demos want a Direct3D 11 GPU)

## Notes

- This package has zero runtime cost — it's an index of re-exports; importing only what you use stays tree-shakeable.
- For FFI calling conventions, handle lifetimes, and pointer/buffer rules, see [`@bun-win32/core`](../core/AI.md) and individual package READMEs.
- AI agents: see `AI.md`.

## License

MIT
