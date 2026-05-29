# @bun-win32/all — Flagship Showcase Demos

Date: 2026-05-28
Status: Approved-by-delegation (user gave full creative autonomy: "be creative, stop at nothing, test that they run, add to scripts + README").

## Goal

Add a small set of **never-before-seen** showcase demos to `@bun-win32/all` that prove
Bun + TypeScript can drive the real Win32 surface — GPU, audio, the live desktop — at
native speed through pure FFI. Each demo must combine **several** Win32 APIs at once and
cover visual + (audio | input). They must run, function correctly, and be visually
stunning. Anti-pattern (per the user): `bun-os.ts` — "cheap little windows", a tech-demo
catalog that does nothing real.

## Context

- 26 substantial demos already exist in `packages/all/example/`. They are window-based
  (GDI / GDI+ DIB / layered ARGB), audio via XAudio2 / WinMM, input via User32 / XInput.
  None are currently documented in any README.
- The repo's FFI conventions: handles are `bigint`, pointer args are `buffer.ptr`, wide
  strings via `Buffer.from(s + '\0','utf16le')`, COM methods invoked through a memoized
  `vcall(thisPtr, slot, argTypes, args, returns)` vtable invoker (the implicit `this` is
  prepended by the helper, so `argTypes` exclude it). Structs are hand-packed `Buffer`s
  assembled immediately before the blocking call (GC window).
- A recon pass (11 agents) confirmed feasibility + concrete implementation paths for the
  four flagships below, citing proven primitives in shipped per-package examples.

## The four flagships

### 1. `shader-forge.ts` — runtime-compiled GPU ray-marcher
Compile an HLSL fullscreen-triangle VS + ray-march PS at runtime with
`d3dcompiler_47!D3DCompile`, create a real `D3D11CreateDeviceAndSwapChain` device against a
borderless `WS_POPUP` User32 window, and run a per-frame render loop entirely through
raw-vtable COM calls (`CreateVertexShader`/`CreatePixelShader`/`CreateBuffer`/`GetBuffer`/
`CreateRenderTargetView`/`OMSetRenderTargets`/`RSSetViewports`/`VSSetShader`/`PSSetShader`/
`PSSetConstantBuffers`/`Draw`/`Present`). Mouse + time + resolution fed via a constant
buffer. HUD shows live compile timing + FPS.
- Proven: `D3DCompile` + `ID3DBlob` walk (hlsl-disco.ts), `D3D11CreateDeviceAndSwapChain`
  (d3d11-device-probe.ts), raw-vtable invocation of `CreateTexture2D@0x28`
  (d3d11-interop-probe.ts), DXGI vtable calls (gpu-observatory.ts), windowing (mouse-trail.ts).
- Risk: ~14 vtable slot offsets derived from d3d11.h/dxgi.h header order; verify by running.
- Fallback: render to an offscreen RT (CreateTexture2D proven) + GDI `StretchDIBits` blit.

### 2. `sound-bloom.ts` — desktop-wide audio-reactive overlay
WASAPI **loopback** capture (`IMMDeviceEnumerator` → `GetDefaultAudioEndpoint(eRender)` →
`IMMDevice::Activate(IAudioClient)` → `Initialize` w/ `AUDCLNT_STREAMFLAGS_LOOPBACK` →
`GetService(IAudioCaptureClient)` → poll `GetBuffer`), FFT in TS (reuse fft-constellation's
radix-2), painted as glowing spectrum/particles onto a click-through
`WS_EX_LAYERED|TRANSPARENT|TOPMOST|TOOLWINDOW|NOACTIVATE` fullscreen ARGB layered window via
`UpdateLayeredWindow`. Reacts to whatever's playing (Spotify/YouTube/games).
- Proven: mmdevapi enumeration + activation (audio-device-radar.ts, factory-probe.ts),
  layered ARGB overlay (ghost-cursor.ts), FFT (fft-constellation.ts).
- Risk: IAudioCaptureClient loopback vtable offsets (the one unproven step). MTA required.
- Fallback: WinMM `waveIn` mic capture (proven) feeding the identical overlay renderer.

### 3. `event-horizon.ts` — a black hole that devours your live desktop
Animate `MagSetFullscreenTransform` (zoom/pan the whole live desktop toward a moving
singularity) + a per-frame `MagSetFullscreenColorEffect` 5×5 matrix (redshift / crush to
black near the horizon) so the real desktop is visibly sucked in, with a swirling GDI+
accretion-disk drawn on a `WS_EX_LAYERED|TOPMOST|TRANSPARENT` overlay
(`SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` so the magnifier never re-samples it),
plus a looping XAudio2 sub-bass rumble (`XAUDIO2_LOOP_INFINITE`, no callback). Mouse/XInput
moves the singularity. Guaranteed restore-on-exit handlers.
- Proven: fullscreen color/transform live (screen-color-lab.ts, magnification-diagnostic.ts),
  overlay window (mouse-trail.ts), GDI+ glow (generative-poster.ts), looping XAudio2
  (fm-synth.ts).
- Risk: leaving the desktop warped if it crashes → mandatory SIGINT/exit restore.
- Fallback: pure-fullscreen (no overlay) + terminal ANSI accretion disk.

### 4. `oscilloscope-music.ts` — sound that draws itself
Stream synthesized **stereo** PCM through XAudio2 (ring of 4 long-lived buffers, poll
`GetState.BuffersQueued`, resubmit ahead — no callback) where the L/R sample pair is the
(x,y) of a vector figure, so an XY (Lissajous) plot of the speaker output IS the picture.
Render the live phosphor XY scope in a real GDI window (`Polyline` + decaying back-buffer),
DirectWrite-baked HUD, XInput thumbsticks morph the figure (Lissajous ratio / phase / spin).
- Proven: full XAudio2 streaming chain (fm-synth.ts), windowing (mouse-trail.ts), GDI
  back-buffer, DirectWrite alpha texture (glyph-forge.ts), XInput (splitscreen-pong.ts).
- Risk: continuous resubmission ring + PCM buffer GC lifetime; PeekMessage pump.
- Fallback: terminal 24-bit ANSI / braille phosphor scope (proven render style).

## Conventions every demo must follow

- No verbose section-comment blocks; `/** @inheritdoc */` style only. Top-of-file doc
  comment describing the pipeline + APIs (matches existing demos).
- Copy the `vcall` vtable invoker verbatim from fm-synth.ts where COM is used.
- Robust teardown: restore Magnification, destroy windows/voices/GDI objects, on both ESC
  and SIGINT/exit. Every demo honors `DEMO_DURATION_MS` env (auto-exit) so the screenshot
  harness can drive it and it self-terminates even if the kill is missed.
- Windowed only — never fullscreen-exclusive (`SetFullscreenState`). Graceful degradation
  when a capability is absent (no audio endpoint, RDP session, no GPU, no controller).

## Verification

1. Build phase (parallel): write + `bun build --target=bun` static check + self-review.
   Windowed demos may run a short (<= 3s) self smoke-test; `event-horizon` is verified
   attended (not smoke-run in parallel) because a crash could leave the desktop warped.
2. Verify phase (sequential, attended): run each via `example/_screenshot.ts <name>`,
   inspect the PNG for beauty + non-crash; debug offenders with a focused agent.
3. Wire into `packages/all/README.md` showcase (with screenshots), add run entries, final
   `tsc` / audit sweep, commit.
