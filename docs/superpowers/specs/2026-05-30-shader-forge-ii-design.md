# Shader Forge II — interactive, JIT-recompiling cinematic ray-marcher

**Date:** 2026-05-30
**File:** `packages/all/example/shader-forge.ts` (single self-contained demo; reuses `_gpu`/`_hud`/`_snapshot`)
**Goal:** turn the 5-scene auto-cinematic into a 10-scene interactive engine with a free
camera, a director's console, a live HLSL JIT-recompile flex, a compute-driven scene, and a
full cinematic post stack — all pure TypeScript over Bun FFI → D3D11.

## Non-negotiable constraints (from prior battle scars)

- **One shader per scene.** A single uber-marcher inlines every SDF at every march/normal/
  shadow/AO/reflection call site and FXC never returns. Each scene is its own pixel shader:
  `ENGINE_HEADER + sceneSDF + ENGINE_BODY`, compiled independently (~60 ms each).
- **No backticks inside HLSL strings** (they're JS template literals).
- **cbuffer HLSL layout must byte-match the TS `Buffer.writeFloatLE` offsets** — exact tables below.
- **Cast-free** TS: read from owned Buffers / `.ptr!`, COM ptrs are `bigint`+`u64`. `tsc` must be 0.
- **Headless compile verified:** `gpu.compile()` needs only `d3dcompiler_47` (no device), so each
  scene marcher is compile-timed in isolation before integration (catches FXC time-bombs).
- **Verify visually, not numerically:** capture each scene's back buffer (`SCENE=n SELFSHOT=1`)
  and LOOK at the PNG. Numeric/world-space checks get fooled.

## Scene roster (10 marchers; each defines `Hit sceneMap(float3 p)` + `static const int SCENE_ID`)

| ID | Name | Technique |
|----|------|-----------|
| 0 | Chrome Cathedral | existing — liquid-chrome SDF + mirror floor + real 1-bounce reflection |
| 1 | Bioluminescent Reef | existing — glowing coral domes |
| 2 | Apollonian Engine | existing — Apollonian gasket fractal |
| 3 | Mandelbox Citadel | existing — folded Mandelbox |
| 4 | Storm Sea of Light | existing — analytic ocean + foam |
| 5 | Glass & Dispersion | **new** — Snell refraction, 2–3 internal bounces, RGB IOR split → spectral caustic glow |
| 6 | Volumetric Clouds | **new** — density march (fbm), Henyey-Greenstein in-scatter, silver lining |
| 7 | Quaternion Julia | **new** — 4D Julia slice, morphing c, iridescent thin-film, orbit-trap palette |
| 8 | Synthwave Menger | **new** — neon grid horizon + folded Menger megastructure + chrome sun + scanlines |
| 9 | Living Membrane | **new** — Gray-Scott reaction-diffusion (compute → UAV texture) sampled as emissive skin + displacement on an organic SDF |

## Frozen scene contract (what each `sceneSDF` may rely on)

Provided by `ENGINE_HEADER` (before the SDF): `Frame` cbuffer (b0), `PI`/`TAU`, `hash21/hash31/
noise3/fbm`, `rotX/rotY/rotZ`, `sdSphere/sdBox/sdRoundBox/sdTorus/sdCyl/opSmoothUnion/opSmoothSub`,
`struct Hit { float d; float3 albedo; float metal; float rough; float3 emissive; }`, and (for
scene 9) `Texture2D SimTex : register(t0); SamplerState SimSmp : register(s0);`.

Each scene **must** define exactly one `Hit sceneMap(float3 p)` and one `static const int SCENE_ID`.
It **may** define private helpers (prefix them to avoid clashes). It must **not** redefine engine
helpers or `main`. Keep shadow/AO usage modest in heavy scenes; reflections route through
`SCENE_ID`-gated branches (compile-time constant → only the needed branch compiles).

`ENGINE_BODY` (after the SDF) supplies `calcNormal`, `softShadow`, `calcAO`, sky/IBL, `shadePoint`,
reflection/refraction tracers, the primary march, god-rays, fog, and `main` which outputs
`float4(radiance.rgb, linearDepth)` — **depth packed in alpha for DOF**. Sky/miss writes a large
far depth.

## JIT recompile scheme (the headline flex)

Scene source is built as `defines + ENGINE_HEADER + sceneSDF + ENGINE_BODY` where `defines` is a
small `#define` block driven by live state. Changing one re-invokes `D3DCompile` on the **active
scene only** (~60 ms, one frame hitch) and hot-swaps the `ID3D11PixelShader` (release old). Other
scenes are marked dirty and lazily recompiled when next shown. HUD flashes `JIT <ms> ms`.

JIT'd `#define`s: `MARCH_STEPS` (quality 64/128/256), `TONEMAP` (0 ACES / 1 AgX / 2 Reinhard — in
the post shader), `FRACTAL_ITERS` (scenes 2/3/7/8), `PALETTE` (0..3). Instant **uniform** toggles
(no recompile): bloom/god-rays/fog/AO/reflections amounts, exposure, aberration, DOF, vignette,
grain — read from the cbuffer as multipliers.

## cbuffer byte layouts (exact — HLSL must match TS offsets)

### `Frame` (scene marchers, register b0) — 80 bytes
```
 0 float2 iResolution      8 float  iTime          12 float  iSceneFade
16 float  iCamYaw         20 float  iCamPitch      24 float  iCamDist      28 float iCamRoll
32 float3 iCamTarget                                44 float  iQuality
48 float  iAO             52 float  iReflect       56 float  iFog          60 float iGodrays
64 float  iEmissive       68 float  iShadow        72 float  iWarp         76 float iPad
```

### `Post` (post passes, register b0) — 80 bytes
```
 0 float2 iResolution      8 float  iTime          12 float  iBlend
16 float  iExposure       20 float  iBloom         24 float  iVignette     28 float iGrain
32 float  iAberration     36 float  iDof           40 float  iFocus        44 float iFlare
48 float  iMotionBlur     52 float  iAccum         56 float2 iCamVel
64 float2 iJitter         72 float  iSaturation    76 float  iPad
```

## Pipeline per frame

0. **Compute** (always, so it's alive when you switch to it): dispatch Gray-Scott step into
   `simTex` (UAV); ping-pong two R16G16 textures.
1. **PASS A** — march active scene → `hdrA` (rgb + depth.a). During a fade, march next → `hdrB`.
2. **PASS B** — spiral bright-pass bloom of `lerp(hdrA,hdrB,blend)` → `bloomTex`.
3. **PASS C** — cinematic composite → back buffer: DOF bokeh gather (CoC from |depth−iFocus|,
   focus = camera→target distance), + bloom, anamorphic lens flare from bright spots, chromatic
   aberration, directional motion blur (`iCamVel`), ACES/AgX/Reinhard (JIT), grade, vignette,
   dithered grain.
4. **Resolve/TAA** — when `iAccum>0` (photo mode / idle camera) blend PASS C output with a history
   texture and update history → crisp, denoised stills. Otherwise pass through.
5. **HUD** — composited into the back buffer (`_hud`): scene name + live keymap console (Tab),
   fps, GPU, last JIT time. Hidden in photo mode.

## Controls

Edge-detected each frame from `win.keyDown(vk)` (track prev set). Mouse drag = orbit (`getMouse`
delta while down). Wheel via an **additive** `_gpu.ts` change (capture `WM_MOUSEWHEEL` +
`WM_RBUTTONDOWN/UP`, expose `getWheel()` consuming the accumulated delta; `getMouse()` also returns
`rightDown`). Keyboard dolly (`Z`/`X`) as a wheel-free fallback.

```
Mouse drag .. orbit      Wheel / Z X .. dolly       W A S D / Q E .. fly target
Space ....... pause      [ ] .......... prev/next   1..0 ........... jump to scene
C ........... cinematic auto-camera    Tab .......... HUD console
B G F A R ... bloom / god-rays / fog / AO / reflections
- = ......... exposure                 , . .......... march quality (JIT)
T ........... tonemap op (JIT)         I ............ fractal iters (JIT)
M ........... motion blur              K ............ chromatic aberration
P ........... photo mode (hide HUD + temporal-accumulate + write PNG)
ESC ......... exit
```

## Compute reaction-diffusion (scene 9 + the compute flex)

Two `R16G16_FLOAT` textures (UAV+SRV), ping-ponged. A `cs_5_0` Gray-Scott kernel reads `prev`
(SRV) and writes `next` (UAV) each frame (`[numthreads(16,16,1)]`, seeded with a few spots). Scene
9's `sceneMap` samples the latest as emissive skin + a small displacement on a smooth organic SDF.
The sim advances every frame regardless of active scene so switching to it shows a living field.

## Verification plan

1. `bunx tsc --noEmit` (or repo's tsc) clean; cast-free audit unaffected.
2. Headless compile harness: every scene marcher + every post pass compiles; print per-scene ms;
   flag any > ~1.5 s (FXC time-bomb).
3. Adversarial HLSL review (workflow): one agent per scene reviews correctness/perf/aesthetic.
4. Run with `SCENE=0..9 SELFSHOT=1` → capture each PNG → **look at every one**; fix anything ugly.
5. Regenerate gallery `packages/all/screenshots/shader-forge.png` from a hero frame.
6. Exercise live controls (orbit, JIT recompile shows new `ms`, photo mode writes a clean still).

## Out of scope

Audio reactivity, networked control, saving/loading camera paths, more than one compute sim.
```
