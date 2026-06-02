# DEMOS — prompt for a future Claude session

Paste the block below into a fresh session in this repo to have it conceive and ship a new series of groundbreaking, viral pure-TypeScript demos.

---

You're in the bun-win32 repo (Windows + Bun): ~110 hand-written FFI bindings to
Windows DLLs (@bun-win32/*) that let PURE TypeScript call the real Win32 API at
native speed — no addon, no C, no build step. Your mission: conceive and SHIP a
new series of genuinely GROUNDBREAKING, viral demos in packages/all/example/ —
the kind that make a senior engineer stop scrolling, screenshot it, and tweet
"wait, that's PURE TypeScript?!". Aim absurdly high (a GPU game, a neural net, a
live OS x-ray, an emulator), then make it actually run. Be crazy — then be real.

THE BAR — every demo must: (1) do something people don't believe JS/TS can do,
touching the GPU / audio DSP / network stack / TPM / kernel / another process /
physical hardware / ML; (2) be visually or experientially stunning; (3) ACTUALLY
RUN and be REAL — no fakes, no mockups, no "cheap little windows"; (4) be proven
by YOU having SEEN it work. Span categories — don't ship five particle demos.

BUILD ON WHAT EXISTS (read first, extend — don't re-derive vtable offsets):
- example/_gpu.ts — a verified pure-TS Direct3D 11 engine: runtime HLSL compile,
  vertex/pixel/COMPUTE shaders, structured buffers+UAVs/SRVs, textures, samplers,
  additive blend, dispatch, present, readback, the memoized vcall() COM-vtable
  invoker + slot constants, and createWindow (already visible+topmost+foreground).
- example/_audio.ts — WinMM mic capture + FFT + XAudio2 output.
- example/_capture.ts — DXGI desktop duplication screenshots.

FFI RULES: handles are bigint; pointer args are buffer.ptr; hand-pack structs in
Buffers assembled IMMEDIATELY before the call (no awaits between — GC invalidates
baked-in pointers); COM via vcall(thisPtr, slot, argTypes, args, returns) with
slots derived from SDK header declaration order and VERIFIED BY RUNNING (a wrong
slot segfaults).

HARD-WON DEAD-ENDS — don't waste a wave rediscovering these:
- WASAPI loopback (IAudioClient) segfaults through Bun FFI (cross-proc RPC proxy
  to audiodg.exe). Use WinMM waveIn for capture.
- A JSCallback only works when Win32 calls it on YOUR thread (EnumWindows, ETW
  ProcessTrace, the window message loop). It CANNOT run on a foreign OS/driver
  worker thread ("this thread lacks a Bun VM").
- Passing a by-value VARIANT/large struct to a COM method can segfault —
  restructure to avoid by-value aggregates.
- HLSL cbuffer matrices are COLUMN-MAJOR by default: upload transposed or declare
  `row_major`, or your 3D scene silently collapses to a line. Keep lookAt and
  perspective the same handedness.
- XAudio2 mastering voice needs Ole32.CoInitialize first. Gdiplus PNG CLSID is
  557CF406 (…F402 = GIF); GdiplusStartupInput is 24 bytes on x64.

VERIFICATION IS THE WHOLE GAME (this is where it goes wrong): "it built / exited
0 / presented N frames / a numeric check passed" is NOT proof it looks right.
Numeric and world-space proxies LIE — a flock collapsed to a line still passes a
"spread" check. VERIFY BY SEEING: capture the real rendered back-buffer
(PrintWindow PW_RENDERFULLCONTENT, or DXGI duplication) and inspect SCREEN-SPACE
pixels, or read the demo's real console output — and YOU look at every image
before calling it done. Sub-agents that must self-verify must read back the FINAL
PRESENTED back-buffer and analyze 2D pixel stats, never sim/world-space metrics.
Windows must be ShowWindow + HWND_TOPMOST + SetForegroundWindow or they open
hidden. Always honor a DEMO_DURATION_MS auto-exit + ESC + bulletproof teardown;
degrade gracefully when hardware is absent.

METHOD (ultracode, parallel Opus everywhere): per wave — (1) RECON in parallel:
feasibility-check each idea against the ACTUAL bindings and surface dead-ends
BEFORE building; (2) BUILD in parallel: one agent per demo on the shared engines,
each self-verifying by running; (3) POLISH: re-capture every visual yourself and
run a back-buffer-verified fix round on anything that isn't jaw-dropping. Then
wire package.json scripts + a README showcase with real screenshots/output, and
commit. Spawn as many agents as it takes.

GO BIGGER than fractals and particles. Strong candidates: a real-time path-traced
or rasterized 3D WORLD you fly through (physics, PBR, shadows); a NEURAL NET on
the GPU via @bun-win32/directml (image generation / style transfer / classifier,
pure TS); webcam (Media Foundation) → GPU/ML; a full GAME or EMULATOR (DOOM, Game
Boy, a RISC-V VM) rendered on the GPU with sound + gamepad input; a live
packet-level network visualizer; speech in/out; a 3D SPH/cloth/soft-body sim.
Pick the ones that force people to tweet about it. Then ship them — real, gorgeous,
and verified by your own eyes.
