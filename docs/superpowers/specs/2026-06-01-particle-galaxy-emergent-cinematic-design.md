# Particle Galaxy v2 — emergent arms, legible black hole, cinematic collision, richer beauty

Date: 2026-06-01
Target file: `packages/all/example/particle-galaxy.ts`
Builds on: `2026-05-30-particle-galaxy-self-gravity-design.md` (the PM self-gravity engine).

## Why

The engine already does real per-star gravity (2-D particle-mesh Poisson, conservative).
But it still *reads* as "stars programmed to orbit a center" because:

1. **The spiral is seeded, not grown** — 76% of stars are pinned to two perfect
   logarithmic arm ridges at t=0; gravity only nudges that painted pattern.
2. **The backbone dominates** — BH(18)+halo(60) ≈ 78 outweighs the disk's own gravity
   (≈46), and `SELF_G_GAIN` is tuned low so the disk stays a clean spiral. So the dominant
   on-screen motion really is smooth orbiting around the center.
3. **Collide is invisible + jolts** — `C` spawns an *unrendered* intruder black hole far
   off-axis; you see only its gravitational wake. And `collPull` adds ~7.5 to the camera
   distance in a single frame → a hard camera cut.

Owner's calls (locked):
- **Direction: emergent & alive** — seed a smooth warm disk + faint perturbation, let
  gravity GROW the arms (swing-amplified recurrent transient spirals).
- **Visuals: "make it amazing"** — owner delegated; do all four enhancements tastefully.
- **The center: make it legible** — show the mass everything orbits (core glow + a subtle
  gravitational-lensing warp + faint relativistic Doppler asymmetry). Not a sci-fi disk.

Visual bar unchanged: "That's just TypeScript?" — 4,194,304 stars, ~60fps, gorgeous.

## 1. Physics — emergent structure (the core fix)

Keep the proven conservative PM solver; move it into a self-gravitating regime.

- **Smooth seed.** Replace the m=2 log-spiral seeding with an axisymmetric exponential
  disk + bulge in real rotational equilibrium. Remove the arm-ridge pinning (`ARM_FRAC`→0).
  Add only a **faint perturbation**: low-amplitude broadband azimuthal/radial density noise
  (a few %), optionally a tiny random m=2..4 component, so swing amplification has a seed
  to grow. No painted arms.
- **Rebalance toward the disk.** Lower halo dominance (`M_HALO` 60→~30-40) and raise the
  disk's gravitational weight so the disk is dynamically self-gravitating (higher disk-mass
  fraction ⇒ lower Toomre Q ⇒ real spiral instability). Keep `M_BH` for the inner Keplerian
  whirl + a legible core, and keep enough halo for a flat-ish outer rotation curve and global
  stability. **Re-tune `SELF_G_GAIN` ↔ `DISK_SEED_W` together** so the LIVE field's disk
  support matches the SEED's `diskEnclosed·DISK_SEED_W` — the disk must START in equilibrium
  (verified by `ENERGY_PROBE` + captures), else it rings up or falls in.
- **Cool to Q ≈ 1.2–1.5.** Tune `VEL_DISP` to the sweet spot where arms continuously form,
  shear, and regenerate without the disk shattering into clumps.
- **Stability rails.** Grid-scale force softening (smooth `-∇φ` over ~1.5–2 cells) so the disk
  can't fragment into grid noise; more Jacobi passes for a clean field at the higher gain; keep
  the matched-CIC conservative force. All knobs stay `GAL_*` env-overridable.

Tuning is empirical: SELFSHOT capture sweep at sim t = 2 / 8 / 20 / 45 / 90 s + `ENERGY_PROBE`;
SEE each frame — must be born a smooth disk that spontaneously grows legible, evolving arms,
stay bound and beautiful, ~60fps.

## 2. Legible central black hole

- **Core accretion glow** — a brilliant, tight, slightly warm-white compact glow at the origin
  (HDR sprite/term) so the nucleus reads as a concentrated mass, distinct from the star cluster.
- **Gravitational-lensing warp** (screen-space, post): around the projected core, radially
  warp the UV sample of the scene (a subtle pinch + a faint Einstein-ring brightening) so the
  background/galaxy bends near the mass. Subtle — a hint, not a fisheye.
- **Relativistic Doppler asymmetry** — bias inner-cluster brightness/blue by the line-of-sight
  velocity component (approaching side brighter/bluer, receding dimmer/redder). Faint, tasteful.

## 3. HII star-forming regions

Screen-space emission pass that reads the **live PM density grid** (same unproject as the dust
pass): where overdensity is high (dense arm ridges), add glowing Hα-pink + OIII-cyan nebulosity,
soft-blurred for nebula feel, weighted toward the young/blue arm population. So stellar nurseries
glow exactly where gravity has concentrated matter — beauty that doubles as a physics tell.

## 4. Dramatic dust lanes

Deepen the existing density-driven extinction (`PS_DUST`): bolder peak optical depth, crisper
lanes, stronger inner-edge silhouette, so dark lanes carve through and outline the arms.

## 5. Supernova flashes

CPU scheduler fires rare flares (~one per few sim-seconds) at a random massive star in a dense
region: a bright expanding bloom flash + a localized radial **velocity shockwave** to nearby
stars (a tiny BANG injected into the integrate pass at that point). Transient life tied to physics.

## 6. Deep-space atmosphere + color

- Graded deep-space **background** (dark blue/violet vignette gradient + faint distant
  stars/galaxies) drawn behind the disk.
- **Diffraction starburst spikes** on the brightest giants (cross/star kernel in the bright/bloom
  path or per-bright-star spikes).
- Refined blackbody palette + bloom/ACES for the astrophotography look. Keep colour vivid through
  additive overlap (existing chroma-recovery).

## 7. Cinematic collision (fix `C`)

- **Visible companion**: render the intruder as its own small galaxy — a bright glowing nucleus
  + a compact star cluster (its own sprite population or a second small star set) — so you SEE
  two things collide. At minimum a brilliant cored companion; ideally with a few × 10⁴ companion
  stars sharing the same splat pipeline.
- **Real interaction**: keep the intruder as a softened well in the integrate pass; bring the
  encounter closer/lower (smaller impact parameter, start nearer the plane) so tidal **bridges
  and tails** form visibly between host and companion.
- **Smooth camera**: ease `collPull` (and any reframing) over ~1-2 s instead of a single-frame
  jump; gently track to keep both galaxies framed. No hard cut.

## Kept intact

All interactions (LEFT bang / RIGHT implode / MIDDLE vortex / orbit camera / pause / `[`,`]` /
`.` step / R reset / H help / ESC), the HDR→dust→bloom→ACES→GDI-HUD chain, `SELFSHOT`,
`ENERGY_PROBE`, every `GAL_*` knob. They read the new dynamics. Update the top docstring + refresh
`screenshots/particle-galaxy.png`.

## Performance

Screen-space passes (HII, lensing, background) are fullscreen — cheap. Supernova impulse is a
negligible add to integrate. Main cost levers (`GRID_N`, `JACOBI_ITERS`, companion star count)
stay env-tunable; validate fps stays ~60 interactive on the 4090 baseline (was ~57fps@4.19M).

## Validation

SEE it: SELFSHOT sweep at multiple sim times + a collision capture (`GAL_COLLIDE=1`) + an
`ENERGY_PROBE` conservation check. Then an adversarial multi-agent review (correctness / physics
equilibrium / GPU-binding & CB-offset / stability / perf) with independent verification, like the
v1 pass that found 8 real defects. Judge captures by the `SELFSHOT →` line + the PNG, not exit
code (known teardown segfault after the PNG is written).

## As-built (2026-06-01)

Implemented and verified visually on an RTX 4090 (4.19M stars, ~57fps SELFSHOT / ~159fps interactive
1-substep, clean exit).

**Physics — the hard part.** Naively switching to a smooth seed RINGED UP: the analytic seed used a
spherical enclosed-mass estimate for the disk's self-gravity, but the live PM solver computes the true
thin-disk radial force, and the mismatch drove an axisymmetric m=0 breathing mode. Fix = **startup
equilibrium calibration**: run the field solve once on the seeded positions, read back `forceBuf`,
azimuthally-average the inward self-gravity `g_r(r)`, and reseed every star's circular speed from the
MEASURED total force (`GAL_MEASURE_EQ`). That killed the ring-up. Then the regime hunt: pure emergence
from noise gives flocculent rings/winds, not open grand-design spirals (a known limit of collisionless
stellar disks — real ones need gas/driver). Landed on a **moderate, irregular log-spiral seed** (the
key bug was that a radial `cos(mφ)` perturbation winds straight into concentric rings — it must be a
`cos(m(φ−ARM_WIND·ln r))` LOG-spiral to start open) on a genuinely self-gravitating disk
(`M_HALO 60→30`, `STAR_MASS 1.1e-5→1.6e-5`, Toomre `VEL_DISP≈0.045`/Q≈1.3, `BULGE_FRAC 0.13→0.075`).
Result: arms are GROWN/sculpted by self-gravity (wind, feather, grow spurs + asymmetry, regenerate),
not painted — addressing the "feels programmed" complaint, while staying stable (luma flat t=8→70).

**Visuals.** Live-density arm lighting in the VS (young blue stars where gravity concentrated matter) +
Doppler beaming; a screen-space **FX pass** = legible BH (compact accretion glow + lensing warp + faint
Einstein ring) + HII pink/cyan nebulae from the density grid + supernova flashes; bolder dust lanes;
deep-space starfield + gradient in the composite; tamed central blob (centerDim + higher bloom knee).

**Collision (`C`) fixed.** Was an invisible intruder + a single-frame camera jolt. Now a VISIBLE
companion nucleus (second FX glow) on a closer grazing pass (`COLL_IMPACT 0.8→0.45·R`) that shears the
disk into dramatic tidal tails + a bridge, with an EASED camera (`collPullSmooth`). HII fixed to use
smooth value-noise + an absolute density floor + a steeper-ray cutoff (the first pass showed blocky
grid squares in the sparse tidal tail from near-horizon unproject aliasing).

**Review.** Adversarial 5-dimension workflow (CB offsets / GPU bindings / equilibrium math / shaders /
logic), each finding independently verified. Only ONE confirmed defect: R-reset didn't reset the
supernova scheduler (`snAge/snNext/snIdx`) → SNe stalled + lost SELFSHOT determinism post-reset. Fixed.
All `GAL_*` knobs remain env-overridable; `GAL_MEASURE_EQ=0` falls back to the analytic seed.
