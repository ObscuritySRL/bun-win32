# Black Hole TTY — Interactive Orbit Camera

**Date:** 2026-06-02
**File:** `packages/all/example/blackhole-tty.ts`
**Goal:** Let the viewer change the camera angle by clicking and dragging the mouse, plus a small set of complementary controls — while leaving the renderer and the deterministic screenshot untouched.

## Summary

Today the camera is fully automatic: three time-driven scalars in `frame()` —
`orbit = time*0.075` (azimuth), `elev = 0.135 + 0.055·sin(…)` (inclination),
`dist = 18 + 1.4·sin(…)` (dolly) — feed the camera basis.

This change turns those into persistent, mouse-driven state. The `_term` engine
already parses real xterm SGR mouse reports off stdin and exposes
`t.mouseX/mouseY` (pixels), `t.mouseDown`, `t.mouseInside`, `t.mouseSeq`, and
`t.wheel` when a demo opts in with `mouse: true`. We use that; no engine changes.

## Controls

- **Left-drag → orbit.** Horizontal pixels → azimuth, vertical pixels → inclination.
  Turntable feel: the point you grab follows the cursor. Deltas are applied
  *directly* to the live angles, so dragging responds even while the sim is paused
  (`dt = 0` under space-pause).
- **Wheel / `+` / `-` → dolly.** Adjust a target distance; the live distance eases
  toward it for a smooth zoom.
- **Flick momentum.** Releasing mid-drag carries the drag's angular velocity into an
  eased spin (e-folding decay), clamped so it can't spin wildly.
- **Arrow keys → fine nudge** of azimuth / inclination.
- **`r` → reset.** Eases azimuth (shortest angular path), inclination, and distance
  back to the default cinematic framing.

## Idle behavior — "hold + gentle drift"

After release, once momentum has died and ~2.5 s pass with no input, a slow
azimuthal drift resumes *from wherever the user left the camera*. The angle the
user set is preserved; the scene merely breathes. This is direct control that
stays put, plus cinematic life — chosen over (a) drag-offsets-auto-orbit (fights
the user) and (b) resume-full-auto-orbit (steals the angle back).

## Untouched / headless — screenshot is preserved

Until the **first** interaction, the camera runs the **original** auto-orbit
formulas verbatim, computing the same `camRo` bit-for-bit. The first
drag/scroll/key seeds the manual state from the current auto pose (no jump) and
hands over control. Headless `CAPTURE_PNG` / `BENCH` never have a mouse or keys,
so they always take the auto path — the `captureT: 7` screenshot is unchanged.

## Safety clamps (bug prevention)

- **Inclination** clamped to ≈ ±1.45 rad (±83°). As `elev` approaches ±90° the
  camera `forward` becomes near-vertical and `right = cross(worldUp, forward)`
  becomes ill-conditioned — gimbal lock: the roll spins on rounding and dragging
  past the pole flips the view over. (It does not hard-NaN, because `Math.cos(π/2)`
  is `6e-17`, not exactly 0.) The clamp keeps a comfortable margin from that pole
  while still allowing top-down and below-the-disk views. Verified: a deliberate
  unclamped 90° render is a stable top-down frame, confirming no NaN — the clamp is
  for stability/UX, not crash-prevention.
- **Distance** clamped to ~[13, 45] so the camera never enters the disk volume
  (`DISK_OUT = 11.5`) or drifts uselessly far.

## Scope

Only the camera block in `frame()` changes, plus: a module-level state block, an
`onKey` handler, `mouse: true` on the spec, an updated HUD/control line, and an
updated header doc + `Run:` hint. Lensing, disk, photon ring, bloom, tonemap, the
fixed equatorial disk-plane basis, the internal-buffer/upsample pipeline, and the
capture/bench harness are all untouched.

## Verification (visual, per repo rule `verify_demos_visually`)

1. `tsc` clean.
2. Headless `CAPTURE_PNG` at `captureT: 7` renders and matches the prior screenshot
   (auto path unchanged) — no NaN/black frame.
3. Drive a few injected camera poses (low/edge-on, high/top-down, near/far dolly)
   to PNGs and eyeball that orbit, inclination, and zoom each look correct and the
   disk lenses as expected — no degenerate frames at the clamp extremes.
