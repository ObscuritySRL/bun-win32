# @bun-win32/all

> Every `@bun-win32/*` package in one install. The full Win32 surface area for [Bun](https://bun.sh) on Windows.

```sh
bun add @bun-win32/all     # scoped meta-package
bun add bun-win32          # unscoped alias (re-exports the same surface)
```

## What's inside

Every published `@bun-win32/*` package — kernel32, user32, gdi32, gdiplus, d2d1, d3d11/12, dwrite, dcomp, xaudio2, mfreadwrite, gameinput, webauthn, bcrypt, ncrypt, magnification, tbs, wer, ws2_32, iphlpapi, and 90+ more — re-exported as named bindings, plus the shared `Win32` namespace from `@bun-win32/core`. Methods bind lazily on first call; every call after that is a direct native pointer invocation with zero marshaling overhead.

```ts
import { D2D1, Kernel32, User32, Xaudio2_9 } from '@bun-win32/all';

const pid = Kernel32.GetCurrentProcessId();
const hwnd = User32.GetForegroundWindow();

// Or namespace-import the whole surface:
import * as Win32 from '@bun-win32/all';
Win32.Bcrypt.BCryptGenRandom(/* ... */);
```

For TypeScript enums, struct helpers, and packed-struct types, import from the specific package — those are not re-exported here because the namespace would collide:

```ts
import { User32 } from '@bun-win32/all';
import { WindowStyles, ShowWindowCommand } from '@bun-win32/user32';
```

## Showcase

The `example/` directory holds **26 cross-package demos** — single self-contained TypeScript files that compose many DLLs into one experience. Together they're ~21,500 lines of TypeScript proving what pure Bun FFI can do on Windows: real Win32 windows with DWM acrylic, FFI-driven audio synthesis, 60 fps GDI+ rendering, real Windows Hello passkey ceremonies, live wait-chain X-rays, TPM 2.0 hardware-RNG visualizations, full playable games, even a complete CHIP-8 emulator. No native build step, no Electron, no addon. Every byte goes through `bun:ffi`.

Run any of them with `bun --filter @bun-win32/all run example:<name>`.

### Audio + visual flagships

| Demo | What it does |
| --- | --- |
| **[demoscene](./example/demoscene.ts)** (1158 lines) | A self-running 75-second multi-scene demoscene production. Procedurally synthesized soundtrack (kick + snare + hat + 2-op FM lead + bass + pad, 110 BPM, ~12 MiB of stereo i16 PCM rendered in JS), GDI+ vector graphics on a DWM-Mica window driven by `IXAudio2SourceVoice::GetState` for sample-accurate visual sync. Five scenes — title, perspective tunnel, 3D starfield, metaballs, vertical-scrolling credits. ESC / SPACE skip / R restart. |
| **[synth-studio](./example/synth-studio.ts)** (1051 lines) | A full polyphonic 8-voice 2-operator FM synth playable from your computer keyboard. Streaming audio (4-chunk look-ahead with ring buffer), three presets (bell/brass/bass), `-`/`+` live FM-index trim, arrow keys for octave shift, live oscilloscope + 1024-point Hann-windowed FFT spectrum, live piano keyboard graphic with held-key highlighting. |
| **[live-piano](./example/live-piano.ts)** (840 lines) | Hum into your microphone and your laptop plays a piano back. Real-time autocorrelation pitch detection on 4096-sample windows, MIDI-snapped to a 5-octave piano keyboard, synthesized as additive sines (fundamental + 2nd + 3rd) through an XAudio2 streaming voice. Live waveform + measured-Hz vs target-Hz HUD. |
| **[fft-constellation](./example/fft-constellation.ts)** (879 lines) | Your microphone becomes a 3D star constellation. Real Cooley-Tukey FFT, 512 visible bins each mapped to a fixed 3D position; the whole sky rotates and pulses with the audio. Software 3D perspective projection. |

### Games

| Demo | What it does |
| --- | --- |
| **[asteroids](./example/asteroids.ts)** (1022 lines) | Full playable Asteroids clone. Vector graphics, momentum-based ship physics, screen-wrap, 3 lives, scoring, waves that scale in difficulty. Both keyboard (arrows + space) and Xbox controller (thumbstick + A/B/trigger) work additively. SFX (shoot, hit, death) synthesized procedurally through pooled XAudio2 source voices. |
| **[splitscreen-pong](./example/splitscreen-pong.ts)** (1055 lines) | Four-player local-multiplayer Pong with four Xbox controllers — one paddle per side of the court. Live AI fallback for disconnected slots, so the game works gracefully with 0-4 real controllers. 4 procedural SFX, screen-shake on score, live scoreboard. |
| **[chip8-bun](./example/chip8-bun.ts)** (1306 lines) | A complete CHIP-8 interpreter (1970s 8-bit virtual CPU) running in a real Win32 window. 64×32 phosphor display scaled to 640×320, 16-key hex keyboard mapped to `1234 QWER ASDF ZXCV`, sound timer drives an XAudio2 square-wave beeper, ~500 Hz cycle accuracy. IBM Logo ROM is bundled. F1 resets, Space pauses. |

### Live OS visualizations

| Demo | What it does |
| --- | --- |
| **[window-xray](./example/window-xray.ts)** (882 lines) | Click-through glass overlay HUD pinned to your cursor that reveals everything about whatever Win32 window is under it — class name, hwnd, owning process + image path, working set, window/extended styles bit-decoded, accessibility role via Oleacc, DWM cloaked/backdrop state, first thread's wait chain via Wer's WCT API. Spy++ on steroids. |
| **[os-tomography](./example/os-tomography.ts)** (757 lines) | Live thread wait-chain x-ray of every accessible process. Each process is a card sized by working set; its threads are mini-dots color-coded by what they're waiting on (CriticalSection / Mutex / ALPC / COM / Thread / Socket / Smb / dispatcher). |
| **[process-mandala](./example/process-mandala.ts)** (549 lines) | Your entire OS as a Buddhist mandala. Every running process arranged radially by parent-child relationships in concentric rings, each petal sized by `log(WorkingSet)`, colored by FNV-1a hash of its image name. Hover for a per-process tooltip. |
| **[network-aurora](./example/network-aurora.ts)** (716 lines) | Every active TCP/UDP connection becomes a flowing aurora-like band of light arcing from a central "this machine" anchor to a hash-positioned point on the outer ring (the remote host). Colored by state (Established / Listen / TimeWait / UDP). Refreshes once per second. |
| **[hid-rainforest](./example/hid-rainforest.ts)** (734 lines) | Every HID device on your computer — keyboards, mice, gamepads, fingerprint sensors, headset buttons — becomes a swaying plant rendered as Bezier-curve stems. Color from VID hash. Lives across the enumeration. |

### Desktop magic (transparent layered overlays)

| Demo | What it does |
| --- | --- |
| **[matrix-desktop](./example/matrix-desktop.ts)** (792 lines) | The Matrix digital rain falling on top of your real desktop. Fullscreen click-through `UpdateLayeredWindow` overlay, ~140 independent rain columns, glyph masks rasterized once via GDI+ then composited per-pixel in JS for full speed. XAudio2 ambient drone loops underneath. |
| **[conway-desktop](./example/conway-desktop.ts)** (438 lines) | Conway's Game of Life living over your actual desktop. ~14,000-cell grid, B3/S23 rules, click to seed a glider at the cursor, auto-reseed bursts every 15 s to prevent extinction, XAudio2 chirp on seed. |
| **[cursor-rain](./example/cursor-rain.ts)** (461 lines) | Particles fall from your mouse cursor onto the desktop with gravity + screen-edge bounce + fade-out. Click for a burst. Click-through layered overlay so you can keep working underneath. |
| **[keyboard-ghost](./example/keyboard-ghost.ts)** (438 lines) | A `WH_KEYBOARD_LL` global hook turns every keypress (anywhere, in any app) into a glowing letter that drifts upward and fades. |
| **[ghost-cursor](./example/ghost-cursor.ts)** (339 lines) | Twelve spring-physics ghost cursors trail behind your real one like a rainbow comet. Click-through, fullscreen, ~200 lines of body code. |
| **[window-cascade](./example/window-cascade.ts)** (1024 lines) | Enumerates every visible top-level window on your desktop and makes them all dance to a procedurally-synthesized 90 BPM beat with phase-staggered wiggle. Restores every original window position on exit. |

### Beautiful widgets

| Demo | What it does |
| --- | --- |
| **[acrylic-clock](./example/acrylic-clock.ts)** (403 lines) | An iOS-quality always-on-top desktop clock widget with DWM acrylic + rounded corners + dark mode. Antialiased analog face with smooth sub-second hand motion, hue-cycling tip on the second hand, 12-hour numerals in Segoe UI Light. Draggable from any pixel. |
| **[bun-os](./example/bun-os.ts)** (1356 lines) | A tiny "desktop OS" inside one Bun process. Software compositor painting a 32-bit ARGB framebuffer; three live "apps" rendered as draggable sub-windows — a Task Monitor with scrolling CPU%/RAM%/process-count graphs, a Music Player playing a 16 s procedurally-synthesized chiptune loop, and a smooth analog+digital Clock. Taskbar with start pill + app pills + live clock. Real mouse hit-testing for drag, focus, close. |
| **[clipboard-museum](./example/clipboard-museum.ts)** (987 lines) | Subscribes to `WM_CLIPBOARDUPDATE` (real clipboard listener) — every time you copy text, an image, or file paths, a beautiful animated card flies in from the right and stacks on the wall. Hover to expand, right-click to dismiss. |
| **[time-machine](./example/time-machine.ts)** (919 lines) | A 30-second screen-and-audio ring buffer. Captures your primary monitor at 10 fps via `BitBlt`; press Ctrl+Alt+R and the last 30 seconds are encoded to disk as an animated GIF. NVIDIA ShadowPlay-style instant replay in pure TypeScript. |
| **[tpm-lavalamp](./example/tpm-lavalamp.ts)** (704 lines) | A lavalamp where every metaball's initial position and motion vectors come from bytes pulled directly from your computer's TPM 2.0 hardware random number generator via `Tbsip_Submit_Command` issuing real TPM2_GetRandom commands. Graceful fallback to `BCryptGenRandom` when no TPM is present. |
| **[magnify-lab](./example/magnify-lab.ts)** (399 lines) | Recolors your entire desktop in real time via `MagSetFullscreenColorEffect`. Eight 5×5 color matrices selectable with `1`-`8` — Identity, Grayscale (Rec. 709), Sepia, Photo Negative, Protanopia, Deuteranopia, Tritanopia, Hot Take. Floating HUD shows the active matrix. |

### Real Windows magic

| Demo | What it does |
| --- | --- |
| **[webauthn-orbs](./example/webauthn-orbs.ts)** (1268 lines) | Drives a real FIDO2 passkey registration + assertion ceremony against the Windows Hello platform authenticator (face / fingerprint / PIN), visualized as a circle of glowing orbs in a DWM-Mica window. Eight phases — challenge generation via `BCryptGenRandom`, RP+user entity build, clientDataJSON+SHA-256, `WebAuthNAuthenticatorMakeCredential` (real Hello prompt), attestation decode (AAGUID + flags + sign-counter), fresh challenge, `WebAuthNAuthenticatorGetAssertion`, signature verification. The credential id becomes a colored 4×4 identicon next to its orb. |
| **[wallpaper-forge](./example/wallpaper-forge.ts)** (997 lines) | Generates a 1920×1080+ procedural wallpaper with GDI+ (five preset aesthetics — Aurora, Voronoi, Synthwave Grid, Particle Field, Wavy Lines), saves it as PNG via the GDI+ image encoder, then sets it as your real Windows desktop wallpaper via `SystemParametersInfoW(SPI_SETDESKWALLPAPER, …)`. Press `1`-`5` to swap presets, `R` to reroll the seed, `D` for default. |

## Requirements

- [Bun](https://bun.sh) >= 1.1.0
- Windows 10 or later (most demos need 11 for the cleanest DWM acrylic / Mica look)
- For specific demos: a microphone (`live-piano`, `fft-constellation`), an Xbox controller (`asteroids`, `splitscreen-pong` — both have AI fallbacks), Windows Hello configured (`webauthn-orbs`), a TPM 2.0 (`tpm-lavalamp` — has Bcrypt fallback)

## Notes

- This package has zero runtime cost — it's an index of re-exports. Importing only what you use stays tree-shakeable.
- For runtime details (FFI calling conventions, handle lifetimes, pointer/buffer rules), see [`@bun-win32/core`](../core/AI.md) and individual package READMEs.
- AI agents: see `AI.md` for guidance on using the meta-package.

## License

MIT
