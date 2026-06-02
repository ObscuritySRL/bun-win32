# Particle Galaxy — real per-star self-gravity (2-D particle-mesh + central black hole)

Date: 2026-05-30
Target file: `packages/all/example/particle-galaxy.ts`

## Goal

Replace the current **radial mean-field** gravity (mass binned by radius → a single
`M(<r)` curve → a purely central pull) with **genuine per-star gravity**: every star
deposits its own mass onto a 2-D field, and every star feels `-∇φ` from that field, so
neighbours actually attract, dense regions deepen their own wells, and spiral
arms / clumps / spurs **self-organise** instead of being a painted-on kinematic pattern.

Each star also gets its **own mass** (a Salpeter-like IMF), and the whole disk orbits a
heavy, invisible **central black hole** wrapped in a brilliant nuclear star cluster.

Visual bar: "That's just TypeScript?" — it must look incredible, hold 4,194,304 stars,
and stay at/near 60fps.

## Decisions (locked with the owner)

1. **Field:** 2-D particle-mesh in the disk plane (x,z); motion stays fully 3-D (stars bob
   in y, vertical handled by an analytic restoring force). Not a full 3-D grid — wasted
   compute on empty space above/below a thin disk.
2. **Black hole:** invisible (realistic), wrapped in a dense bright golden nuclear cluster.
   Its gravity is a heavy softened point mass at the origin and doubles as the stabilising
   backbone that stops the PM disk from ringing up.
3. **Masses:** Salpeter-like IMF (m^-2.35). Heavy stars are rendered **bigger & brighter**
   AND pull harder (deposit more mass) → giants become local anchors that gather neighbours.
4. **Solver:** warm-started iterative relaxation (Jacobi/Gauss-Seidel), not FFT.

## New force model (per star, per step)

```
a = a_BH        // -G·M_BH·rhat / (r² + soft_BH²)        softened point mass (invisible)
  + a_halo      // -G·M_halo_enc(r)·rhat / (r² + soft²)   analytic flat-curve backbone (kept)
  + selfGain·a_self   // -∇φ sampled from the 2-D PM field the stars build       NEW
  + a_interaction     // BANG impulse / IMPLODE well / VORTEX swirl (kept)
```

`a_self` replaces the old `selfGain * selfEnclosed(rin)` radial term entirely. The
`clearBins` / `deposit(radial)` / `scan` passes are deleted.

## 2-D particle-mesh pipeline (per physics sub-step)

Grid: `GRID_N × GRID_N` cells (start 512²) covering `[-FIELD_HALF, +FIELD_HALF]` in x and z.
`FIELD_HALF ≈ GALAXY_RADIUS * 1.6` so the disk's own potential is ≈0 at the grid boundary
(makes Dirichlet φ=0 boundary acceptable — the global field is carried analytically by BH+halo).
`CELL = 2*FIELD_HALF / GRID_N`. World→cell: `cx = (x + FIELD_HALF)/CELL`.

GPU buffers (structured, indexed `i = gy*GRID_N + gx`):
- `densBuf`  : `uint`  fixed-point surface mass per cell (atomic deposit target).
- `srcBuf`   : `float` Poisson source `b = 4πG·Σ`, Σ = (mass/MASS_SCALE)/CELL_AREA.
- `phiA/phiB`: `float` potential, **persisted across frames** (ping-pong, warm start).

Passes:
1. **CS_CLEARGRID** — zero `densBuf` (GRID_N² threads).
2. **CS_DEPOSIT** — each star Cloud-in-Cell (bilinear) splats `Pos.w` mass across its 4
   nearest cells, fixed-point `InterlockedAdd`. Heavier star → more mass.
3. **CS_SOURCE** — `srcBuf[i] = FOURPIG * (densBuf[i]/MASS_SCALE) / CELL_AREA`.
4. **CS_JACOBI** ×K (warm-started, ping-pong A↔B) — 5-point stencil
   `φ_new = 0.25*(φL+φR+φU+φD - CELL²·src)`, Dirichlet φ=0 at the boundary. K≈24-40,
   warm start makes that plenty since the field barely changes per frame.
5. **CS_INTEGRATE** — sample `a_self = -∇φ` (bilinear gather + central difference on the
   final φ buffer), add `a_BH + a_halo + interactions`, leapfrog KDK, clamp, respawn.

No separate force buffer — the gradient is finite-differenced inside integrate.

## Per-star mass (IMF) + appearance

- Seed `Pos.w` from a Salpeter draw on `[M_LO, M_HI] = [0.1, 30]`, slope -2.35, via inverse
  CDF. Normalise the *batch* so total disk mass ≈ today's `PARTICLE_COUNT * STAR_MASS` (keeps
  the rotation-curve magnitude, so the existing tuning stays in range).
- VS: `sizeFactor` and `brightness` scale with mass (e.g. `~ mass^0.33` for size, brighter +
  bluer for the rare giants). Giants read as hot blue-white anchors; because they deposit more
  mass, structure visibly forms around them.

## Central black hole + nuclear cluster

- `M_BH` heavy softened point mass at origin (invisible). `soft_BH` small but nonzero
  (anti-singularity). Tuned so the inner disk is clearly Keplerian (fast whirl).
- Keep a dense bright bulge population (the nuclear cluster) and the golden core glow.
- Seed circular speeds include BH + halo + analytic disk-enclosed so the disk starts balanced.

## Constant-buffer / dispatch changes

- `Sim` cbuffer: swap the old `gBins (NBINS, binDr, massScale, binRmax)` for
  `gGrid (GRID_N, FIELD_HALF, CELL, massScale)` and add BH params to `gGrav`/a new slot
  (`gBH = (M_BH, soft_BH, fourPiG, cellArea)`). Recompute `SIM_CB_SIZE` (multiple of 16).
- Dispatch order per sub-step: clearGrid → deposit → source → jacobi×K (ping-pong) →
  integrate. Bind/unbind UAVs each pass (the codebase's csSet(0n,…) pattern).
- φ buffers are NOT recreated/cleared per frame (warm start); only `densBuf` is cleared.

## Stability plan (the real risk)

A pure 2-D PM disk can go Toomre-unstable / ring up — that's why the radial solve existed.
Mitigations, in order of importance:
1. **Dominant BH + halo backbone** carries the smooth global field and raises Toomre Q so the
   PM only adds local structure (can't ring up globally).
2. Toomre-warm seed (existing `VEL_DISP`), grid softening (≥1.5 cells folded into the field),
   the existing acceleration/speed clamps.
3. `selfGain` is a tuning knob: start modest, raise until clumps/spurs appear but the disk
   still holds as a legible two-arm spiral.

## Performance

- Deposit: 4M CIC atomic adds across 262k cells — *less* contention than today's 256 bins.
- Jacobi: 262k cells × K≈30 ≈ 8M trivial stencil ops — cheap.
- Force sample: 4M bilinear φ gathers — cheap.
- Target full 4M @ ~60fps. Fallbacks if needed: 384² grid, fewer Jacobi passes, or a coarser
  warm-started multigrid V-cycle.

## Validation (SEE it, don't trust numbers)

Drive the existing `SELFSHOT` capture loop at sim t = 0.5 / 3 / 10 / 30 / 60 s and **look** at
each PNG:
- t=0.5/3: born as a clean spinning two-arm spiral, bright golden core, not ringed/blown.
- t=10/30: arms wind under real differential rotation AND grow local clumps/spurs/feathering
  (the new self-gravity), giants visibly anchoring structure — not a featureless ring.
- t=60: still a legible galaxy (held together by BH+halo+self-gravity), not dispersed/collapsed.
Watch for the known teardown segfault at process exit (after the PNG is written) — judge by the
`SELFSHOT →` line, not the exit code.

## Out of scope / unchanged

HDR splat → bloom → ACES → vignette → GDI HUD render chain, orbiting cinematic camera,
LEFT/RIGHT/MIDDLE/R interactions, SELFSHOT path. They just read the new dynamics. Rewrite the
top-of-file docstring + the stale `:409-411` "stars pull on each other" comment to describe the
real PM physics (it finally becomes true).

## As-built (2026-05-30)

Implemented and verified visually at sim t = 3 / 10 / 30 / 60 s on an RTX 4090: a clean
grand-design two-arm spiral at t=3 that winds and then **regenerates flocculent arms / dust
lanes / clumps** through t=60 (recurrent transient spirals — the self-gravity is doing real
work, not painting a pattern), stable (luma flat across time), at **~175 fps with all 4.19M
stars** through the heavy 6-substep SELFSHOT path (interactive is 1 substep). Key realisation
during tuning: persistent spiral structure needs a self-gravitating disk (lower the backbone's
dominance, raise `selfGain`, cool the disk toward Toomre Q≈1.2–1.5) — a backbone-dominated disk
just winds smooth. Final tuned defaults: `GRID_N=512`, `JACOBI_ITERS=32` (damped, ω=0.8),
`M_BH=18`, `SOFT_BH=0.30`, `M_HALO=60`, `SOFTEN=1.10`, `SELF_G_GAIN=26`, `DISK_SEED_W=0.65`,
`VEL_DISP=0.060`, `FIELD_HALF=1.75·R`, `R_MIN=0.045`. All physics knobs are `GAL_*`
env-overridable for the capture sweep.

An adversarial multi-agent review (5 dimensions × independent verification) found 8 confirmed
medium defects, all fixed: (1+2) field didn't contain the disk (`FIELD_HALF<R_MAX`) → enlarged
`FIELD_HALF`, drop off-grid deposits, Dirichlet-consistent `samplePhi`; (3+4) BH-force clamp vs
seed equilibrium and leapfrog `Ω·dt` margin → softened the BH and lifted `R_MIN`; (5) undamped
Jacobi left a checkerboard ripple → damped Jacobi ω=0.8; (6) `GRID_N/16` truncated for
non-multiples → `Math.ceil`; (7) mass→blue colour was double-counted (seed + VS) → seed copy
removed. One perf note (16 φ reads/star) intentionally kept — cache-resident, deliberate
gradient smoothing.

## Energy-conservation pass (2026-05-30, follow-up)

Owner asked whether the running sim is lossless. Built an `ENERGY_PROBE=1` diagnostic (reads
Pos/Vel/field back to the CPU, computes total E = KE + Φ_BH + Φ_halo + Φ_self) — it MEASURED that
the original build was NOT conservative: with the safety rails removed, total E ran away (−640 →
+440, 85% of stars escaping) and the galaxy heated apart. The damping/clamps/respawn were a
load-bearing thermostat masking numerical heating, dominated by an UNMATCHED self-gravity force
(CIC deposit but a wide central-difference φ-gradient → self-force + kernel-mismatch heating).

Fix, verified by the probe:
1. **Conservative particle-mesh force** — new `CS_FORCE` pass computes the grid force g=-∇φ once per
   cell; the integrate pass CIC-interpolates it with the SAME kernel as the deposit. Matched
   deposit↔interpolation ⇒ momentum-conserving, self-force-free. This alone removed the runaway:
   thermostat-off E went from +440 (blow-up) to a bounded, decelerating −640→−455.
2. **Halved timestep** (`DT 0.014→0.007`, substeps derived from a target sim-time/frame so the
   on-screen rate is unchanged) — cuts residual leapfrog heating of the stiff nucleus.

Result: the thermostat is now UNNECESSARY. Default config runs with **zero damping, no clamps, true
escapes** (owner's original #1+#3 — finally safe), stays bound and beautiful (bright nucleus intact
at t=60, golden core), with total E drifting only ~0.1%/s (decelerating; escaped fraction stable at
~2%). Not bit-exact (a PM code never is — it conserves momentum, energy to the grid discretization),
but genuinely conservative-by-construction. Knobs remain env-overridable (`GAL_VEL_DAMP`,
`GAL_MAX_ACC`, `GAL_MAX_SPEED`, `GAL_DT`, `GAL_R_MAX_MUL`) and `ENERGY_PROBE=1` ships as a permanent
diagnostic.
