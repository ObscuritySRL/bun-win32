# Voxelscape — Voxel Physics Sandbox

**Date:** 2026-05-29
**Status:** Approved (user delegated full creative latitude: "make it amazing… be creative… go viral")
**Target file:** `packages/all/example/voxelscape.ts` (single self-contained showcase demo)
**Reused helpers:** `_gpu.ts` (D3D11 engine), `_hud.ts` (flicker-free GDI→backbuffer HUD), `_audio.ts` (XAudio2 PCM output), `_snapshot.ts` (gallery PNG capture)

---

## 1. Goal

Turn the existing raytraced `voxelscape` fly-through into a **fully playable, physics-driven voxel sandbox** — a destruction-and-creation toybox with no win/lose state, built to be visually spectacular and shareable ("go viral"). Keep the demo's signature look (Amanatides–Woo DDA raytracing, soft shadows, AO, water reflections, golden-hour sky, god-rays, ACES tonemap) and layer a real game on top of it: player physics, cellular world physics, AI creatures, weapons/projectiles, and heavy "juice" (particles, screen-shake, audio, slow-mo).

The whole game renders as **one unified raytrace**: terrain, creatures, projectiles, and debris are all voxels in one grid; only non-solid glow (explosions, fire, lava, fuses) is a lightweight additive layer inside the same pixel shader.

---

## 2. Architecture overview

```
                         ┌─────────────────────────────────────────────┐
                         │  main loop (variable dt, uncapped)            │
                         │                                               │
  input (User32) ──────▶ │  1. input + camera/player intent             │
                         │  2. player physics step (dt)                  │
                         │  3. entity step: AI, projectiles, debris (dt) │
   fixed 20 Hz  ───────▶ │  4. world tick(s): active-set cellular sim    │
   accumulator           │     (sand/gravel fall, water/lava flow,       │
                         │      fire spread, TNT fuses, lava+water)      │
                         │  5. day/night advance + screen-shake decay    │
                         │  6. frame = world.copy(); stamp entities,     │
                         │     projectiles, debris as voxels             │
                         │  7. upload frame grid (3 MB dynamic buffer)   │
                         │  8. build cbuffer (camera, sun, glow points,  │
                         │     time-of-day, shake, target cell)          │
                         │  9. raytrace fullscreen PS  →  back buffer     │
                         │ 10. HUD composite (crosshair, hotbar, text)   │
                         │ 11. present                                   │
                         └─────────────────────────────────────────────┘
```

Two grids of `W·H·D` `uint32`:
- **`world`** — authoritative terrain + settled physics blocks. Mutated by edits and the cellular sim.
- **`frame`** — scratch = `world` each render, with dynamic voxels (creatures, projectiles, debris cubes) stamped in. This is what's uploaded. `frame.set(world)` is a ~3 MB typed-array memcpy (<1 ms); upload is `updateDynamicBuffer` (Map WRITE_DISCARD). Both are cheap at 60 fps.

**Why unified voxels (rendering approach A):** stamped dynamic voxels inherit the raytracer's lighting, soft shadows, AO, fog, and occlusion for free, and look perfectly consistent. Blocky critters and cube debris are on-theme for a voxel game. No second render pipeline ⇒ lowest risk. Smooth glow effects that *shouldn't* be cubes (fireballs, sparks, fuse glow) ride an in-shader additive **glow-point** layer instead.

---

## 3. Block palette (TS constants ↔ HLSL `palette()` — kept in lockstep)

| id | name      | solid | falls | fluid     | flammable | emissive | blast-resist |
|----|-----------|-------|-------|-----------|-----------|----------|--------------|
| 0  | AIR       | –     | –     | –         | –         | –        | –            |
| 1  | GRASS     | ✓     | –     | –         | (top)     | –        | low          |
| 2  | DIRT      | ✓     | –     | –         | –         | –        | low          |
| 3  | STONE     | ✓     | –     | –         | –         | –        | med          |
| 4  | SAND      | ✓     | ✓     | –         | –         | –        | low          |
| 5  | WATER     | –*    | –     | flow      | –         | –        | –            |
| 6  | WOOD      | ✓     | –     | –         | ✓         | –        | low          |
| 7  | LEAF      | ✓     | –     | –         | ✓ (fast)  | –        | low          |
| 8  | SNOW      | ✓     | –     | –         | –         | –        | low          |
| 9  | GRAVEL    | ✓     | ✓     | –         | –         | –        | low          |
| 10 | TNT       | ✓     | –     | –         | (fuse)    | when lit | low          |
| 11 | LAVA      | –*    | –     | flow-slow | ignites   | ✓        | –            |
| 12 | GLOWSTONE | ✓     | –     | –         | –         | ✓        | med          |
| 13 | PLANK     | ✓     | –     | –         | ✓         | –        | low          |
| 14 | BRICK     | ✓     | –     | –         | –         | high     | high         |
| 15 | OBSIDIAN  | ✓     | –     | –         | –         | –        | immune       |

`*` Water and lava are non-solid to the player's feet (you sink/swim) but the DDA still renders their surfaces.

**Fire** is *not* a block type — it's an overlay (`burning: Map<cellIndex, secondsLeft>`) over flammable solid blocks, rendered as emissive flicker + glow points. A block finishes burning → becomes AIR (leaves/grass may leave nothing; wood/plank may leave nothing or rare ember). This avoids perturbing the solid grid and keeps fire cheap and bounded.

---

## 4. Player physics

The camera gains a body. State: `pos` (feet-ish reference), `vel`, `onGround`, `inWater`, `flying`.

- **Body AABB:** ~0.6 × 1.8 × 0.6 voxels; eye at +1.6. Camera eye = `pos + eyeOffset` (+ shake).
- **Gravity:** ~28 voxels/s² (snappy, not floaty), terminal velocity clamp.
- **Swept AABB collision:** integrate then resolve per-axis against overlapping solid voxels (move X, resolve; move Y, resolve & set `onGround`; move Z, resolve). Solid = block with `solid` flag; water/lava/air pass-through.
- **Jump:** Space when `onGround` → upward impulse (~9 v/s) for ~1.25-block hop. Coyote-time (~80 ms) for forgiving jumps.
- **Step-up:** auto-climb a single ≤0.55-block ledge so you walk up stairs/slopes without jumping.
- **Water:** when eye/body in WATER → buoyancy (reduced + slightly upward gravity), damped horizontal speed, gentle bob; Space swims up; splash SFX + ring particles on entry/exit.
- **Lava:** entering LAVA shoves you out with an upward pop + screen flash + sizzle (no health system — sandbox — so it's a slapstick bounce, not death).
- **Fly toggle (F):** disables gravity/collision → the original free-fly camera (Space up / Shift down) for cinematic framing. Default for capture mode.
- **Sprint:** Shift on ground = faster walk; in fly = descend.

---

## 5. World physics — active-set cellular simulation

A discrete simulation on a **fixed ~20 Hz world-tick** (accumulator-driven; may run 0–N ticks per frame). State:
- `active: Set<number>` — cell indices that might still change.
- A **per-tick processing cap** (e.g. 24k cell-visits); overflow carries to next tick so a 1000-block explosion never stalls a frame.
- `wake(i)` adds `i` + its 6 neighbors to `active`. Every `setBlock` calls `wake`.

Per active cell, apply the first matching rule; if it changed state, `wake` affected neighbors; if fully stable, drop from `active`.

- **Falling (SAND, GRAVEL):** if the cell below is AIR/WATER → swap down (water displaced upward/sideways). If blocked but a diagonal-down is open → topple to it (forms talus slopes). Gravel sinks through water slower than it falls through air.
- **Water flow:** WATER with AIR below → move down. Else spread to AIR horizontal neighbors that have a downhill path (limited lateral pressure model: each water cell can feed up to its neighbors with a small flow budget, settling to a flat level). Tunable so breaching a lake **floods** a dug pit and an explosion crater **refills**. Water above the world's `SEA_LEVEL` evaporates slowly to prevent infinite oceans from edits (optional safety valve).
- **Lava flow:** like water but ~4× slower and shorter spread distance (viscous), and:
  - **Lava + Water ⇒ OBSIDIAN** (lava cell adjacent to water solidifies) **or STONE** (water cell adjacent to lava, if lava is "flowing") — with a steam burst (white glow point + hiss SFX). Classic, satisfying, emergent.
  - **Lava ignites** adjacent flammable blocks (adds them to `burning`).
- **Fire (overlay):** each `burning` cell counts down; while burning it emits light (glow point) + flicker tint, has a chance each tick to ignite adjacent flammable neighbors (LEAF fastest, then GRASS/WOOD/PLANK), and on expiry sets the block to AIR (+ ember particle). Bounded by the count of flammable cells; a forest fire at night is a centerpiece spectacle that burns itself out.
- **TNT fuses:** `fuses: Map<cellIndex, secondsLeft>`. Lighting a TNT (RMB on it, caught in a blast, or touched by fire/lava) adds it with a short fuse (~1.5 s, small jitter). While fused: blinking emissive + glow + hiss. On expiry → **explode** at that cell.

---

## 6. Explosions, chain reactions & bullet-time (the money shot)

`explode(cx, cy, cz, radius, power)`:
1. **Carve:** for every cell within `radius` (with `1 - dist/radius` falloff), destroy the block with probability scaled by power and reduced by the block's blast-resistance. OBSIDIAN immune; BRICK mostly survives; STONE partly; soil/wood shatter. Destroyed solids have a chance to spawn **debris** entities (flying cubes of that block color).
2. **Wake** the whole blast shell + interior so sand/gravel collapse and water/lava flow back into the crater.
3. **Chain:** any TNT inside the radius is lit with a short randomized fuse → **cascading chain reactions**. Lava splattered into the void can ignite nearby forests.
4. **Knockback:** push the player and all creatures within radius radially outward + up, scaled by falloff (creatures tumble comically).
5. **FX:** spawn a fireball (large warm glow point that expands+fades over ~0.4 s), a burst of spark + smoke particles, a **screen-shake** impulse (magnitude ∝ power, distance-attenuated) and a brief **white flash**.
6. **Audio:** layered boom (low sine thump + filtered-noise crack + tail), volume/length ∝ power.
7. **Bullet-time:** if `power` exceeds a threshold (big chain reaction or carpet bomb), engage a brief global **time-dilation** (~0.25× for ~0.6 s, eased back to 1×) so the debris arcs and shockwave read cinematically. Applies to physics dt + entity dt, not to render.

**Set-pieces for instant spectacle (keybinds):**
- **Carpet bomb (B):** drop a row/cluster of primed TNT from the sky onto the aim point.
- **Meteor (M):** spawn a flaming meteor projectile high up that streaks down (ember trail + glow) and detonates with a large radius on impact → guaranteed crater + bullet-time.

---

## 7. Entities — creatures (AI), projectiles, debris

One array-of-structs entity system. Shared sub-stepped integrator reuses the player's swept-AABB collision + gravity so everything interacts with the same world.

Common fields: `kind`, `pos`, `vel`, `size` (AABB), `age`, `ttl`, `data`.

- **Creatures ("Critters"):** ~8–24 blocky beings (e.g. 1×1×1 or 1×2×1 colored bodies, with a distinct head voxel + eyes via a brighter face tint). State machine: **wander** (pick a heading, amble, occasionally hop), **flee** (sprint away from the nearest explosion/fireball or the player when very close), **falling/launched** (after knockback, tumble until grounded). No pathfinding — steer + gravity + collision; if walled, hop or turn. They cast real shadows (stamped voxels). Squeak SFX on hop/launch. Press **C** to spawn one at the aim point; they wander the world living their little lives near the carnage.
- **Projectiles:**
  - **Bomb-lob (primary fire with the Bomb tool):** ballistic projectile (gravity arc), small glowing fused sphere; explodes on solid/creature impact or fuse-out.
  - **Block-cannon (primary fire with a material tool):** hitscan via the CPU DDA pick — places/paints the held material on the targeted face at range (rapid-fire building/terraforming).
  - **Meteor:** see §6.
- **Debris:** short-lived cube entities (block-colored) flung by explosions and block-breaks; gravity + a little bounce/friction; fade/shrink near `ttl`. Capped (e.g. ≤ 400) with oldest-evicted so a megablast can't unbound the count.

Entities are stamped into `frame` each render. Sub-voxel positions round to a cell for stamping (chunky but shadowed). Fast projectiles that look bad cell-snapped may instead ride the glow layer or be drawn as a 2-cell streak; decided visually during build.

---

## 8. Rendering additions to the pixel shader

Keep the existing DDA + lighting + water + fog + god-rays + tonemap. Add:

- **Glow-point layer:** a cbuffer array of up to ~32 glow points `{posXYZ, radius, colorRGB, intensity}`. After computing the scene color and the scene hit-distance `t`, accumulate additive glow from each point: project to the eye ray, take the along-ray distance, add `intensity · color · falloff(perpDist, radius)` **only if the point is nearer than the scene hit** (`pointAlongT < t` or within a soft band) → correct occlusion by terrain. Powers explosions, fireballs, fuses, lava pools, glowstone, torches, steam.
- **Emissive blocks:** LAVA/GLOWSTONE get a self-emission term in shading (visible at night); their cells are also fed into the glow list near the camera (capped) so they cast bloom into the air.
- **Day/night:** drive `iSunDir`, sun color/intensity, and sky palette from a `timeOfDay` uniform. Day = current golden-hour look; dusk warms and dims; **night** = deep blue sky with hash-based **stars** + a **moon disc** + cool moonlit ambient, so lava/fire/explosions glow dramatically; dawn ramps back. ~3-minute cycle; **T** scrubs time fast.
- **Targeted-block highlight:** pass the CPU-picked target cell; in-shader, when the hit cell equals the target and the hit point is near a voxel edge, draw a subtle dark outline (Minecraft-style selection box).
- **Screen-shake:** applied to the camera basis/pos on the CPU before building the cbuffer (no shader change needed); **flash** is an additive white term modulated by a `flash` uniform.

---

## 9. HUD, audio, feedback

- **HUD (`_hud.draw(g, w, h, dc => …)`):** drawn with GDI into the composited DIB (flicker-free, appears in screenshots):
  - center **crosshair** (thin cross or dot, subtle drop-shadow);
  - **hotbar** along the bottom — 10 slots with colored material/tool swatches + labels, selected slot highlighted/scaled;
  - top-left status: FPS · GPU · time-of-day clock · awake-cell count · entity count;
  - bottom strip: contextual controls / current tool name;
  - transient **toast** line for events ("💥 chain reaction! 7 TNT", "🔥 forest ablaze", "🌊 flood").
- **Audio (`_audio.createPcmOutput`, procedural synth, silent-safe):** a tiny synth submits PCM blocks each frame. Voices: footsteps (filtered noise ticks paced by speed), jump (rising blip), land (low thud ∝ fall speed), water splash (noise burst + downward chirp), block break (short click + noise by material), block place (soft tap), TNT fuse (looping hiss while any fuse active), explosion (layered boom ∝ power), fire (low crackle bed while anything burns), creature squeak, ambient wind/water bed (low, evolving). A small mixer sums active voices into each PCM block.
- **Feedback / juice:** screen-shake (landing, explosions, meteor impact), white flash (explosions), bullet-time on big blasts, particle bursts (sparks/smoke/steam/splash/embers/break-debris), targeted-block highlight, subtle vignette pulse on big booms.

---

## 10. Controls (pure sandbox)

| Input | Action |
|-------|--------|
| Mouse | Look (relative, recenter each frame) |
| W A S D | Move (horizontal in walk-mode; camera-relative in fly-mode) |
| Space | Jump (hold = ascend in fly / swim up in water) |
| Shift | Sprint (walk) / descend (fly) |
| 1–0 | Select hotbar slot |
| LMB | Primary action of selected tool (break / lob bomb / cannon-place) |
| RMB | Secondary (place held block / light a TNT / pick block) |
| Mouse wheel | Cycle hotbar (optional, if wheel is read) |
| C | Spawn a critter at aim point |
| B | Carpet bomb at aim point |
| M | Launch a meteor at aim point |
| T | Scrub time-of-day fast |
| F | Toggle fly / walk |
| R | Regenerate the world (new seed) |
| ESC | Exit |

**Hotbar slots (default):** 1 Break · 2 Stone · 3 Dirt · 4 Sand · 5 Gravel · 6 Water · 7 Lava · 8 Plank · 9 TNT · 0 Bomb-lob. (Block-cannon = primary fire while a material slot is selected; Break = remove.)

**Capture mode (`DEMO_DURATION_MS>0`):** a scripted cinematic at golden hour — fly low across the meadow past wandering critters, lob a bomb into a small TNT stack, trigger a chain reaction + bullet-time + fireball + flood/steam, level toward the sun for god-rays, and write the gallery PNG on the final frame (`captureBackBuffer`). Cursor untouched; deterministic seed.

---

## 11. Code structure

One file `packages/all/example/voxelscape.ts`, organized in clearly-commented sections (matching the repo's single-file showcase convention and the `voxelscape` npm script + screenshot pipeline):

1. Imports + constants (dimensions, block palette, properties, VK codes)
2. World generation (existing noise terrain + ore/lava pockets + structures to blow up)
3. HLSL: vertex shader + the big pixel shader (DDA + glow + day/night + highlight)
4. CPU DDA pick (mirror of shader traversal)
5. Cellular sim (active set, falling, water, lava, fire, fuses)
6. Explosions + set-pieces (carpet, meteor) + bullet-time
7. Entity system + creature AI + projectiles + debris
8. Player physics (swept AABB, jump, water, fly)
9. Particles + screen-shake + glow-point assembly
10. Audio SFX synth + mixer
11. HUD draw
12. `main()`: device/window setup, input, fixed-step accumulator loop, stamp+upload+render+HUD+present, capture, teardown

Shared TS↔HLSL constants (block ids, dims) are defined once in TS and interpolated into the HLSL string so they can't drift. Nullable/pointer audit discipline applies to any new FFI usage (none expected beyond existing helpers).

---

## 12. Performance & risk budget

- **Per-frame cost:** `frame.set(world)` (~3 MB) + stamp (hundreds of writes) + `updateDynamicBuffer` (~3 MB) + one fullscreen raytrace. All comfortably 60 fps on the existing engine at 1280×720; raytrace dominates, unchanged.
- **Physics cost:** bounded by the per-tick active-cell cap; idle world ⇒ empty active set ⇒ ~free. Fire/water bounded by their active regions.
- **Shadow cost:** denser dynamic voxels could lengthen shadow rays; cap shadow steps and skip entity self-shadow refinement if needed.
- **Glow layer:** ≤32 points, simple per-pixel loop; cheap.
- **Entity/debris caps** prevent unbounded growth from megablasts.
- **Verification is visual** (run interactively + `captureBackBuffer`/`PrintWindow` and *look* at frames), per the repo rule that numeric/world-space checks get fooled. Windows must be shown + topmost (the engine already does this).

### Risks to validate during build (not assumed)
1. Swept-AABB resolution order & tunnelling at high speed → sub-step by max-move-per-step.
2. Water flow stability/perf at scale → flow budget + per-tick cap + above-sea evaporation valve.
3. Glow-point depth-occlusion math (along-ray projection vs scene `t`).
4. Audio mixer underruns / GC of in-flight PCM blocks → keep the ring referenced (the helper already does), tune block size.
5. Cell-snapped projectile motion aesthetics → fall back to glow/streak rendering if ugly.
6. TS↔HLSL palette drift → single source interpolated into HLSL.

---

## 13. Out of scope (explicit)

- Health / death / win-lose (pure sandbox by request).
- Full structural-integrity collapse (only sand/gravel settling + blast-shell wake; true connectivity analysis is a stretch).
- Chunked/streaming world or worlds larger than the current 128×48×128 grid.
- Multiplayer, save/load, controller support (keyboard+mouse only).
- A second triangle/billboard render pipeline (unified voxels + glow layer instead).
