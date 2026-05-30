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
> They're powered by [`example/_gpu.ts`](./example/_gpu.ts) — a ~pure-TypeScript **Direct3D 11 engine** (runtime HLSL compile, compute shaders, structured buffers/UAVs, textures, the whole COM vtable), [`example/_gpu3d.ts`](./example/_gpu3d.ts) (depth buffer + triangle-mesh drawing for the 3D demos), and [`example/_audio.ts`](./example/_audio.ts) (WinMM capture + FFT + XAudio2 streaming).

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
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/lenia.png" alt="lenia"><br><b>lenia</b> — <b>Lenia</b> continuous cellular automata: a smooth convolution-kernel + Gaussian growth field on a GPU compute shader grows organic, gliding lifeforms. <code>bun run lenia</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/ocean.png" alt="ocean"><br><b>ocean</b> — a real <b>3D ocean</b>: a sum-of-Gerstner-waves surface with per-vertex normals, sun glint, Fresnel sky reflection and foam, rendered as a depth-buffered triangle mesh (<code>example/_gpu3d.ts</code>). <code>bun run ocean</code></td>
</tr>
</table>

…plus **`shader-forge`** (compile HLSL at runtime and ray-march it on the GPU), **`mandelbrot`** (infinite df64 deep-zoom), **`boids`** (GPU murmuration), and **`desktop-shader`** (DXGI-duplicate your *live desktop* and run CRT / underwater / ASCII shaders on it).

### The *"wait — that's TypeScript?!"* tier — a console, a brain, and a world

Not effects on a triangle: an actual emulated game console, neural nets that learn / classify / write text in front of you, an explorable 3D world, a 3D fluid, your live network, and a raycast maze — each one `.ts` file on the same engine.

<table>
<tr>
<td width="50%"><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/gameboy.png" alt="gameboy"><br><b>gameboy</b> — a complete <b>Game Boy (DMG)</b> emulated in pure TypeScript: full SM83 CPU + scanline PPU + 4-channel APU audio, GPU-rendered through D3D11. <code>bun run gameboy</code> plays a real homebrew game — <i>Libbet and the Magic Floor</i> (zlib) — and it also passes the <code>dmg-acid2</code> PPU test (<code>GB_ROM=acid2</code>). Keyboard + XInput gamepad.</td>
<td width="50%"><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/neural-descent.png" alt="neural-descent"><br><b>neural-descent</b> — a real <b>neural network that trains itself live on the GPU</b>: forward pass, backprop and an Adam optimizer all hand-written D3D11 compute shaders. Watch the <code>NEURAL NET</code> half snap into focus to match the <code>TARGET</code> as the loss falls. <code>bun run neural-descent</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/voxelscape.png" alt="voxelscape"><br><b>voxelscape</b> — a raytraced voxel <b>survival sandbox</b> on an <b>enormous 384³ world</b> that regenerates at a keypress: build by day, then defend against escalating <b>night waves of mobs that hunt you down</b> (seek/hop AI, glowing eyes) with melee, bombs, TNT traps, lava and <b>meteor airstrikes</b>. Falling sand, flooding water, lava+water→obsidian, spreading fire, chain-reaction TNT with bullet-time, fleeing wildlife, flying debris, smooth shadows + AO, real water reflections + a fixed underwater view, an animated day/night sky, a health/wave/score HUD and procedural audio — all Amanatides–Woo DDA in one pixel shader. <code>bun run voxelscape</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/net-xray.png" alt="net-xray"><br><b>net-xray</b> — every <b>live TCP/UDP connection</b> on your machine (<code>iphlpapi</code>) as a force-directed <b>constellation</b>: local processes as glowing hubs, remote endpoints as nodes, edges igniting as sockets open and fading as they close, with a live top-talkers list. <code>bun run net-xray</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/cloth.png" alt="cloth"><br><b>cloth</b> — a <b>65,536-node GPU soft-body</b> you can play with: a Verlet + XPBD constraint solver in compute shaders, rendered as a lit, shaded surface. Pinned by its top corners (<code>P</code> cycles pin modes), <b>drag with the mouse to brush the fabric</b>, arrow keys orbit, <code>Q</code>/<code>E</code> zoom, <code>Z</code>/<code>X</code> wind. <code>bun run cloth</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/cam-filter.png" alt="cam-filter"><br><b>cam-filter</b> — your <b>live desktop</b> (DXGI Desktop Duplication) re-imagined in real time through cycling GPU pixel-shader effects: Predator thermal, Sobel edge/toon, ASCII mosaic, and a kaleidoscope. <code>bun run cam-filter</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/digit-oracle.png" alt="digit-oracle"><br><b>digit-oracle</b> — draw a digit with the mouse and a real <b>784→128→10 neural network</b> classifies it live, every matrix multiply a D3D11 <b>compute shader</b> (weights trained offline, baked in). Confidence bars react in real time. <code>bun run digit-oracle</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/nano-gpt.png" alt="nano-gpt"><br><b>nano-gpt</b> — a <b>111K-parameter character transformer</b> running its entire forward pass (multi-head causal attention + MLP) as D3D11 <b>compute shaders</b>, streaming generated text live beside a real causal-attention heatmap. <code>bun run nano-gpt</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/sph3d.png" alt="sph3d"><br><b>sph3d</b> — a <b>3D SPH fluid</b>: tens of thousands of GPU particles with an atomic spatial-hash neighbour grid, poured and sloshed in a box and stirred with the mouse, rendered as a glowing additive volume. <code>bun run sph3d</code></td>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/raycaster.png" alt="raycaster"><br><b>raycaster</b> — a <b>Wolfenstein-3D-style</b> textured maze rendered entirely in one pixel shader: DDA wall casting, procedural brick/stone textures, depth-shaded floor &amp; ceiling, sprites and a minimap. Walk it with WASD. <code>bun run raycaster</code></td>
</tr>
</table>

### Hardware & OS X-ray — your machine, live

<table>
<tr>
<td width="50%"><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/core-scope.png" alt="core-scope"><br><b>core-scope</b> — a live <b>per-CPU-core scheduler X-ray</b>: <code>ntdll</code> <code>NtQuerySystemInformation</code> sampled into a scrolling per-core utilisation <b>heatmap waterfall</b>, with the busiest processes ranked alongside. <code>bun run core-scope</code></td>
<td width="50%"><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/rf-radar.png" alt="rf-radar"><br><b>rf-radar</b> — a <b>WiFi RF radar</b>: real access points scanned via <code>wlanapi</code>, plotted on a green-phosphor scope by signal strength with a sweeping beam, channel/auth colours and live SSID labels. <code>bun run rf-radar</code></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/webcam.png" alt="webcam"><br><b>webcam</b> — your <b>webcam through Media Foundation</b> in pure TS (<code>mfreadwrite</code> <code>IMFSourceReader</code>), uploaded to the GPU and run through live pixel-shader effects — thermal, Sobel edge, ASCII, CRT. <code>bun run webcam</code></td>
<td></td>
</tr>
</table>

### Audio — sound you can see

- **`sound-bloom`** — mic FFT painted as a click-through, full-desktop bloom overlay.
- **`oscilloscope-music`** — synthesized **stereo** PCM whose X/Y waveform *draws vector art* (it spells `BUN`).
- **`audio-visualizer`** — a MilkDrop-grade feedback visualizer reacting to your mic.
- **`vocoder`** — real-time mic → phase-vocoder pitch-shift/harmonize → speakers.
- **`midi-music`** — generative music played live through the **Windows General-MIDI synthesizer** (`winmm` `midiOut`) — chords, arpeggios, bass and melody across GM instruments — visualised as a glowing piano-roll note-rain.
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
| **`packet-sniffer`** | Puts a raw `ws2_32` socket into **promiscuous mode** (`SIO_RCVALL`) and decodes live **IP / TCP / UDP / ICMP** packets straight off the wire into a streaming protocol waterfall. *(Run as Administrator.)* |

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
