# Voxelscape: Survival Mode — Design

**Date:** 2026-05-30
**File:** `packages/all/example/voxelscape.ts` (single-file demo, as all the others)
**Origin:** user feedback on the now-playable physics sandbox — "I want more; UI needs polish;
water freaks out (camera upside-down, textures crazy); nothing to do; AI does nothing; meteors
broken; world should be huge and/or randomly regenerate at a button."

Builds on `2026-05-29-voxelscape-physics-sandbox.md` (the sandbox is committed; this layers a game
loop + fixes on top). Locked interfaces (`Sim`, `createEntities`, `sweptMove`, palette) are reused.

## Goal

Turn the sandbox into a **day/night survival game**: build/prep by day, defend against escalating
**waves** of hostile mobs by night, on an **enormous, randomly-regenerating** world — while fixing
the water render bug, the meteor weapon, and the dead-feeling AI, and polishing the HUD.

## Decisions (from brainstorming)

- **Core loop:** survival waves (day = prep, night = defend, dawn = wave cleared + score).
- **Creatures:** *both* — peaceful wildlife by day, hostile mobs by night.
- **World:** *enormous* + random regen on `R` (capture mode stays a fixed seed).

## Systems

### A. World (enormous + random regen)
- `W,D,H` → **256×256×64** target (4× area, taller). Single source of truth constants; sim, world-gen,
  pickVoxel, glow scan, shader `WX/WY/WZ` all already derive from them.
- DDA primary `maxSteps` bounded (~448); distance-haze hides the far clip so GPU cost stays flat.
- One DYNAMIC structured buffer, re-uploaded only when world/entities changed (`WRITE_DISCARD`).
- **VERIFY FPS in a capture**; tune size up (320²) or down (192²) to stay playable ("enormous but runs").
- `generateWorld(seed)`; `R` → `Math.random()`-derived seed (fresh terrain/river/features each press).
  Capture/gallery path uses a fixed seed for a deterministic hero shot.

### B. Water render fix (independent)
- Primary ray: `traceVoxels(ro, rd, maxSteps, iEyeInWater > 0.5, …)`. When submerged, skip water so
  the ray reaches the seabed/terrain; the existing `iEyeInWater` deep-fog tints it. Kills the
  full-screen water-surface garbage that read as "upside down / textures crazy".

### C. Creatures (wildlife + hostiles)
- Entity gains `hp`, `hostile` (or a new `ENT_HOSTILE` behavior path), and an eye-glow render hint.
- **Wildlife** (`ENT_CRITTER`): recolored to read clearly (light body) + eye glow points; graze/idle,
  wander, hop, loose flocking, **flee player + explosions + fire**. Passive always.
- **Hostiles**: dark-red, glowing eyes; **seek the player** (head = normalize(player−pos)), hop/jump
  when blocked (reuse `sweptMove` stepUp), contact-damage the player. Killed by explosions
  (knockback+damage), lava, fall damage, or **melee swat (LMB within ~2.5 of crosshair)**. Two
  variants: walker + faster lunger.

### D. Survival loop + health
- Day length ~**90 s** (faster than the 3-min art cycle) so a session sees day→night→day; `T` scrubs.
- **Day** (sun up): safe; wildlife roam; player builds/preps.
- **Night** (sun down): **wave** — spawn `5 + 2·wave` hostiles at range; they path to the player.
  Survive to dawn → wave cleared, `score += bonus + kills`, `wave++`.
- **Health** 100: damage from mob contact / lava / point-blank blast; slow regen when safe.
  Death → respawn at spawn, current wave resets, score kept. Endless + forgiving.

### E. HUD polish
- Health bar; **wave/night banner** ("NIGHT 3 · 7 left" / "DAY · prepare") with sun/moon glyph;
  score (top-right); day clock; **red hurt-vignette** via one repurposed cbuffer pad (no resize);
  cleaner hotbar (labels under slots, selected-slot lift); crosshair reddens on in-range mob; toasts.

### F. Meteor weapon + cinematic + docs
- Meteor: aim already fixed; add **ember trail** (particles) + bigger impact → reads as an airstrike;
  becomes the panic button vs. a horde.
- Capture cinematic: keep the golden-hour hero, optionally stage a night-wave beat; fixed seed.
- Rewrite header docblock + README showcase copy → "day/night survival".

## Out of scope (YAGNI)
Inventory/resource economy, crafting, A* pathfinding, save files, multiple biomes beyond seed variety.

## Verification
- Type gate: `cd packages/all && bunx tsc --noEmit` → 0 errors (every phase).
- Logic TDD: extend `voxelscape.logic.test.ts`, run with `bun run` (not `bun test`); new pure rules
  (mob seek heading, wave count, damage) get checks.
- Visual: capture frames (`$env:DEMO_DURATION_MS=…; bun run …voxelscape.ts`) and **look** at the PNG —
  underwater is murky-not-garbage, world is bigger, FPS acceptable, mobs/wildlife visible, HUD crisp.
- Commit per phase (A–F).

## Phasing
A: water fix + random regen + enormous world [verify FPS] · B: creatures/AI · C: survival loop +
health + waves + combat · D: HUD polish · E: meteor trail · F: cinematic + docs + final sweep.
