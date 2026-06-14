# Seeing background / occluded / GPU windows — WGC under pure Bun FFI (2026-06-14)

> 4-agent Opus/ultracode spike (WGC vs DWM-thumbnail vs PrintWindow-reality → adversarial verify).
> **Verdict: feasible under pure Bun FFI; ship-decision = spike-then-build.** The agents LIVE-PROVED the
> two biggest unknowns this session. Answer to "why can't I see background windows like Alt+Tab does":
> we can — via **Windows.Graphics.Capture (WGC)**, the same DWM-composited surface Alt+Tab/taskbar previews
> read — and the foreign-thread dead-end is escaped by **polling** `TryGetNextFrame` (never `add_FrameArrived`).

## What's TRUE today (1.2.0), stated accurately (for the docs)

bun-uia already captures a specific top-level window **without foregrounding it** — even fully occluded /
behind other windows / off-screen — for the large majority of GDI/USER + many DWM/WPF windows (Explorer,
Notepad, Win32/WinForms/Qt-GDI, dialogs, most non-GPU Electron), via `captureWindowRGB`'s
`PrintWindow(PW_RENDERFULLCONTENT)` (window.ts:81) — PrintWindow asks the app to RE-RENDER into our DC, not
scrape the screen. It also reads the full UIA/native/MSAA tree of any background window untouched.

**The gap:** PIXELS of a GPU/DWM-composited surface — hardware-accel Chromium/Edge/Electron, fullscreen
games, some WinUI3/UWP/DirectComposition windows — where PrintWindow returns a **blank** rect (that content
is a GPU swapchain DWM composites at scan-out, with no CPU copy for WM_PRINT).

**Confirmed NON-fixes (document honestly):** DXGI Desktop Duplication (`_capture.ts`) returns only the final
COMPOSITED desktop — an occluded window's pixels are physically absent (you get the occluder). The screen-
region BitBlt fallback (`screen.ts` CAPTUREBLT) only works when the window is actually VISIBLE. DwmRegister-
Thumbnail composites onto a destination HWND, never readable back to CPU.

## The fix: WGC (recommended primary) — header-confirmed slots, polled

PRECONDITION — NO new FFI Symbols: combase `RoInitialize`/`WindowsCreateString`/`RoGetActivationFactory`/
`WindowsDeleteString` (Combase.ts), d3d11 `D3D11CreateDevice`/`CreateDirect3D11DeviceFromDXGIDevice`
(D3d11.ts), and the proven D3D11 vtable readback in `packages/all/example/_capture.ts`. New code = one
`packages/uia/wgc.ts` of `vcall`s. NOTE: `com.ts` `vcall` hardcodes `returns:i32`; the D3D11 readback
(GetDesc/CopyResource/Map/Unmap) needs void/u32 returns → reuse the `_capture.ts` vcall variant that takes a
`returns` param. **Every slot below SEGFAULTS on error — prove each in ISOLATION (hr===S_OK && out!==0n) before chaining.**

- **STEP 1 — activation [LIVE-PROVEN this session].** `RoInitialize` (MTA). `WindowsCreateString('Windows.Graphics.Capture.GraphicsCaptureItem')`. `RoGetActivationFactory(hstr, IID_IGraphicsCaptureItemInterop=3628E81B-3CAC-4C60-B7F4-23CE0E0C3356, &interop)`. Proven: hr=0x0, factory=non-null.
- **STEP 2 [gated].** `IGraphicsCaptureItemInterop::CreateForWindow = SLOT 3` (IUnknown base). `vcall(interop, 3, [u64,ptr,ptr], [hwnd, IID_IGraphicsCaptureItem=79C3F95B-31F7-4EC2-A464-632EF5D30760, &item])`.
- **STEP 3 [gated].** item `get_Size = SLOT 7` → SizeInt32 {i32 w@0, i32 h@4}.
- **STEP 4.** D3D11 device (reuse `_capture.ts` createDevice; HARDWARE→WARP, BGRA_SUPPORT). QI IDXGIDevice(54ec77fa-...). `CreateDirect3D11DeviceFromDXGIDevice(idxgi, &inspectable)`. QI IDirect3DDevice=A37624AB-8D5F-4650-9D3E-9EAE3D9BC670.
- **STEP 5 [gated — SEGFAULT + by-value packing risk].** `RoGetActivationFactory('Windows.Graphics.Capture.Direct3D11CaptureFramePool', IID_IDirect3D11CaptureFramePoolStatics2=589b103f-6bbc-5df5-a991-02e28b3b66d5, &statics2)` (NOT plain Statics — its Create is the DispatcherQueue variant). `CreateFreeThreaded = SLOT 6`. `vcall(statics2, 6, [u64,u32,i32,u64,ptr], [winrtDevice, 87/*B8G8R8A8UIntNormalized*/, 2, packedSize, &pool])` where `packedSize = (BigInt(h>>>0)<<32n)|BigInt(w>>>0)` assembled INLINE (no await before the call). Proven analogue: element.ts:467 POINT packing. If it segfaults, prove Create with a hardcoded literal size first.
- **STEP 6 [gated].** pool `CreateCaptureSession = SLOT 10` (Recreate6/TryGetNextFrame7/add8/remove9/CreateCaptureSession10). IID_IGraphicsCaptureSession=814E42A9-F70F-4AD7-939B-FDDCC6EB880D. Optional Win11: QI Session2(2C39AE40-...) `put_IsCursorCaptureEnabled SLOT7`(false); QI Session3(F2CDD966-...) `put_IsBorderRequired SLOT7`(false) to drop the yellow border.
- **STEP 7 [gated].** session `StartCapture = SLOT 6` (no args).
- **STEP 8 — POLL LOOP (the foreign-thread escape).** NEVER `add_FrameArrived` (pool slot 8). Loop `vcall(pool, 7 /*TryGetNextFrame*/, [ptr], [&frame])`; if `frame===0n` → `Bun.sleep(8)` retry (returns null when empty). On non-null: frame `get_Surface = SLOT 6`; QI IDirect3DDxgiInterfaceAccess=A9B3D012-3DF2-4EE3-B8D1-8695F457D3C1; `GetInterface = SLOT 3` → `vcall(access, 3, [ptr,ptr], [IID_ID3D11Texture2D=6f15aaf2-... , &tex])` → a real ID3D11Texture2D on OUR device.
- **STEP 9 — readback [PROVEN, verbatim from `_capture.ts:255-320`].** GetDesc(tex, slot 10); CreateTexture2D staging (USAGE_STAGING=3, CPU_ACCESS_READ=0x20000, dev slot 5); CopyResource (ctx slot 47); Map (ctx slot 14, MAP_READ=1) honoring RowPitch; Unmap (ctx slot 15); BGRA→RGB (window.ts:113-116) → `encodePNG`. Release frame each iteration.
- **STEP 11 — fallback companion (AFTER WGC ships green).** `DwmGetDxSharedSurface` — undocumented user32 export ordinal 0xE5/1731; `dlopen` user32 directly, empirical-contract caveat (fveapi convention), do NOT add to @bun-win32/user32 public Symbols. 6-arg `[u64 hwnd, ptr*5 out]→i32`, **LIVE-PROVEN** (ret=1, surface=0xc0003142, fmt=87 BGRA). Open via `ID3D11Device::OpenSharedResource=SLOT 28` (UNPROVEN, gate) on a device built on the returned adapter LUID. Cheap fast-path when ret!=0, fall through to WGC.

## Foreign-thread verdict: AVOIDED (iff add_FrameArrived is NEVER called)

`CreateFreeThreaded` makes a pool whose buffer-fill runs on its own internal worker thread (MS Learn). We
never subscribe `FrameArrived` → no JSCallback is ever installed → we drain the ring with a **synchronous
`TryGetNextFrame` on our Bun thread**, `Bun.sleep` between empties. This is the escape the dead UIA-events/
SetWinEventHook/WASAPI attempts LACKED (those had only a callback marshaled onto a DWM/MTA pump). Init MTA.
Residual unknown to watch: the worker thread is OS-owned; if a future Windows build made TryGetNextFrame
internally pump-dependent it could starve (low probability — the unpackaged Win32 C++ sample polls identically).

## Live-proof (SEE the pixels, never trust a non-black count)

Launch a hardware-accel Chromium tab on an animated WebGL/canvas page; FULLY OCCLUDE it (never foreground).
Baseline `captureWindowRGB(hwnd)` → expect BLACK (run isNearUniform to confirm). Run the WGC chain on the
SAME hwnd → `wgc-occluded.png` must show the LIVE animated content. SendUserFile both side-by-side and LOOK.
Loop ~10× to confirm the poll tracks animation. Edge cases: a 2nd-monitor window; confirm the Win11 yellow
border is gone after put_IsBorderRequired(false).

## Hard limitations (do not hand-wave)

(1) MINIMIZED windows have no live composed surface — none of WGC/DwmGetDxSharedSurface/PrintWindow yields
fresh pixels; only a brief `SW_SHOWNOACTIVATE` restore (no activation) or accept stale/iconic. (2) LOCKED /
disconnected-RDP / secure desktop — DWM stops compositing, TryGetNextFrame stalls null; detect-and-surrender.
(3) DRM/protected content renders BLACK by design. (4) Win11 yellow border default-on (suppressible, may be
policy-gated). (5) DwmGetDxSharedSurface is UNDOCUMENTED (survived Win7→Win11, used by OBS) and returns FALSE
for many classes — handle ret==0. (6) DXGI duplication + DwmRegisterThumbnail are confirmed dead-ends for
per-window occluded capture.

**Build order:** WGC first (supported, future-proof, header-gated); add DwmGetDxSharedSurface fast-path after
green; keep PrintWindow as the ships-now default for non-GPU windows.
