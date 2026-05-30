/**
 * Voxelscape — a RAYTRACED voxel SURVIVAL SANDBOX, rendered entirely by Amanatides-Woo
 * DDA ray traversal in a single fullscreen pixel shader on your real GPU, in pure
 * TypeScript. No triangles, no depth buffer, no rasterized geometry — every pixel
 * marches a ray cell-by-cell through an enormous 384x64x384 voxel grid in a
 * StructuredBuffer<uint>. Terrain, creatures, projectiles and flying debris are ALL
 * voxels in one grid, so everything shares the same lighting/shadows for free. Build
 * and explore by day; survive escalating night waves of mobs that hunt you down.
 *
 * ── Rendering ─────────────────────────────────────────────────────────────────
 * The pixel shader casts a primary DDA ray per pixel, derives the hit FACE NORMAL,
 * lights it with an animated day/night sun (Lambert + hemispheric ambient), fires a
 * jittered DDA shadow ray, and computes smooth (per-corner, bilinear) Minecraft-style
 * ambient occlusion. Water casts a real reflection ray (mirrors terrain + sky), tints
 * by probed depth, shows the bottom through shallows, and foams at the shore. Lava and
 * glowstone are emissive. A depth-occluded additive GLOW-POINT layer (explosions,
 * fireballs, fire, lava, fuses, steam) blooms into the air before an ACES tonemap, plus
 * god-rays, screen-shake, a white explosion flash, stars + a moon at night, and a
 * Minecraft-style selection outline on the targeted block. The camera is four float3
 * basis vectors in a constant buffer — no matrices, so the column-major HLSL trap never
 * applies.
 *
 * ── Physics (CPU active-set cellular sim, fixed 20 Hz) ────────────────────────
 * Falling sand/gravel, mass-based water that floods + settles, viscous lava (lava+water
 * → obsidian/stone + steam, ignites flammables), a fire overlay that spreads + burns
 * out, TNT fuses with CHAIN REACTIONS, and radial explosions with falloff + per-block
 * blast resistance (obsidian immune). Explosions fling debris, knock back + panic
 * critters, and trigger bullet-time. A swept-AABB integrator (shared by the player and
 * all entities) gives gravity, jumping, 1-block step-up, swimming, and lava bounce.
 *
 * ── Survival ──────────────────────────────────────────────────────────────────
 * Peaceful cream WILDLIFE graze + flee by day; at nightfall a WAVE of dark-red HOSTILE
 * mobs (plus a few feral critters) hunts the player down (seek + hop AI, glowing eyes).
 * Fight back with a melee swat, bombs, TNT traps, lava, and METEOR airstrikes — blasts,
 * lava, and falls all gib them. Player HEALTH, a SCORE, and ever-bigger waves drive the
 * loop; survive to dawn for a bonus, respawn forgivingly on death.
 *
 * ── Play (interactive; no DEMO_DURATION_MS) ──────────────────────────────────
 * DAY = build & prep, NIGHT = defend. WASD move · mouse look · Space jump/swim · Shift
 * sprint · F fly · 1-0 hotbar (dig / stone / dirt / sand / gravel / water / lava / plank /
 * TNT / bomb) · LMB swat a mob in reach, else dig · RMB place (or light a targeted TNT) ·
 * E ignite · B carpet-bomb · M meteor airstrike · C critter · T scrub time · R brand-new
 * RANDOM world · ESC exit. A flicker-free GDI HUD (crosshair, day/night + wave banner,
 * health bar, score, colored hotbar, toasts) composites into the frame, with a red damage
 * vignette; procedural XAudio2 SFX add footsteps, splashes, break/place, hurt, and booms.
 * Capture mode (DEMO_DURATION_MS>0) flies a golden-hour cinematic — a meteor strike +
 * distant eruption over the basin — for the gallery PNG; the cursor is never touched.
 *
 * Debug env: VOX_SEED=n (fixed world), VOX_CAM="x,y,z,yaw,pitch" (static cam), VOX_TOD=0..1
 * (time), VOX_SURVIVAL=1 (run the wave loop in capture), VOX_MOBS=n (spawn a test wave),
 * VOX_DIVE=1 (underwater cam), VOX_BOOM/VOX_METEOR=1 (repeating FX), VOX_HUD=1 (HUD in capture).
 *
 * @bun-win32 / engine APIs: createWindow, createDevice, compile, makeVertexShader/
 * makePixelShader, makeConstantBuffer/updateConstantBuffer, makeStructuredBuffer
 * (cpuWritable SRV, initialData), updateDynamicBuffer, setRenderTargets/setViewport/
 * drawFullscreenTriangle, vsSet/psSet, present, comRelease — plus User32 input +
 * GDI32 brush/text via the _hud compositor, _audio (XAudio2 PCM), and captureBackBuffer.
 *
 * Run: bun run packages/all/example/voxelscape.ts
 */

import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import { GDI32, User32 } from '../index';

import * as gpu from './_gpu';
import * as hud from './_hud';
import { createPcmOutput } from './_audio';
import { captureBackBuffer, formatGrid } from './_snapshot';

const WIDTH = 1280;
const HEIGHT = 720;
const TRANSPARENT_BK = 1;

// World dimensions (i = x + z*W + y*W*D). An enormous basin — 4× the area of the
// original sandbox — with the distance-haze hiding the far DDA clip so GPU cost stays
// bounded. Tunable: drop to 192 if a weaker GPU can't hold a playable framerate.
const W = 384;
const D = 384;
const H = 64;
const SEA_LEVEL = 16;

// Primary DDA view distance (cells). The aerial-perspective haze fully saturates near
// this range, so the ray budget caps GPU cost without a visible far clip plane.
const PRIMARY_STEPS = 448;

// Max additive glow points fed to the shader each frame (explosions, fire, lava…).
const GLOW_MAX = 32;

// Block types (0 = air). The single source of truth: the HLSL palette() switch
// is generated by interpolating these same constants, so TS and shader can never
// drift. Ids are stable — never renumber (the property tables below index by id).
export const B_AIR = 0;
export const B_GRASS = 1;
export const B_DIRT = 2;
export const B_STONE = 3;
export const B_SAND = 4;
export const B_WATER = 5;
export const B_WOOD = 6;
export const B_LEAF = 7;
export const B_SNOW = 8;
export const B_GRAVEL = 9;
export const B_TNT = 10;
export const B_LAVA = 11;
export const B_GLOWSTONE = 12;
export const B_PLANK = 13;
export const B_BRICK = 14;
export const B_OBSIDIAN = 15;
export const B_COUNT = 16;
// Render-only ids for creatures: stamped into the render grid (never the sim world), so
// they inherit raytraced lighting/shadows. Handled by the shader palette + glow layer;
// NOT part of the B_COUNT property tables (they never reach isSolid/the cellular rules).
export const B_CRITTER = 16; // wildlife body — warm cream, pops against the greenery
export const B_MOB = 17; //     hostile mob body — dark menacing red

// ── Per-block property tables (indexed by block id, length B_COUNT) ────────────
/** Collides with a physical body. Air, water, and lava are non-solid (pass through). */
export const SOLID: boolean[] = [
  /* 0 air      */ false, /* 1 grass  */ true, /* 2 dirt   */ true, /* 3 stone */ true,
  /* 4 sand     */ true, /* 5 water  */ false, /* 6 wood    */ true, /* 7 leaf  */ true,
  /* 8 snow     */ true, /* 9 gravel */ true, /* 10 tnt    */ true, /* 11 lava */ false,
  /* 12 glowstn */ true, /* 13 plank */ true, /* 14 brick  */ true, /* 15 obsid */ true,
];
/** Settles under gravity like sand (falls + topples). */
export const FALLS: boolean[] = [
  false, false, false, false, true, false, false, false, false, true,
  false, false, false, false, false, false,
];
/** Fluid kind: 0 none, 1 water, 2 lava. */
export const FLUID: number[] = [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0];
/** Ignite/spread weight: 0 inert; higher catches + spreads faster (leaf fastest). */
export const FLAMMABLE: number[] = [
  0, 0, 0, 0, 0, 0, 0.7, 1.0, 0, 0, 0, 0, 0, 0.6, 0, 0,
];
/** Self-emission 0..1 (lit at night; feeds the glow layer). */
export const EMISSIVE: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0.8, 0, 0, 0];
/** Blast resistance 0 (shatters) .. 1 (immune). */
export const BLAST_RESIST: number[] = [
  0, 0.05, 0.1, 0.35, 0.05, 0, 0.12, 0.04, 0.05, 0.1, 0.1, 0, 0.4, 0.12, 0.7, 1.0,
];

/** Does block `b` collide with a physical body? (air/water/lava pass through.) */
export function isSolid(b: number): boolean {
  return SOLID[b] === true;
}

// ── Cellular physics simulation ────────────────────────────────────────────────
// A pure, factory-created world + active-set automaton: falling sand/gravel,
// mass-based water that floods and settles, throttled lava (lava+water → obsidian/
// stone + steam, ignites flammables), a fire overlay, TNT fuses + chain reactions,
// and radial explosions. The game layer drives it via stepTick() and reacts to the
// returned SimEvents (explosions/steam/splashes/extinguished) with FX/audio/debris.
const SIM_TICK_SECONDS = 1 / 20;
const WATER_MAX = 1.0;
const WATER_MIN = 0.045;
const TNT_FUSE = 1.4; // seconds
const TNT_RADIUS = 4.4;
const TNT_POWER = 1.0;
const HDIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const N6: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export interface ExplodeResult {
  destroyed: { x: number; y: number; z: number; block: number }[];
  litTNT: number;
}
export interface SimEvents {
  explosions: { x: number; y: number; z: number; power: number; result: ExplodeResult }[];
  steam: { x: number; y: number; z: number }[];
  splashes: { x: number; y: number; z: number }[];
  extinguished: { x: number; y: number; z: number }[];
}
export interface Sim {
  W: number;
  H: number;
  D: number;
  world: Uint32Array;
  water: Float32Array;
  active: Set<number>;
  fuses: Map<number, number>;
  burning: Map<number, number>;
  idx(x: number, y: number, z: number): number;
  inBounds(x: number, y: number, z: number): boolean;
  getBlock(x: number, y: number, z: number): number;
  setBlock(x: number, y: number, z: number, t: number): void;
  wake(x: number, y: number, z: number): void;
  light(x: number, y: number, z: number): void;
  ignite(x: number, y: number, z: number): void;
  explode(x: number, y: number, z: number, radius: number, power: number): ExplodeResult;
  stepTick(budget: number): SimEvents;
}

/** Build a simulation of size SW×SH×SD, optionally seeded with `data` (its buffer is taken over). */
export function createSim(SW: number, SH: number, SD: number, data?: Uint32Array): Sim {
  const world = data ?? new Uint32Array(SW * SH * SD);
  const water = new Float32Array(SW * SH * SD);
  const active = new Set<number>();
  const fuses = new Map<number, number>();
  const burning = new Map<number, number>();
  const SWD = SW * SD;
  let tick = 0;

  const sidx = (x: number, y: number, z: number): number => x + z * SW + y * SWD;
  const inB = (x: number, y: number, z: number): boolean => x >= 0 && y >= 0 && z >= 0 && x < SW && y < SH && z < SD;
  const get = (x: number, y: number, z: number): number => (inB(x, y, z) ? world[sidx(x, y, z)]! : B_AIR);

  const wake = (x: number, y: number, z: number): void => {
    if (inB(x, y, z)) active.add(sidx(x, y, z));
    for (const [dx, dy, dz] of N6) if (inB(x + dx, y + dy, z + dz)) active.add(sidx(x + dx, y + dy, z + dz));
  };

  const set = (x: number, y: number, z: number, t: number): void => {
    if (!inB(x, y, z)) return;
    const i = sidx(x, y, z);
    world[i] = t;
    if (t === B_WATER) {
      if (water[i]! < WATER_MIN) water[i] = WATER_MAX; // placing water = one full cell
    } else {
      water[i] = 0;
    }
    wake(x, y, z);
  };

  // Seed water mass from any pre-filled water (lake/river/sea); leave it OUT of the
  // active set so settled bodies stay inert until an edit/physics event disturbs them.
  if (data) for (let i = 0; i < world.length; i += 1) if (world[i] === B_WATER) water[i] = WATER_MAX;

  const light = (x: number, y: number, z: number): void => {
    if (get(x, y, z) !== B_TNT) return;
    const i = sidx(x, y, z);
    if (!fuses.has(i)) fuses.set(i, TNT_FUSE + Math.random() * 0.5);
  };

  const ignite = (x: number, y: number, z: number): void => {
    if (!inB(x, y, z)) return;
    const i = sidx(x, y, z);
    if (FLAMMABLE[world[i]!]! <= 0 || burning.has(i)) return;
    burning.set(i, 1.4 + 2.2 * FLAMMABLE[world[i]!]! + Math.random() * 0.6);
  };

  const explode = (cx: number, cy: number, cz: number, radius: number, power: number): ExplodeResult => {
    const destroyed: { x: number; y: number; z: number; block: number }[] = [];
    let litTNT = 0;
    const ri = Math.ceil(radius);
    const r2 = radius * radius;
    for (let dy = -ri; dy <= ri; dy += 1) {
      for (let dz = -ri; dz <= ri; dz += 1) {
        for (let dx = -ri; dx <= ri; dx += 1) {
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > r2) continue;
          const x = cx + dx;
          const y = cy + dy;
          const z = cz + dz;
          if (!inB(x, y, z)) continue;
          const b = world[sidx(x, y, z)]!;
          if (b === B_AIR) continue;
          if (b === B_TNT) {
            light(x, y, z); // chain reaction (fused, not destroyed here)
            litTNT += 1;
            continue;
          }
          if (b === B_OBSIDIAN) continue; // immune
          const falloff = 1 - Math.sqrt(d2) / radius; // 1 at center → 0 at rim
          const pDestroy = power * falloff * 1.4 - BLAST_RESIST[b]!;
          if (Math.random() < pDestroy) {
            destroyed.push({ x, y, z, block: b });
            set(x, y, z, B_AIR); // wakes neighbors so sand/water collapse into the crater
          }
        }
      }
    }
    return { destroyed, litTNT };
  };

  // ── Per-cell rules (return true if the cell should stay active) ───────────────
  const fallStep = (x: number, y: number, z: number, i: number, b: number): boolean => {
    if (y <= 0) return false;
    const bi = sidx(x, y - 1, z);
    const bb = world[bi]!;
    if (bb === B_AIR) {
      world[bi] = b;
      world[i] = B_AIR;
      wake(x, y - 1, z);
      wake(x, y, z);
      return true;
    }
    if (bb === B_WATER) {
      // Sink: the solid drops, the displaced water rises into the vacated cell.
      const wm = water[bi]! > 0 ? water[bi]! : WATER_MAX;
      world[bi] = b;
      water[bi] = 0;
      world[i] = B_WATER;
      water[i] = wm;
      wake(x, y - 1, z);
      wake(x, y, z);
      return true;
    }
    return false;
  };

  const waterStep = (x: number, y: number, z: number, i: number): boolean => {
    // Touching lava turns flowing water to stone (+ steam handled by lava side).
    for (const [dx, dy, dz] of N6) {
      if (get(x + dx, y + dy, z + dz) === B_LAVA) {
        world[i] = B_STONE;
        water[i] = 0;
        wake(x, y, z);
        return true;
      }
    }
    let m = water[i]!;
    if (m <= 0) {
      world[i] = B_AIR;
      return false;
    }
    let changed = false;
    // 1. Fall straight down into air/under-filled water.
    if (y > 0) {
      const bi = sidx(x, y - 1, z);
      const bb = world[bi]!;
      if (bb === B_AIR || bb === B_WATER) {
        const room = WATER_MAX - water[bi]!;
        if (room > 1e-3) {
          const t = Math.min(m, room);
          water[bi]! += t;
          m -= t;
          if (world[bi] !== B_WATER) world[bi] = B_WATER;
          wake(x, y - 1, z);
          changed = true;
        }
      }
    }
    // 2. Spread horizontally toward equalization (randomized order kills axis bias).
    if (m > WATER_MIN) {
      const o = (Math.random() * 4) | 0;
      for (let k = 0; k < 4; k += 1) {
        const dir = HDIRS[(o + k) % 4]!;
        const nx = x + dir[0];
        const nz = z + dir[1];
        if (!inB(nx, y, nz)) continue;
        const ni = sidx(nx, y, nz);
        const nb = world[ni]!;
        if (nb !== B_AIR && nb !== B_WATER) continue;
        const diff = m - water[ni]!;
        if (diff > 0.01) {
          const t = diff * 0.25;
          water[ni]! += t;
          m -= t;
          if (world[ni] !== B_WATER) world[ni] = B_WATER;
          wake(nx, y, nz);
          changed = true;
        }
      }
    }
    water[i] = m;
    if (m < WATER_MIN) {
      water[i] = 0;
      world[i] = B_AIR;
      wake(x, y, z);
      return true;
    }
    // Evaporation valve: stranded shallow water above sea level slowly clears.
    if (y > SEA_LEVEL && m < 0.3 && get(x, y - 1, z) !== B_WATER && Math.random() < 0.03) {
      water[i]! -= 0.06;
      changed = true;
    }
    return changed;
  };

  const lavaStep = (x: number, y: number, z: number, i: number, events: SimEvents): boolean => {
    // Lava touching water solidifies to obsidian (+ steam).
    for (const [dx, dy, dz] of N6) {
      if (get(x + dx, y + dy, z + dz) === B_WATER) {
        world[i] = B_OBSIDIAN;
        wake(x, y, z);
        events.steam.push({ x, y, z });
        return true;
      }
    }
    // Ignite adjacent flammables.
    for (const [dx, dy, dz] of N6) ignite(x + dx, y + dy, z + dz);
    const canDown = y > 0 && get(x, y - 1, z) === B_AIR;
    let sideDir: readonly [number, number] | null = null;
    const o = (Math.random() * 4) | 0;
    for (let k = 0; k < 4; k += 1) {
      const dir = HDIRS[(o + k) % 4]!;
      if (get(x + dir[0], y, z + dir[1]) === B_AIR && get(x + dir[0], y - 1, z + dir[1]) === B_AIR) {
        sideDir = dir;
        break;
      }
    }
    // Viscous: only actually flow every 3rd tick.
    if (tick % 3 === 0) {
      if (canDown) {
        world[sidx(x, y - 1, z)] = B_LAVA;
        world[i] = B_AIR;
        wake(x, y - 1, z);
        wake(x, y, z);
        return true;
      }
      if (sideDir) {
        world[sidx(x + sideDir[0], y, z + sideDir[1])] = B_LAVA;
        world[i] = B_AIR;
        wake(x + sideDir[0], y, z + sideDir[1]);
        wake(x, y, z);
        return true;
      }
    }
    return canDown || sideDir !== null; // stay active until it has settled
  };

  const processFuses = (events: SimEvents): void => {
    for (const [fi, tleft] of [...fuses]) {
      const nt = tleft - SIM_TICK_SECONDS;
      if (nt > 0) {
        fuses.set(fi, nt);
        continue;
      }
      fuses.delete(fi);
      const y = (fi / SWD) | 0;
      const rem = fi - y * SWD;
      const z = (rem / SW) | 0;
      const x = rem - z * SW;
      if (world[fi] === B_TNT) {
        world[fi] = B_AIR;
        wake(x, y, z);
        const result = explode(x, y, z, TNT_RADIUS, TNT_POWER);
        events.explosions.push({ x, y, z, power: TNT_POWER, result });
      }
    }
  };

  const processBurning = (events: SimEvents): void => {
    for (const [bi, tleft] of [...burning]) {
      const y = (bi / SWD) | 0;
      const rem = bi - y * SWD;
      const z = (rem / SW) | 0;
      const x = rem - z * SW;
      // Spread to flammable neighbors (tuned so fire reliably propagates + reads well).
      for (const [dx, dy, dz] of N6) {
        const nb = get(x + dx, y + dy, z + dz);
        if (FLAMMABLE[nb]! > 0 && Math.random() < FLAMMABLE[nb]! * 0.12) ignite(x + dx, y + dy, z + dz);
      }
      const nt = tleft - SIM_TICK_SECONDS;
      if (nt > 0) {
        burning.set(bi, nt);
        continue;
      }
      burning.delete(bi);
      if (FLAMMABLE[world[bi]!]! > 0) {
        world[bi] = B_AIR;
        wake(x, y, z);
        events.extinguished.push({ x, y, z });
      }
    }
  };

  const stepTick = (budget: number): SimEvents => {
    tick += 1;
    const events: SimEvents = { explosions: [], steam: [], splashes: [], extinguished: [] };
    processFuses(events);
    processBurning(events);
    const list = Array.from(active);
    let visited = 0;
    for (const i of list) {
      if (visited >= budget) break;
      if (!active.has(i)) continue;
      visited += 1;
      active.delete(i);
      const y = (i / SWD) | 0;
      const rem = i - y * SWD;
      const z = (rem / SW) | 0;
      const x = rem - z * SW;
      const b = world[i]!;
      let keep = false;
      if (FALLS[b]) keep = fallStep(x, y, z, i, b);
      else if (b === B_WATER) keep = waterStep(x, y, z, i);
      else if (b === B_LAVA) keep = lavaStep(x, y, z, i, events);
      if (keep) active.add(i);
    }
    return events;
  };

  return {
    W: SW,
    H: SH,
    D: SD,
    world,
    water,
    active,
    fuses,
    burning,
    idx: sidx,
    inBounds: inB,
    getBlock: get,
    setBlock: set,
    wake,
    light,
    ignite,
    explode,
    stepTick,
  };
}

// ── Entity system (debris, AI critters, projectiles) ───────────────────────────
// All dynamic objects share the player's swept-AABB integrator against the sim's
// solid voxels, then get stamped into the render grid as voxels (so they inherit
// the raytracer's lighting/shadows for free). Pure of GPU/FFI; the game stamps +
// reacts to onExplode.
export const ENT_DEBRIS = 0;
export const ENT_CRITTER = 1;
export const ENT_BOMB = 2;
export const ENT_METEOR = 3;

export interface Entity {
  kind: number;
  pos: [number, number, number];
  vel: [number, number, number];
  size: [number, number, number];
  ttl: number; // seconds remaining; Infinity = persists (critters)
  block: number; // render block id
  state: number; // critter AI: 0 wander/seek, 1 flee, 2 launched, 3 graze (idle)
  timer: number; // AI re-plan / projectile fuse
  hx: number; // critter heading
  hz: number;
  ground: boolean;
  hostile: boolean; // hunts the player (night mobs) vs. peaceful wildlife
  variant: number; // 0 walker, 1 lunger (hostiles); 0 for everything else
  hp: number; // creature health (mobs/wildlife die at <= 0)
}

export interface Entities {
  list: Entity[];
  onExplode: ((x: number, y: number, z: number, power: number) => void) | null;
  /** Game sets this to the player's position each frame so hostiles can hunt + wildlife flee. */
  target: [number, number, number] | null;
  /** Called when a critter dies (game spawns FX + scores hostiles). */
  onCritterDeath: ((x: number, y: number, z: number, hostile: boolean) => void) | null;
  step(dt: number): void;
  spawnDebris(x: number, y: number, z: number, vx: number, vy: number, vz: number, block: number): void;
  spawnCritter(x: number, y: number, z: number): Entity;
  spawnMob(x: number, y: number, z: number, variant: number): Entity;
  spawnBomb(x: number, y: number, z: number, vx: number, vy: number, vz: number, fuse: number): void;
  spawnMeteor(x: number, y: number, z: number, tx: number, ty: number, tz: number): void;
  alarm(x: number, y: number, z: number, power: number): void;
  knockback(x: number, y: number, z: number, power: number): void;
  /** Radial damage to creatures (explosions/melee). Returns the number of hostiles killed. */
  damage(x: number, y: number, z: number, radius: number, amount: number): number;
  /** Count of currently-alive hostile mobs (for the wave tracker). */
  hostileCount(): number;
}

const DEBRIS_CAP = 420;

export function createEntities(sim: Sim): Entities {
  const list: Entity[] = [];
  // Deferred side-effects: a detonating projectile's onExplode runs damage()/spawnDebris()
  // which splice `list`, and a creature death runs onCritterDeath() which spawns debris — both
  // mutate `list`. step() collects them here and fires them AFTER its loop so it never mutates
  // the array it is iterating (which would drop the wrong entity / re-detonate a projectile).
  const pendingBooms: { x: number; y: number; z: number; power: number }[] = [];
  const pendingDeaths: { x: number; y: number; z: number; hostile: boolean }[] = [];
  const solid = (x: number, y: number, z: number): boolean => {
    if (x < 0 || z < 0 || x >= sim.W || z >= sim.D) return true;
    if (y < 0) return true;
    if (y >= sim.H) return false;
    return isSolid(sim.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)));
  };
  const ents: Entities = {
    list,
    onExplode: null,
    target: null,
    onCritterDeath: null,
    spawnDebris(x, y, z, vx, vy, vz, block) {
      // Cap: evict the oldest debris when full.
      let debrisCount = 0;
      for (const e of list) if (e.kind === ENT_DEBRIS) debrisCount += 1;
      if (debrisCount >= DEBRIS_CAP) {
        for (let i = 0; i < list.length; i += 1) {
          if (list[i]!.kind === ENT_DEBRIS) {
            list.splice(i, 1);
            break;
          }
        }
      }
      list.push({ kind: ENT_DEBRIS, pos: [x, y, z], vel: [vx, vy, vz], size: [0.3, 0.3, 0.3], ttl: 2.2 + Math.random() * 1.5, block, state: 0, timer: 0, hx: 0, hz: 0, ground: false, hostile: false, variant: 0, hp: 1 });
    },
    spawnCritter(x, y, z) {
      const a0 = Math.random() * Math.PI * 2;
      const e: Entity = { kind: ENT_CRITTER, pos: [x, y, z], vel: [0, 0, 0], size: [0.7, 1.6, 0.7], ttl: Infinity, block: B_CRITTER, state: 0, timer: Math.random() * 2, hx: Math.cos(a0), hz: Math.sin(a0), ground: false, hostile: false, variant: 0, hp: 3 };
      list.push(e);
      return e;
    },
    spawnMob(x, y, z, variant) {
      // 0 = walker (sturdy, dogged), 1 = lunger (smaller, fast, fragile).
      const a0 = Math.random() * Math.PI * 2;
      const lunger = variant === 1;
      const e: Entity = {
        kind: ENT_CRITTER,
        pos: [x, y, z],
        vel: [0, 0, 0],
        size: lunger ? [0.6, 1.2, 0.6] : [0.8, 1.7, 0.8],
        ttl: Infinity,
        block: B_MOB,
        state: 0,
        timer: Math.random(),
        hx: Math.cos(a0),
        hz: Math.sin(a0),
        ground: false,
        hostile: true,
        variant,
        hp: lunger ? 2 : 4,
      };
      list.push(e);
      return e;
    },
    spawnBomb(x, y, z, vx, vy, vz, fuse) {
      list.push({ kind: ENT_BOMB, pos: [x, y, z], vel: [vx, vy, vz], size: [0.4, 0.4, 0.4], ttl: fuse, block: B_TNT, state: 0, timer: 0, hx: 0, hz: 0, ground: false, hostile: false, variant: 0, hp: 1 });
    },
    spawnMeteor(x, y, z, tx, ty, tz) {
      const dx = tx - x;
      const dy = ty - y;
      const dz = tz - z;
      const t = 1.6;
      list.push({ kind: ENT_METEOR, pos: [x, y, z], vel: [dx / t, dy / t, dz / t], size: [1.0, 1.0, 1.0], ttl: 6, block: B_LAVA, state: 0, timer: 0, hx: 0, hz: 0, ground: false, hostile: false, variant: 0, hp: 1 });
    },
    alarm(x, y, z, power) {
      const r = 6 + power * 4;
      for (const e of list) {
        if (e.kind !== ENT_CRITTER) continue;
        const dx = e.pos[0] - x;
        const dz = e.pos[2] - z;
        if (dx * dx + dz * dz < r * r) {
          const d = Math.hypot(dx, dz) || 1;
          e.hx = dx / d;
          e.hz = dz / d;
          e.state = 1; // flee
          e.timer = 1.5 + Math.random();
        }
      }
    },
    knockback(x, y, z, power) {
      for (const e of list) {
        const dx = e.pos[0] - x;
        const dy = e.pos[1] - y;
        const dz = e.pos[2] - z;
        const d2 = dx * dx + dy * dy + dz * dz;
        const r = 5 + power * 4;
        if (d2 > r * r || d2 < 1e-3) continue;
        const d = Math.sqrt(d2);
        const f = (1 - d / r) * (8 + power * 10);
        e.vel[0] += (dx / d) * f;
        e.vel[1] += (dy / d) * f * 0.6 + 4;
        e.vel[2] += (dz / d) * f;
        if (e.kind === ENT_CRITTER) {
          e.state = 2; // launched
          e.timer = 1.2;
        }
      }
    },
    damage(x, y, z, radius, amount) {
      let kills = 0;
      const r2 = radius * radius;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const e = list[i]!;
        if (e.kind !== ENT_CRITTER) continue;
        const dx = e.pos[0] - x;
        const dy = e.pos[1] - y;
        const dz = e.pos[2] - z;
        if (dx * dx + dy * dy + dz * dz > r2) continue;
        e.hp -= amount;
        if (e.hp <= 0) {
          if (e.hostile) kills += 1;
          ents.onCritterDeath?.(e.pos[0], e.pos[1], e.pos[2], e.hostile);
          list.splice(i, 1);
        }
      }
      return kills;
    },
    hostileCount() {
      let n = 0;
      for (const e of list) if (e.kind === ENT_CRITTER && e.hostile) n += 1;
      return n;
    },
    step(dt) {
      const g = 28;
      pendingBooms.length = 0;
      pendingDeaths.length = 0;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const e = list[i]!;
        if (e.kind === ENT_BOMB || e.kind === ENT_METEOR) {
          e.vel[1] -= g * dt * (e.kind === ENT_METEOR ? 0.2 : 1);
          const nx = e.pos[0] + e.vel[0] * dt;
          const ny = e.pos[1] + e.vel[1] * dt;
          const nz = e.pos[2] + e.vel[2] * dt;
          e.ttl -= dt;
          const hitSolid = solid(nx, ny, nz);
          if (hitSolid || e.ttl <= 0 || ny < 0) {
            const ex = Math.max(0, Math.min(sim.W - 1, Math.floor(e.pos[0])));
            const ey = Math.max(0, Math.min(sim.H - 1, Math.floor(e.pos[1])));
            const ez = Math.max(0, Math.min(sim.D - 1, Math.floor(e.pos[2])));
            pendingBooms.push({ x: ex, y: ey, z: ez, power: e.kind === ENT_METEOR ? 2.0 : 1.0 });
            list.splice(i, 1); // safe reverse-removal; onExplode fires after the loop
            continue;
          }
          e.pos[0] = nx;
          e.pos[1] = ny;
          e.pos[2] = nz;
          continue;
        }
        if (e.kind === ENT_DEBRIS) {
          e.vel[1] -= g * dt;
          const r = sweptMove(e.pos[0], e.pos[1], e.pos[2], e.vel[0], e.vel[1], e.vel[2], e.size[0], e.size[1], e.size[2], dt, solid, 0);
          e.pos[0] = r.x;
          e.pos[1] = r.y;
          e.pos[2] = r.z;
          e.vel[0] = r.hitX ? 0 : r.vx * 0.86;
          e.vel[1] = r.onGround ? -r.vy * 0.32 : r.vy;
          e.vel[2] = r.hitZ ? 0 : r.vz * 0.86;
          if (r.onGround) {
            e.vel[0] *= 0.7;
            e.vel[2] *= 0.7;
          }
          e.ttl -= dt;
          if (e.ttl <= 0) list.splice(i, 1);
          continue;
        }
        // ── Creature AI: wildlife (wander/graze/flee) + hostiles (hunt the player) ──
        // Lava melts; a hard fall after being flung chips health; hp <= 0 dies.
        if (sim.getBlock(Math.floor(e.pos[0]), Math.floor(e.pos[1] + 0.1), Math.floor(e.pos[2])) === B_LAVA) e.hp -= 12 * dt;
        e.timer -= dt;

        // Heading + distance to the player target (game sets ents.target each frame).
        let tdx = 0;
        let tdz = 0;
        let tdist = Infinity;
        if (ents.target) {
          tdx = ents.target[0] - e.pos[0];
          tdz = ents.target[2] - e.pos[2];
          tdist = Math.hypot(tdx, tdz);
        }

        if (e.state === 2) {
          // Launched: tumble until grounded, then resume normal behaviour.
          if (e.ground && e.timer <= 0) e.state = 0;
        } else if (e.hostile) {
          // Hunt: steer straight at the player; wander only if there's no target.
          if (tdist > 0.01 && tdist < Infinity) {
            e.hx = tdx / tdist;
            e.hz = tdz / tdist;
          } else if (e.timer <= 0) {
            const a = Math.random() * Math.PI * 2;
            e.hx = Math.cos(a);
            e.hz = Math.sin(a);
            e.timer = 1 + Math.random();
          }
          const mobSpeed = e.variant === 1 ? 6.4 : 3.6;
          e.vel[0] = e.hx * mobSpeed;
          e.vel[2] = e.hz * mobSpeed;
        } else {
          // Wildlife: bolt away when the player gets close, else amble / graze.
          if (tdist < 9 && tdist > 0.01) {
            e.hx = -tdx / tdist;
            e.hz = -tdz / tdist;
            e.state = 1;
            e.timer = 1.0 + Math.random();
          } else if (e.timer <= 0) {
            if (Math.random() < 0.3) {
              e.state = 3; // graze (stand + nibble)
              e.timer = 1.4 + Math.random() * 1.6;
            } else {
              e.state = 0;
              const a = Math.random() * Math.PI * 2;
              e.hx = Math.cos(a);
              e.hz = Math.sin(a);
              e.timer = 1.5 + Math.random() * 2.5;
            }
          }
          const wspeed = e.state === 1 ? 5.6 : e.state === 3 ? 0 : 2.2;
          e.vel[0] = e.hx * wspeed;
          e.vel[2] = e.hz * wspeed;
        }
        // Hop now and then while moving on the ground.
        if (e.state !== 2 && e.state !== 3 && e.ground && Math.random() < (e.hostile ? 0.03 : 0.02)) e.vel[1] = e.hostile ? 7.0 : 6.5;

        e.vel[1] -= g * dt;
        const fall = -e.vel[1];
        const stepUp = e.variant === 1 ? 1.15 : 1.05;
        const r = sweptMove(e.pos[0], e.pos[1], e.pos[2], e.vel[0], e.vel[1], e.vel[2], e.size[0], e.size[1], e.size[2], dt, solid, stepUp);
        // Blocked horizontally → jump to climb (hostiles always try); wildlife may turn.
        if ((r.hitX || r.hitZ) && r.onGround && e.state !== 2) {
          if (e.hostile || Math.random() < 0.5) e.vel[1] = 7.0;
          else {
            e.hx = -e.hx;
            e.hz = -e.hz;
          }
        }
        // A hard landing after being flung hurts (mobs can be blasted to their death).
        if (r.onGround && !e.ground && fall > 24) e.hp -= (fall - 24) * 0.5;
        e.pos[0] = r.x;
        e.pos[1] = r.y;
        e.pos[2] = r.z;
        e.vel[0] = r.vx;
        e.vel[1] = r.vy;
        e.vel[2] = r.vz;
        e.ground = r.onGround;
        if (e.hp <= 0) {
          pendingDeaths.push({ x: e.pos[0], y: e.pos[1], z: e.pos[2], hostile: e.hostile });
          list.splice(i, 1); // safe reverse-removal; onCritterDeath fires after the loop
        }
      }
      // Drain deferred side-effects now that iteration is done — these mutate `list`
      // (damage()/spawnDebris() splice + push), which is only safe outside the loop.
      for (const d of pendingDeaths) ents.onCritterDeath?.(d.x, d.y, d.z, d.hostile);
      for (const b of pendingBooms) ents.onExplode?.(b.x, b.y, b.z, b.power);
    },
  };
  return ents;
}

// Virtual-key codes for interactive controls.
const VK_W = 0x57;
const VK_A = 0x41;
const VK_S = 0x53;
const VK_DK = 0x44; // D
const VK_SPACE = 0x20;
const VK_SHIFT = 0x10;
const VK_LBUTTON = 0x01;
const VK_RBUTTON = 0x02;
const VK_F = 0x46; // toggle fly/walk
const VK_T = 0x54; // scrub time-of-day
const VK_E = 0x45; // ignite (light TNT / set fire)
const VK_B = 0x42; // carpet bomb
const VK_M = 0x4d; // meteor
const VK_C = 0x43; // spawn critter
const VK_R = 0x52; // regenerate world

// ── Fullscreen-triangle vertex shader (SV_VertexID, no vertex buffer) ──────────
const VS_SOURCE = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// ── Pixel shader: Amanatides-Woo DDA voxel raytracer ───────────────────────────
const PS_SOURCE = `
cbuffer Frame : register(b0) {
  float2 iResolution;   // 0
  float  iTime;         // 8
  float  iTimeOfDay;    // 12  (0..1 over a day; 0.5 ≈ noon)
  float3 iCamPos;       // 16
  float  iFlash;        // 28  (0..1 explosion white flash)
  float3 iForward;      // 32
  float  iEyeInWater;   // 44  (1 when the camera eye is submerged in water)
  float3 iRight;        // 48
  float  iPad3;         // 60
  float3 iUp;           // 64
  float  iFov;          // 76
  float3 iSunDir;       // 80
  float  iPad4;         // 92
  int3   iTargetCell;   // 96  (block under the crosshair)
  int    iTargetValid;  // 108
  uint   iGlowCount;    // 112
  float  iHurt;         // 116  (0..1 red damage vignette)
  float  iPad5b;        // 120
  float  iPad5c;        // 124
  float4 iGlow[${GLOW_MAX * 2}]; // 128: per point — [pos.xyz, radius], [color.rgb, intensity]
};

StructuredBuffer<uint> Voxels : register(t0);

static const int WX = ${W};
static const int WZ = ${D};
static const int WY = ${H};

uint sampleVoxel(int x, int y, int z) {
  if (x < 0 || y < 0 || z < 0 || x >= WX || y >= WY || z >= WZ) return 0u;
  return Voxels[x + z * WX + y * WX * WZ];
}

// Hash helpers for procedural grass / leaf / cloud variation.
float hash21(float2 p) {
  p = frac(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return frac(p.x * p.y);
}
float vnoise2(float2 p) {
  float2 i = floor(p);
  float2 f = frac(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + float2(1, 0));
  float c = hash21(i + float2(0, 1));
  float d = hash21(i + float2(1, 1));
  return lerp(lerp(a, b, f.x), lerp(c, d, f.x), f.y);
}
float fbm2(float2 p) {
  float v = 0.0, a = 0.5;
  [unroll] for (int i = 0; i < 4; i++) { v += a * vnoise2(p); p *= 2.02; a *= 0.5; }
  return v;
}

// Per-block base albedo. Block ids are interpolated from the TS B_* constants
// (single source of truth) so the palette can never drift from the simulation.
// cell lets us add tasteful per-voxel color variation (grass tufts, leaf hue, flowers).
float3 blockColor(uint t, float3 cell) {
  if (t == ${B_GRASS}u) {                            // grass: lush, with subtle hue drift + rare flowers
    float h = hash21(cell.xz * 0.7 + cell.y * 0.13);
    float3 g = lerp(float3(0.30, 0.58, 0.20), float3(0.46, 0.70, 0.26), fbm2(cell.xz * 0.35));
    g = lerp(g, float3(0.52, 0.66, 0.22), 0.25 * h);          // dry-grass tint
    if (h > 0.965) g = lerp(g, float3(0.92, 0.82, 0.30), 0.7); // yellow flower speck
    else if (h < 0.022) g = lerp(g, float3(0.86, 0.40, 0.60), 0.6); // pink flower speck
    return g;
  }
  if (t == ${B_DIRT}u) return float3(0.46, 0.32, 0.20) * (0.92 + 0.16 * hash21(cell.xz + cell.y)); // dirt
  if (t == ${B_STONE}u) {                            // stone: cool grey with mossy/strata variation
    float s = fbm2(cell.xz * 0.5 + cell.y * 0.2);
    return lerp(float3(0.36, 0.37, 0.41), float3(0.50, 0.51, 0.54), s);
  }
  if (t == ${B_SAND}u) return lerp(float3(0.78, 0.70, 0.46), float3(0.90, 0.83, 0.60), fbm2(cell.xz * 0.6)); // sand
  if (t == ${B_WATER}u) return float3(0.05, 0.18, 0.30); // water (mostly overridden by surface shading)
  if (t == ${B_WOOD}u) return float3(0.32, 0.21, 0.12) * (0.9 + 0.2 * hash21(cell.xz + cell.y * 3.0)); // wood
  if (t == ${B_LEAF}u) {                             // leaves: dappled canopy greens
    float h = hash21(cell.xz * 1.3 + cell.y * 0.7);
    return lerp(float3(0.13, 0.40, 0.13), float3(0.26, 0.56, 0.20), h);
  }
  if (t == ${B_SNOW}u) return float3(0.92, 0.95, 1.00); // snow
  if (t == ${B_GRAVEL}u) {                           // gravel: speckled grey pebbles
    float h = hash21(cell.xz * 1.7 + cell.y * 0.5);
    float3 base = lerp(float3(0.40, 0.39, 0.37), float3(0.55, 0.53, 0.50), h);
    return base * (0.85 + 0.3 * hash21(cell.xz * 3.1 + cell.y));
  }
  if (t == ${B_TNT}u) {                              // TNT: red casing with a pale label band
    float band = frac(cell.y * 0.5);
    float3 red = float3(0.74, 0.13, 0.10) * (0.9 + 0.18 * hash21(cell.xz + cell.y));
    float3 label = float3(0.86, 0.84, 0.80);
    return lerp(red, label, step(0.35, band) * step(band, 0.5) * 0.6);
  }
  if (t == ${B_LAVA}u) {                             // lava: hot molten crust (emission added in shading)
    float s = fbm2(cell.xz * 0.5 + cell.y * 0.3);
    return lerp(float3(1.50, 0.45, 0.08), float3(0.85, 0.16, 0.02), s);
  }
  if (t == ${B_GLOWSTONE}u) {                        // glowstone: warm glowing crystal (emissive)
    float h = hash21(cell.xz * 1.1 + cell.y * 0.9);
    return lerp(float3(0.95, 0.80, 0.42), float3(1.00, 0.90, 0.58), h);
  }
  if (t == ${B_PLANK}u) {                            // plank: light sawn-wood boards
    float plank = frac(cell.y * 0.5 + cell.x * 0.05);
    float3 wood = lerp(float3(0.62, 0.46, 0.28), float3(0.74, 0.56, 0.36), hash21(cell.xz + cell.y));
    return wood * (0.86 + 0.14 * step(0.5, plank));
  }
  if (t == ${B_BRICK}u) {                            // brick: red brick with light mortar lines
    float mortar = step(0.85, frac(cell.y * 0.5)) + step(0.85, frac(cell.x * 0.5 + cell.y * 0.25));
    return lerp(float3(0.55, 0.22, 0.16), float3(0.80, 0.78, 0.74), saturate(mortar) * 0.5);
  }
  if (t == ${B_OBSIDIAN}u) {                         // obsidian: near-black volcanic glass with a purple sheen
    float h = hash21(cell.xz * 2.3 + cell.y);
    return float3(0.06, 0.045, 0.10) + float3(0.06, 0.02, 0.10) * h;
  }
  if (t == ${B_CRITTER}u) {                          // wildlife: woolly cream with a soft hue drift
    float h = hash21(cell.xz * 1.9 + cell.y * 1.3);
    return lerp(float3(0.86, 0.82, 0.70), float3(0.97, 0.94, 0.84), h);
  }
  if (t == ${B_MOB}u) {                              // hostile mob: dark blood-red, slightly mottled
    float h = hash21(cell.xz * 2.1 + cell.y * 1.7);
    return lerp(float3(0.36, 0.05, 0.05), float3(0.55, 0.11, 0.08), h);
  }
  return float3(0.5, 0.5, 0.5);
}

// Drifting cumulus clouds painted into the upper sky.
float clouds(float3 rd) {
  if (rd.y < 0.015) return 0.0;
  float2 cp = rd.xz / max(rd.y, 0.04);               // project onto a high plane
  cp += float2(iTime * 0.012, iTime * 0.006);
  float c = fbm2(cp * 1.1);
  c = smoothstep(0.46, 0.86, c);
  return c * saturate(rd.y * 2.2);                    // fade near horizon
}

// Sparse twinkling starfield for the night sky (projected onto a high plane).
float stars(float3 rd) {
  if (rd.y < 0.03) return 0.0;
  float2 sp = (rd.xz / max(rd.y, 0.06)) * 7.0;
  float2 c = floor(sp);
  float h = hash21(c);
  float star = step(0.9935, h);
  float tw = 0.55 + 0.45 * sin(iTime * 3.0 + h * 130.0);
  return star * tw * saturate(rd.y * 3.0);
}

// Sky / atmosphere: a full day→dusk→night→dawn cycle driven by the sun's height.
float3 skyColor(float3 rd, float3 sun) {
  float up = saturate(rd.y * 0.5 + 0.5);
  float day = saturate(sun.y * 2.4 + 0.14); // 1 = full day, 0 = deep night
  float sd = saturate(dot(rd, sun));

  // ── Day sky: warm horizon → blue zenith, with scatter halo + sun disc ──────
  float3 dayCol = lerp(float3(0.92, 0.80, 0.62), float3(0.50, 0.66, 0.86), pow(saturate(rd.y * 1.4 + 0.06), 0.5));
  dayCol = lerp(dayCol, float3(0.14, 0.32, 0.66), pow(up, 1.4));
  dayCol += float3(1.0, 0.55, 0.26) * pow(sd, 5.0) * 0.40;
  dayCol += float3(1.0, 0.78, 0.46) * pow(sd, 40.0) * 0.70;
  dayCol += float3(1.0, 0.94, 0.82) * pow(sd, 2200.0) * 16.0 * saturate(sun.y * 5.0); // disc only when sun is up
  float cl = clouds(rd);
  float3 cloudCol = lerp(float3(0.78, 0.80, 0.86), float3(1.0, 0.88, 0.70), saturate(sd * 1.3));
  dayCol = lerp(dayCol, cloudCol, cl * 0.85);
  dayCol = lerp(dayCol, float3(0.95, 0.86, 0.72), pow(1.0 - up, 8.0) * 0.45);

  // ── Night sky: deep navy + stars + a soft moon opposite the sun ────────────
  float3 nightCol = lerp(float3(0.09, 0.10, 0.17), float3(0.012, 0.02, 0.055), pow(up, 1.1));
  nightCol += float3(1.0, 1.0, 0.96) * stars(rd) * (1.0 - day);
  float3 moonDir = normalize(float3(-sun.x, -sun.y, -sun.z));
  float md = saturate(dot(rd, moonDir));
  nightCol += float3(0.85, 0.88, 1.0) * pow(md, 900.0) * 3.0;  // moon disc
  nightCol += float3(0.40, 0.46, 0.62) * pow(md, 50.0) * 0.18; // moon halo

  float3 col = lerp(nightCol, dayCol, day);
  // Warm dusk/dawn band hugging the sun when it sits near the horizon.
  float dusk = saturate(1.0 - abs(sun.y) * 3.5);
  col += float3(0.95, 0.45, 0.22) * pow(sd, 7.0) * dusk * (1.0 - day) * 0.6;
  return col;
}

// Amanatides-Woo DDA. Returns 1 if a solid voxel was hit before maxSteps.
// On hit: outCell = the voxel coords, outNormal = the face normal, outBlock = type, outT = ray distance.
bool traceVoxels(float3 ro, float3 rd, int maxSteps, bool skipWater,
                 out int3 outCell, out float3 outNormal, out uint outBlock, out float outT) {
  outCell = int3(0,0,0); outNormal = float3(0,0,0); outBlock = 0u; outT = 0.0;

  int3 cell = int3(floor(ro));
  float3 invd = 1.0 / rd;
  int3 step = int3(rd.x < 0.0 ? -1 : 1, rd.y < 0.0 ? -1 : 1, rd.z < 0.0 ? -1 : 1);

  // Distance (in t) to the next grid line on each axis.
  float3 tDelta = abs(invd);
  float3 nextEdge = float3(step.x > 0 ? float(cell.x + 1) : float(cell.x),
                           step.y > 0 ? float(cell.y + 1) : float(cell.y),
                           step.z > 0 ? float(cell.z + 1) : float(cell.z));
  float3 tMax = (nextEdge - ro) * invd;

  float3 normal = float3(0,0,0);
  float t = 0.0;
  [loop]
  for (int i = 0; i < maxSteps; i++) {
    uint b = sampleVoxel(cell.x, cell.y, cell.z);
    if (b != 0u && !(skipWater && b == ${B_WATER}u)) {
      // If we hit on the very first cell (ray started inside geometry) the face
      // normal is still zero — seed it facing back at the viewer so downstream
      // lighting/fresnel never operate on a degenerate (0,0,0) normal.
      if (dot(normal, normal) < 0.5) normal = normalize(-rd);
      outCell = cell; outNormal = normal; outBlock = b; outT = t;
      return true;
    }
    // Advance to the nearest axis plane.
    if (tMax.x < tMax.y && tMax.x < tMax.z) {
      cell.x += step.x; t = tMax.x; tMax.x += tDelta.x; normal = float3(-step.x, 0, 0);
    } else if (tMax.y < tMax.z) {
      cell.y += step.y; t = tMax.y; tMax.y += tDelta.y; normal = float3(0, -step.y, 0);
    } else {
      cell.z += step.z; t = tMax.z; tMax.z += tDelta.z; normal = float3(0, 0, -step.z);
    }
    // Leaving the vertical slab downward = sky below; bail early.
    if (cell.y < -1 && step.y < 0) break;
    if (cell.y > WY + 1 && step.y > 0) break;
  }
  return false;
}

// Longer DDA shadow ray toward the sun. Averages two slightly jittered rays for a
// soft-but-defined penumbra, and returns a low visibility in shadow (crisp contact
// shadows rather than a washed half-tone). dither decorrelates the jitter per pixel.
float shadowRay(float3 ro, float3 rd, float dither) {
  float3 t1 = normalize(cross(rd, float3(0.0, 1.0, 0.0)) + float3(1e-3, 0.0, 0.0));
  float3 t2 = cross(rd, t1);
  float vis = 0.0;
  [unroll] for (int s = 0; s < 2; s++) {
    float a = (dither + float(s) * 0.5) * 6.2831853;
    float2 off = float2(cos(a), sin(a)) * 0.013;
    float3 jd = normalize(rd + t1 * off.x + t2 * off.y);
    int3 c; float3 n; uint b; float tt;
    // Nearer occluders cast a harder (darker) shadow; far ones soften slightly.
    vis += traceVoxels(ro, jd, 80, true, c, n, b, tt) ? lerp(0.10, 0.32, saturate(tt / 28.0)) : 1.0;
  }
  return vis * 0.5;
}

// Does (x,y,z) occlude ambient light? (Air and water do not.)
bool aoSolid(int x, int y, int z) {
  uint b = sampleVoxel(x, y, z);
  return b != 0u && b != ${B_WATER}u;
}

// Smooth (per-corner) ambient occlusion — classic Minecraft "smooth lighting".
// Computes a vertex-AO brightness at each of the face's 4 corners from its 2 edge
// neighbors + diagonal, then bilinearly interpolates across the face by the in-face
// UV, giving a smooth crevice/edge gradient instead of a flat per-face value.
float smoothAO(int3 cell, float3 n, float3 hitPos) {
  float3 upv = abs(n.y) > 0.5 ? float3(0, 0, 1) : float3(0, 1, 0);
  int3 t1 = int3(round(cross(n, upv)));
  int3 t2 = int3(round(cross(n, float3(t1))));
  int3 base = cell + int3(round(n));            // the air cell in front of the face
  float corners[4];
  int ci = 0;
  [unroll] for (int j = -1; j <= 1; j += 2) {
    [unroll] for (int i = -1; i <= 1; i += 2) {
      bool s1 = aoSolid(base.x + i * t1.x, base.y + i * t1.y, base.z + i * t1.z);
      bool s2 = aoSolid(base.x + j * t2.x, base.y + j * t2.y, base.z + j * t2.z);
      bool cc = aoSolid(base.x + i * t1.x + j * t2.x, base.y + i * t1.y + j * t2.y, base.z + i * t1.z + j * t2.z);
      float vert = (s1 && s2) ? 0.0 : (3.0 - (float(s1) + float(s2) + float(cc)));
      corners[ci++] = lerp(0.38, 1.0, vert / 3.0); // fully-occluded corner = 0.38
    }
  }
  float3 fp = hitPos - (float3(cell) + 0.5);
  float u = saturate(dot(fp, float3(t1)) + 0.5);  // 0 at -t1 edge, 1 at +t1 edge
  float v = saturate(dot(fp, float3(t2)) + 0.5);
  float a = lerp(corners[0], corners[1], u);      // v = 0 edge (j = -1)
  float b = lerp(corners[2], corners[3], u);      // v = 1 edge (j = +1)
  return lerp(a, b, v);
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 p = (fragPos.xy * 2.0 - res) / res.y;
  p.y = -p.y;

  float3 rd = normalize(p.x * iRight + p.y * iUp + iFov * iForward);
  float3 ro = iCamPos;
  float3 sun = normalize(iSunDir);
  float day = saturate(sun.y * 2.4 + 0.14); // 1 = full day, 0 = deep night

  // Warm sun by day fading to cool moonlight at night.
  float3 sunCol = lerp(float3(0.20, 0.26, 0.46), float3(1.55, 1.16, 0.78), day);
  float3 sky = skyColor(rd, sun);

  // When the eye is submerged, SKIP water on the primary ray so it reaches the seabed
  // and terrain (then the underwater deep-fog below tints the whole view). Otherwise the
  // ray would hit the water cell the camera sits in at t=0 and run the surface-shading
  // branch for every pixel — the chaotic "everything's underwater glass" artifact.
  bool eyeWater = iEyeInWater > 0.5;
  int3 cell; float3 n; uint block; float t;
  bool hit = traceVoxels(ro, rd, ${PRIMARY_STEPS}, eyeWater, cell, n, block, t);

  float3 col = sky;
  if (hit) {
    float3 hitPos = ro + rd * t;
    float3 albedo = blockColor(block, float3(cell));

    // Subtle per-voxel value variation so faces don't look perfectly flat.
    float vh = frac(sin(dot(float3(cell), float3(12.9898, 78.233, 37.719))) * 43758.5453);
    albedo *= 0.93 + 0.10 * vh;

    // Lighting. Per-face directional weighting (Minecraft-style) makes cubes read
    // crisply even in flat light: bright tops, graded sides, dark undersides.
    float face = (n.y > 0.5) ? 1.0
               : (n.y < -0.5) ? 0.5
               : (abs(n.x) > 0.5 ? (n.x > 0.0 ? 0.82 : 0.66)
                                 : (n.z > 0.0 ? 0.76 : 0.70));
    float ndl = saturate(dot(n, sun));
    float dither = hash21(fragPos.xy + iTime * 37.0);
    float sh = (ndl > 0.0) ? shadowRay(hitPos + n * 0.03, sun, dither) : 0.0;
    float ao = smoothAO(cell, n, hitPos);

    // Cooler, dimmer hemispheric sky ambient so the warm sun defines form (less wash).
    // Dims toward a cool moonlit fill at night so lava/fire/explosions pop.
    float3 skyAmbCol = lerp(float3(0.09, 0.11, 0.16), float3(0.32, 0.39, 0.52), saturate(n.y * 0.5 + 0.5));
    skyAmbCol *= lerp(0.34, 1.0, day);
    // Warm bounce/back-fill from the sunlit ground onto side faces.
    float bounce = saturate(dot(n, normalize(float3(-sun.x, 0.12, -sun.z)))) * 0.14;
    float3 lit = albedo * face * (skyAmbCol + sunCol * 2.05 * ndl * sh + bounce * float3(0.40, 0.34, 0.24)) * ao;

    if (block == ${B_WATER}u) {
      // ── Water surface: real raytraced reflection + depth-tinted refraction + foam.
      // Crisp ripples: two directional waves + fbm chop, normal from the analytic gradient.
      float2 wp = hitPos.xz;
      float2 k1 = float2(0.90, 0.55); float A1 = 0.5;
      float2 k2 = float2(-0.50, 1.00); float A2 = 0.4;
      float ph1 = dot(wp, k1) + iTime * 1.7;
      float ph2 = dot(wp, k2) - iTime * 1.3;
      float2 dh = A1 * k1 * cos(ph1) + A2 * k2 * cos(ph2);
      float2 wc = wp * 1.8 + iTime * 0.35;
      dh += 0.6 * float2(fbm2(wc + float2(0.12, 0.0)) - fbm2(wc - float2(0.12, 0.0)),
                         fbm2(wc + float2(0.0, 0.12)) - fbm2(wc - float2(0.0, 0.12)));
      float3 wn = normalize(float3(-dh.x * 0.45, 1.0, -dh.y * 0.45));

      // Reflection: trace the ACTUAL world along the reflected ray (hills, trees, sky).
      float3 refl = reflect(rd, wn);
      refl.y = max(refl.y, 0.015);
      float3 reflCol;
      {
        int3 rc; float3 rn; uint rb; float rt;
        if (traceVoxels(hitPos + wn * 0.06 + refl * 0.05, refl, 72, true, rc, rn, rb, rt)) {
          float3 ra = blockColor(rb, float3(rc));
          float rndl = saturate(dot(rn, sun));
          reflCol = ra * (0.28 + 0.95 * rndl);          // cheap lit reflection of terrain
        } else {
          reflCol = skyColor(refl, sun);
        }
      }

      // Depth: probe straight down to the floor for depth-based color + see-through bottom.
      float3 bottomCol = float3(0.06, 0.20, 0.24);
      int depth = 24;
      [loop] for (int d = 0; d < 24; d++) {
        uint bb = sampleVoxel(cell.x, cell.y - 1 - d, cell.z);
        if (bb != 0u && bb != ${B_WATER}u) { bottomCol = blockColor(bb, float3(cell.x, cell.y - 1 - d, cell.z)); depth = d; break; }
      }
      float depthN = saturate(float(depth) / 6.0);
      float3 shallowTint = float3(0.10, 0.42, 0.46);
      float3 deepTint    = float3(0.02, 0.13, 0.19);
      float3 waterTint = lerp(shallowTint, deepTint, depthN);
      // See the sandy/stony bottom through shallow water; fade to water color with depth.
      float3 refrCol = lerp(bottomCol * float3(0.55, 0.80, 0.92), waterTint, saturate(depthN * 1.5 + 0.18));
      refrCol *= (0.5 + 0.5 * sh);

      // Fresnel mix refraction (looking down) vs reflection (grazing).
      // Softer, less mirror-like: cap reflectance and bias toward the water body color.
      float fres = lerp(0.02, 0.62, pow(saturate(1.0 - dot(-rd, wn)), 5.0));
      lit = lerp(refrCol, reflCol, fres);

      // Foam: white at the shoreline (shallow) and on the brightest ripple crests.
      float crest = smoothstep(0.6, 1.0, (sin(ph1) * 0.5 + sin(ph2) * 0.5) * 0.5 + 0.5);
      float shoreFoam = smoothstep(2.2, 0.0, float(depth));
      lit = lerp(lit, float3(0.95, 0.97, 1.0), saturate(shoreFoam * 0.55 + crest * shoreFoam * 0.4 + crest * 0.06));

      // Sharp sun glint + a shimmering reflection road toward the sun.
      float3 hh = normalize(sun - rd);
      lit += sunCol * pow(saturate(dot(wn, hh)), 220.0) * 1.2;
      lit += float3(1.0, 0.82, 0.55) * pow(saturate(dot(refl, sun)), 28.0) * 0.5;
    } else {
      // Crisp specular highlight on snow only.
      if (block == ${B_SNOW}u) {
        float3 h = normalize(sun - rd);
        float spec = pow(saturate(dot(n, h)), 28.0);
        lit += float3(1.0, 0.97, 0.88) * spec * 0.45 * sh;
      } else if (block == ${B_LAVA}u) {
        // Molten self-emission — pulses gently, brighter at night.
        float pulse = 0.85 + 0.15 * sin(iTime * 2.3 + dot(float3(cell), float3(1.7, 0.3, 1.1)));
        lit += float3(2.0, 0.72, 0.16) * pulse * (1.0 + (1.0 - iTimeOfDay) * 0.6);
      } else if (block == ${B_GLOWSTONE}u) {
        lit += float3(1.05, 0.86, 0.46) * (0.9 + (1.0 - iTimeOfDay) * 0.7);
      }
    }

    // Targeted-block selection outline (Minecraft-style dark frame on the aimed face).
    if (iTargetValid != 0 && cell.x == iTargetCell.x && cell.y == iTargetCell.y && cell.z == iTargetCell.z) {
      float3 an = abs(n);
      float3 fpc = hitPos - (float3(cell) + 0.5);
      float2 uv2 = an.y > 0.5 ? fpc.xz : (an.x > 0.5 ? fpc.zy : fpc.xy);
      float edge = max(abs(uv2.x), abs(uv2.y));
      lit = lerp(lit, lit * 0.2, smoothstep(0.4, 0.5, edge) * 0.85);
    }

    col = lit;

    // ── Atmospheric aerial perspective: warm haze accumulates with distance and
    // brightens toward the sun (in-scattering), so far hills melt into golden air.
    // Kept gentle so foreground voxels stay crisp; only the deep distance softens.
    // Aerial haze: crisp foreground + mid-ground, ramping to full only near the DDA
    // view-distance clip so the enormous basin has no hard edge. A power curve keeps
    // near hills sharp (vs. the old exponential that pastel-washed the longer sightlines).
    float fog = pow(saturate((t - 30.0) / 410.0), 2.0);
    float sunAmt = saturate(dot(rd, sun));
    float3 hazeCol = lerp(sky, float3(1.0, 0.80, 0.55), pow(sunAmt, 4.0) * 0.35);
    col = lerp(col, hazeCol, saturate(fog));
  }

  // ── Volumetric god-rays: march a few cheap samples along the eye ray and add
  // glow where the path toward the sun is unoccluded (sunlight in the haze).
  // Tight angular falloff so it only blooms right around the sun, not the whole frame.
  {
    float sunAmt = saturate(dot(rd, sun));
    float godStrength = pow(sunAmt, 9.0);
    if (godStrength > 0.002) {
      float acc = 0.0;
      float dither = hash21(fragPos.xy);
      [unroll] for (int gi = 0; gi < 6; gi++) {
        float gt = (float(gi) + dither) * 5.0 + 1.0;
        float3 sp = ro + rd * gt;
        int3 sc; float3 sn; uint sb; float st;
        // Is this sample point lit by the sun? short shadow probe.
        if (!traceVoxels(sp, sun, 22, true, sc, sn, sb, st)) acc += 1.0;
      }
      acc /= 6.0;
      col += float3(1.0, 0.70, 0.40) * acc * godStrength * 0.30;
    }
  }

  // ── Additive glow-point layer (explosions, fireballs, fire, lava, fuses, steam) ──
  // Each point glows into the air with a soft gaussian, depth-occluded by the scene
  // hit distance so glow behind terrain is correctly hidden. Added BEFORE tonemap.
  {
    float sceneT = hit ? t : 1e9;
    [loop] for (uint gi = 0u; gi < iGlowCount; gi++) {
      float4 gA = iGlow[gi * 2u];       // pos.xyz, radius
      float4 gB = iGlow[gi * 2u + 1u];  // color.rgb, intensity
      float gr = max(gA.w, 0.25);
      float s = dot(gA.xyz - ro, rd);
      if (s <= 0.0) continue;
      float occ = saturate((sceneT - s) / max(gr, 1.0) + 0.5); // soft occlusion band
      float d = length((ro + rd * s) - gA.xyz);
      float gauss = exp(-(d * d) / (gr * gr));
      // Tame close-range blow-out: glow contribution is softened as the point
      // approaches the camera (1/(1+s) alone over-blooms when you stand in lava/fire).
      float nearFade = saturate((s - 1.0) * 0.5);
      col += gB.rgb * gB.w * gauss * occ * nearFade / (1.0 + 0.05 * s);
    }
    col = min(col, float3(12.0, 12.0, 12.0)); // keep glow from oversaturating into white
  }

  // ── Underwater: when the eye is submerged, fog the whole scene into a deep
  // blue-green and add a gentle caustic shimmer, instead of surface shading. ──
  if (iEyeInWater > 0.5) {
    float depthFog = hit ? saturate(t * 0.085 + 0.30) : 0.85;
    float3 deepWater = float3(0.035, 0.16, 0.20);
    col = lerp(col, deepWater, depthFog);
    float caustic = 0.5 + 0.5 * sin(ro.x * 2.0 + iTime * 2.0) * sin(ro.z * 2.0 - iTime * 1.6);
    col += deepWater * caustic * 0.10;
    col *= 0.82; // a touch dimmer below the surface
  }

  // Explosion white flash (full-screen, pre-tonemap so it blooms through the filmic
  // curve). Kept restrained + warm so the fireball reads as a colored ball rather
  // than a flat white wash, especially when a close cinematic blast fills the frame.
  col += iFlash * float3(1.0, 0.86, 0.66) * 0.40;

  // ── Filmic tonemap (ACES-ish) so highlights glow without hard clipping.
  float exposure = 0.95;
  float3 x = col * exposure;
  col = saturate((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));
  col = pow(col, 1.0 / 2.2);

  // Soft warm vignette frames the vista.
  float2 q = fragPos.xy / res;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.20);
  col *= lerp(0.80, 1.05, vig);
  // Whisper of warm grade in the shadows.
  col = lerp(col, col * float3(1.04, 1.0, 0.94), 0.5);

  // Damage vignette: the screen edges throb deep red the instant you take a hit.
  if (iHurt > 0.001) {
    float redge = pow(saturate(length(q - 0.5) * 1.7), 2.4);
    col = lerp(col, float3(0.72, 0.02, 0.02), saturate(redge * iHurt));
  }

  return float4(col, 1.0);
}
`;

// ── CPU world generation ────────────────────────────────────────────────────
function idx(x: number, y: number, z: number): number {
  return x + z * W + y * W * D;
}

function lerp01(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smooth value noise from a hashed integer lattice with bilinear interpolation. */
function makeNoise2D(seed: number): (x: number, z: number) => number {
  const hash = (xi: number, zi: number): number => {
    let h = (xi * 374761393 + zi * 668265263 + seed * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return ((h >>> 0) % 100000) / 100000; // 0..1
  };
  const smooth = (a: number, b: number, t: number): number => {
    const s = t * t * (3 - 2 * t);
    return a + (b - a) * s;
  };
  return (x: number, z: number): number => {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const fx = x - x0;
    const fz = z - z0;
    const v00 = hash(x0, z0);
    const v10 = hash(x0 + 1, z0);
    const v01 = hash(x0, z0 + 1);
    const v11 = hash(x0 + 1, z0 + 1);
    const ix0 = smooth(v00, v10, fx);
    const ix1 = smooth(v01, v11, fx);
    return smooth(ix0, ix1, fz);
  };
}

function generateWorld(seed = 1337): Uint32Array {
  const voxels = new Uint32Array(W * H * D); // zero = all air
  // Every noise field is keyed off the seed, so each press of R yields a genuinely
  // different basin (terrain, ridges, domain warp, river meander).
  const s = seed | 0;
  const n1 = makeNoise2D((1337 ^ s) | 0);
  const n2 = makeNoise2D((4242 ^ (s * 7 + 1)) | 0);
  const n3 = makeNoise2D((9001 ^ (s * 13 + 3)) | 0);
  const nRidge = makeNoise2D((5150 ^ (s * 17 + 5)) | 0);
  const nWarp = makeNoise2D((2718 ^ (s * 23 + 7)) | 0);
  const riverPhase = ((s % 977) * 0.0123) % (Math.PI * 2); // per-seed river meander phase
  // Scatter density scales with the basin area so a 256² world isn't sparse.
  const areaScale = (W * D) / (128 * 128);

  const height = new Int32Array(W * D);

  for (let z = 0; z < D; z += 1) {
    for (let x = 0; x < W; x += 1) {
      // Domain-warp the sample point a touch so ridges meander naturally.
      const wx = x + (nWarp(x / 40, z / 40) - 0.5) * 22;
      const wz = z + (nWarp(z / 40 + 5, x / 40 + 5) - 0.5) * 22;

      // Fractal value-noise heightmap (multi-octave).
      let e = 0;
      e += n1(wx / 44, wz / 44) * 1.0;
      e += n2(wx / 19, wz / 19) * 0.5;
      e += n3(wx / 9, wz / 9) * 0.25;
      e /= 1.75; // 0..1

      // Ridged term carves dramatic cliffs and crests for taller, sharper hills.
      const r = 1 - Math.abs(nRidge(wx / 30, wz / 30) * 2 - 1);
      e = e * 0.7 + r * r * 0.45;

      // Shape: gentle valleys, dramatic peaks above the snow line. Caps below H so
      // there's air headroom over the tallest peaks (for flying meteors + mobs).
      e = Math.pow(Math.max(0, Math.min(1, e)), 1.45);
      let h = Math.floor(5 + e * (H - 14));
      h = Math.max(2, Math.min(H - 6, h));

      // ── Winding river carved through the basin. A meandering channel follows a
      // warped sine; cells near its centerline get gouged down below sea level.
      const riverCenter = D * 0.5 + Math.sin(x / 32 + riverPhase) * 30 + (nWarp(x / 30, 7) - 0.5) * 44;
      const riverDist = Math.abs(z - riverCenter);
      const riverWidth = 8 + nWarp(x / 18, 13) * 6;
      if (riverDist < riverWidth) {
        const carve = (1 - riverDist / riverWidth); // 0..1, deepest at center
        const bed = SEA_LEVEL - 3 - Math.floor(carve * 4);
        if (h > bed) h = bed;
        h = Math.max(2, h);
      }

      height[x + z * W] = h;

      for (let y = 0; y <= h; y += 1) {
        let block: number;
        if (y === h) {
          if (h >= H - 16) block = B_SNOW;
          else if (h <= SEA_LEVEL + 1) block = B_SAND;            // beaches/banks
          else block = B_GRASS;
        } else if (y >= h - 3) {
          block = h <= SEA_LEVEL + 2 ? B_SAND : B_DIRT;
        } else {
          block = B_STONE;
        }
        voxels[idx(x, y, z)] = block;
      }

      // Fill water up to sea level over land that sits below it.
      for (let y = h + 1; y <= SEA_LEVEL; y += 1) {
        voxels[idx(x, y, z)] = B_WATER;
      }
    }
  }

  // Scatter trees on grass above the shoreline, with varied canopy shapes/sizes.
  let treeSeed = ((24680 ^ (s * 40503)) & 0x7fffffff) || 1;
  const rng = (): number => {
    treeSeed = (treeSeed * 1103515245 + 12345) & 0x7fffffff;
    return treeSeed / 0x7fffffff;
  };
  const treeCount = Math.round(150 * areaScale);
  for (let tIter = 0; tIter < treeCount; tIter += 1) {
    const tx = 3 + Math.floor(rng() * (W - 6));
    const tz = 3 + Math.floor(rng() * (D - 6));
    const gh = height[tx + tz * W]!;
    if (gh <= SEA_LEVEL + 1 || gh >= H - 10) continue;
    if (voxels[idx(tx, gh, tz)] !== B_GRASS) continue;
    // Skip if right next to water so trees hug the meadows, not the banks.
    const trunk = 4 + Math.floor(rng() * 4);
    for (let y = 1; y <= trunk; y += 1) {
      const yy = gh + y;
      if (yy < H) voxels[idx(tx, yy, tz)] = B_WOOD;
    }
    // Leaf canopy: a rounded blob centered above the trunk top, size varies.
    const top = gh + trunk;
    const r = 2 + Math.floor(rng() * 2); // 2..3
    for (let dy = -1; dy <= 3; dy += 1) {
      const ry = dy <= 0 ? r : Math.max(1, r - dy + 1);
      const rr = ry * ry + (rng() > 0.5 ? 1 : 0);
      for (let dz = -ry; dz <= ry; dz += 1) {
        for (let dx = -ry; dx <= ry; dx += 1) {
          if (dx * dx + dz * dz > rr) continue;
          const lx = tx + dx;
          const ly = top + dy;
          const lz = tz + dz;
          if (lx < 0 || lz < 0 || lx >= W || lz >= D || ly < 0 || ly >= H) continue;
          if (voxels[idx(lx, ly, lz)] === B_AIR) voxels[idx(lx, ly, lz)] = B_LEAF;
        }
      }
    }
  }

  // ── Physics-showcase features: gravel slopes, glowstone veins, lava pools, and
  //    plank shacks to demolish. Reuses the deterministic tree RNG above. ────────
  // Gravel blobs scattered on dry, mid-altitude surface.
  for (let i = 0; i < Math.round(40 * areaScale); i += 1) {
    const gx = 3 + Math.floor(rng() * (W - 6));
    const gz = 3 + Math.floor(rng() * (D - 6));
    const gh = height[gx + gz * W]!;
    if (gh <= SEA_LEVEL + 1 || gh >= H - 6) continue;
    const r = 1 + Math.floor(rng() * 2);
    for (let dz = -r; dz <= r; dz += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        const x = gx + dx;
        const z = gz + dz;
        if (x < 0 || z < 0 || x >= W || z >= D) continue;
        const h = height[x + z * W]!;
        const top = voxels[idx(x, h, z)];
        if (top === B_GRASS || top === B_DIRT) voxels[idx(x, h, z)] = B_GRAVEL;
      }
    }
  }

  // Glowstone veins just beneath the surface (a warm subterranean glint).
  for (let i = 0; i < Math.round(24 * areaScale); i += 1) {
    const gx = 2 + Math.floor(rng() * (W - 4));
    const gz = 2 + Math.floor(rng() * (D - 4));
    const gh = height[gx + gz * W]!;
    const gy = Math.max(2, gh - 1 - Math.floor(rng() * 4));
    if (voxels[idx(gx, gy, gz)] === B_STONE) voxels[idx(gx, gy, gz)] = B_GLOWSTONE;
  }

  // A few small lava pools in dry depressions, kept well away from water.
  let pools = 0;
  const poolTarget = Math.round(3 * areaScale);
  for (let attempt = 0; attempt < 600 * areaScale && pools < poolTarget; attempt += 1) {
    const lx = 10 + Math.floor(rng() * (W - 20));
    const lz = 10 + Math.floor(rng() * (D - 20));
    const lh = height[lx + lz * W]!;
    if (lh <= SEA_LEVEL + 3 || lh >= H - 8) continue;
    let nearWater = false;
    for (let dz = -3; dz <= 3 && !nearWater; dz += 1) {
      for (let dx = -3; dx <= 3; dx += 1) {
        const x = lx + dx;
        const z = lz + dz;
        if (x < 0 || z < 0 || x >= W || z >= D) continue;
        if (height[x + z * W]! <= SEA_LEVEL) nearWater = true;
      }
    }
    if (nearWater) continue;
    const r = 2;
    for (let dz = -r; dz <= r; dz += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (dx * dx + dz * dz > r * r + 1) continue;
        const x = lx + dx;
        const z = lz + dz;
        if (x < 0 || z < 0 || x >= W || z >= D) continue;
        const h = height[x + z * W]!;
        voxels[idx(x, h, z)] = B_LAVA;
        if (h - 1 >= 0) voxels[idx(x, h - 1, z)] = B_LAVA;
      }
    }
    pools += 1;
  }

  // A few hollow plank shacks on the meadow — satisfying to blow apart.
  let shacks = 0;
  const shackTarget = Math.round(3 * areaScale);
  for (let attempt = 0; attempt < 600 * areaScale && shacks < shackTarget; attempt += 1) {
    const bx = 12 + Math.floor(rng() * (W - 24));
    const bz = 12 + Math.floor(rng() * (D - 24));
    const bh = height[bx + bz * W]!;
    if (bh <= SEA_LEVEL + 2 || bh >= H - 10) continue;
    if (voxels[idx(bx, bh, bz)] !== B_GRASS) continue;
    const wd = 4;
    const ht = 4;
    for (let dz = 0; dz <= wd; dz += 1) {
      for (let dx = 0; dx <= wd; dx += 1) {
        for (let dy = 1; dy <= ht; dy += 1) {
          const x = bx + dx;
          const z = bz + dz;
          const y = bh + dy;
          if (x >= W || z >= D || y >= H) continue;
          const edge = dx === 0 || dz === 0 || dx === wd || dz === wd;
          const roof = dy === ht;
          const door = dz === 0 && dx === 2 && dy <= 2;
          if ((edge || roof) && !door) voxels[idx(x, y, z)] = B_PLANK;
        }
      }
    }
    shacks += 1;
  }

  return voxels;
}

/** CPU mirror of the shader DDA — picks the targeted/adjacent cell from screen center. */
function pickVoxel(
  voxels: Uint32Array,
  ro: [number, number, number],
  rd: [number, number, number],
  maxSteps: number,
): { hit: boolean; cell: [number, number, number]; prev: [number, number, number] } {
  let cx = Math.floor(ro[0]);
  let cy = Math.floor(ro[1]);
  let cz = Math.floor(ro[2]);
  const sx = rd[0] < 0 ? -1 : 1;
  const sy = rd[1] < 0 ? -1 : 1;
  const sz = rd[2] < 0 ? -1 : 1;
  const idx0 = Math.abs(1 / rd[0]);
  const idy0 = Math.abs(1 / rd[1]);
  const idz0 = Math.abs(1 / rd[2]);
  let tmx = ((sx > 0 ? cx + 1 : cx) - ro[0]) / rd[0];
  let tmy = ((sy > 0 ? cy + 1 : cy) - ro[1]) / rd[1];
  let tmz = ((sz > 0 ? cz + 1 : cz) - ro[2]) / rd[2];
  let px = cx;
  let py = cy;
  let pz = cz;
  for (let i = 0; i < maxSteps; i += 1) {
    if (cx >= 0 && cy >= 0 && cz >= 0 && cx < W && cy < H && cz < D) {
      const b = voxels[idx(cx, cy, cz)]!;
      if (b !== B_AIR && b !== B_WATER) {
        return { hit: true, cell: [cx, cy, cz], prev: [px, py, pz] };
      }
    }
    px = cx;
    py = cy;
    pz = cz;
    if (tmx < tmy && tmx < tmz) {
      cx += sx;
      tmx += idx0;
    } else if (tmy < tmz) {
      cy += sy;
      tmy += idy0;
    } else {
      cz += sz;
      tmz += idz0;
    }
    if (cy < -2 || cy > H + 2) break;
  }
  return { hit: false, cell: [cx, cy, cz], prev: [px, py, pz] };
}

// ── Swept-AABB physics (pure; shared by the player and all entities) ───────────
export interface MoveResult {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  onGround: boolean;
  hitX: boolean;
  hitY: boolean;
  hitZ: boolean;
}

/**
 * Does the body AABB — centered on (x,z) with width sx,sz, feet at y, height sy —
 * overlap any solid voxel? `sampleSolid` decides per cell (incl. out-of-bounds).
 */
function bodyHitsSolid(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  sampleSolid: (x: number, y: number, z: number) => boolean,
): boolean {
  const x0 = Math.floor(x - sx / 2);
  const x1 = Math.floor(x + sx / 2 - 1e-6);
  const z0 = Math.floor(z - sz / 2);
  const z1 = Math.floor(z + sz / 2 - 1e-6);
  const y0 = Math.floor(y);
  const y1 = Math.floor(y + sy - 1e-6);
  for (let yy = y0; yy <= y1; yy += 1) {
    for (let zz = z0; zz <= z1; zz += 1) {
      for (let xx = x0; xx <= x1; xx += 1) {
        if (sampleSolid(xx, yy, zz)) return true;
      }
    }
  }
  return false;
}

/** Binary-search the farthest clear position from `from` (clear) toward `to`. */
function sweepAxis(blocked: (p: number) => boolean, from: number, to: number): { p: number; hit: boolean } {
  if (!blocked(to)) return { p: to, hit: false };
  let lo = from;
  let hi = to;
  for (let i = 0; i < 12; i += 1) {
    const mid = (lo + hi) * 0.5;
    if (blocked(mid)) hi = mid;
    else lo = mid;
  }
  return { p: lo, hit: true };
}

/**
 * Move a body AABB through the voxel grid with axis-separated swept collision.
 * Resolves X, then Z, then Y; sub-steps so no axis advances more than ~0.4 voxels
 * (anti-tunnelling); auto-climbs ledges up to `stepUp` tall when blocked horizontally
 * (so walking up voxel terrain is smooth); sets `onGround` when downward motion is
 * stopped. Pure: `sampleSolid` is the only world access. Gravity/jump are the caller's.
 */
export function sweptMove(
  px: number,
  py: number,
  pz: number,
  vx: number,
  vy: number,
  vz: number,
  sx: number,
  sy: number,
  sz: number,
  dt: number,
  sampleSolid: (x: number, y: number, z: number) => boolean,
  stepUp: number,
): MoveResult {
  const maxMove = Math.max(Math.abs(vx), Math.abs(vy), Math.abs(vz)) * dt;
  const steps = Math.min(16, Math.max(1, Math.ceil(maxMove / 0.4)));
  const h = dt / steps;
  let x = px;
  let y = py;
  let z = pz;
  let onGround = false;
  let hitX = false;
  let hitY = false;
  let hitZ = false;

  for (let s = 0; s < steps; s += 1) {
    if (vx !== 0) {
      const nx = x + vx * h;
      const r = sweepAxis((p) => bodyHitsSolid(p, y, z, sx, sy, sz, sampleSolid), x, nx);
      if (r.hit) {
        if (
          stepUp > 0 &&
          !bodyHitsSolid(x, y + stepUp, z, sx, sy, sz, sampleSolid) &&
          !bodyHitsSolid(nx, y + stepUp, z, sx, sy, sz, sampleSolid)
        ) {
          x = nx;
          y += stepUp;
        } else {
          x = r.p;
          vx = 0;
          hitX = true;
        }
      } else {
        x = r.p;
      }
    }
    if (vz !== 0) {
      const nz = z + vz * h;
      const r = sweepAxis((p) => bodyHitsSolid(x, y, p, sx, sy, sz, sampleSolid), z, nz);
      if (r.hit) {
        if (
          stepUp > 0 &&
          !bodyHitsSolid(x, y + stepUp, z, sx, sy, sz, sampleSolid) &&
          !bodyHitsSolid(x, y + stepUp, nz, sx, sy, sz, sampleSolid)
        ) {
          z = nz;
          y += stepUp;
        } else {
          z = r.p;
          vz = 0;
          hitZ = true;
        }
      } else {
        z = r.p;
      }
    }
    if (vy !== 0) {
      const ny = y + vy * h;
      const r = sweepAxis((p) => bodyHitsSolid(x, p, z, sx, sy, sz, sampleSolid), y, ny);
      if (r.hit) {
        if (vy < 0) onGround = true;
        y = r.p;
        vy = 0;
        hitY = true;
      } else {
        y = r.p;
      }
    }
  }
  return { x, y, z, vx, vy, vz, onGround, hitX, hitY, hitZ };
}

// ── Procedural audio (XAudio2 PCM out; silent-safe if no device) ───────────────
interface Voice {
  t: number;
  dur: number;
  gen: (t: number) => number;
}
interface Audio {
  foot(): void;
  jump(): void;
  land(speed: number): void;
  splash(): void;
  breakBlock(): void;
  place(): void;
  boom(power: number): void;
  squeak(): void;
  hurt(): void;
  pump(fuseActive: boolean, fireActive: boolean): void;
  close(): void;
}

function makeAudio(): Audio {
  const SR = 44100;
  const BLOCK = 735; // ~16.7 ms
  const audioBlock = new Int16Array(BLOCK); // reused synthesis scratch (pump copies it on submit)
  const pcm = createPcmOutput({ sampleRate: SR, channels: 1 });
  pcm.start();
  const voices: Voice[] = [];
  let phase = 0;
  let fuseLvl = 0;
  let fireLvl = 0;
  const noise = (): number => Math.random() * 2 - 1;
  const add = (dur: number, gen: (t: number) => number): void => {
    if (voices.length < 48) voices.push({ t: 0, dur, gen });
  };
  return {
    foot: () => add(0.09, (t) => noise() * Math.exp(-t * 42) * 0.16),
    jump: () => add(0.18, (t) => Math.sin(2 * Math.PI * (300 + 700 * t) * t) * Math.exp(-t * 9) * 0.18),
    land: (v) => {
      const a = Math.min(0.4, v * 0.018);
      add(0.26, (t) => (Math.sin(2 * Math.PI * 68 * t) * 0.7 + noise() * 0.3) * Math.exp(-t * 13) * a);
    },
    splash: () => add(0.42, (t) => noise() * Math.exp(-t * 7) * 0.22 + Math.sin(2 * Math.PI * (640 - 430 * t) * t) * Math.exp(-t * 9) * 0.1),
    breakBlock: () => add(0.12, (t) => (noise() * 0.6 + Math.sin(2 * Math.PI * 420 * t) * 0.4) * Math.exp(-t * 30) * 0.18),
    place: () => add(0.08, (t) => Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 42) * 0.14),
    boom: (power) => {
      const a = Math.min(0.95, 0.45 + power * 0.3);
      add(1.15, (t) => (Math.sin(2 * Math.PI * (58 - 22 * t) * t) * 0.6 + noise() * Math.exp(-t * 6) * 0.5 + Math.sin(2 * Math.PI * 40 * t) * 0.3) * Math.exp(-t * 2.4) * a);
    },
    squeak: () => add(0.12, (t) => Math.sin(2 * Math.PI * (900 + 500 * Math.sin(t * 55)) * t) * Math.exp(-t * 16) * 0.1),
    hurt: () => add(0.24, (t) => (Math.sin(2 * Math.PI * (200 - 120 * t) * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 7) * 0.32),
    pump: (fuseActive, fireActive) => {
      if (!pcm.available) return;
      fuseLvl += ((fuseActive ? 1 : 0) - fuseLvl) * 0.12;
      fireLvl += ((fireActive ? 1 : 0) - fireLvl) * 0.12;
      let guard = 0;
      // Reused scratch block: every sample is overwritten each pass and pcm.submit()
      // copies it into a long-lived ring slot, so a single buffer is safe to recycle.
      const block = audioBlock;
      while (pcm.queued() < 3 && guard < 4) {
        guard += 1;
        for (let i = 0; i < BLOCK; i += 1) {
          let s = 0;
          for (const v of voices) {
            s += v.gen(v.t);
            v.t += 1 / SR;
          }
          s += noise() * 0.014 * fuseLvl; // fuse hiss
          s += (noise() * 0.6 + Math.sin((2 * Math.PI * 190 * phase) / SR) * 0.4) * 0.02 * fireLvl; // fire crackle
          s += noise() * 0.005; // faint ambient
          phase += 1;
          const c = s * 32000;
          block[i] = c > 32000 ? 32000 : c < -32000 ? -32000 : c;
        }
        pcm.submit(block);
        for (let k = voices.length - 1; k >= 0; k -= 1) if (voices[k]!.t >= voices[k]!.dur) voices.splice(k, 1);
      }
    },
    close: () => pcm.close(),
  };
}

function main(): void {
  const win = gpu.createWindow({ title: 'Voxelscape — raytraced voxel world', width: WIDTH, height: HEIGHT, borderless: true });
  const { w: cw, h: ch } = win.clientSize();
  const g = gpu.createDevice(win.hwnd, { width: cw, height: ch });

  // Capture mode pins a fixed seed for a deterministic gallery shot; interactive play
  // launches a fresh RANDOM world each run (and R reshuffles it — see regenerate()).
  const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
  const interactive = durationMs === 0;
  const CAPTURE_SEED = 1337;
  let worldSeed = process.env.VOX_SEED ? Number(process.env.VOX_SEED) | 0 : interactive ? (Math.random() * 0x7fffffff) | 0 : CAPTURE_SEED;

  // Build the world on the CPU and upload it as a structured buffer SRV.
  const sim = createSim(W, H, D, generateWorld(worldSeed));
  const voxels = sim.world; // authoritative grid (the sim owns + mutates it)
  const frame = new Uint32Array(W * H * D); // render grid = world + stamped entities
  const frameBuf = Buffer.from(frame.buffer, 0, frame.byteLength); // persistent view, reused each upload
  const entities = createEntities(sim);
  const voxelBytes = Buffer.from(voxels.buffer, 0, voxels.byteLength);
  const field = gpu.makeStructuredBuffer({ stride: 4, count: W * H * D, srv: true, cpuWritable: true, initialData: voxelBytes });

  /** Block id at (x,y,z), or air outside the world. */
  const voxelAt = (x: number, y: number, z: number): number =>
    x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D ? B_AIR : voxels[idx(x, y, z)]!;

  // Compile shaders.
  let vs: bigint;
  let ps: bigint;
  let vsCode: gpu.CompiledShader;
  let psCode: gpu.CompiledShader;
  try {
    vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
    psCode = gpu.compile(PS_SOURCE, 'main', 'ps_5_0');
    vs = gpu.makeVertexShader(vsCode);
    ps = gpu.makePixelShader(psCode);
  } catch (err) {
    console.error(String((err as Error).message));
    teardown(1);
    return;
  }

  // Constant buffer (see the HLSL cbuffer Frame layout): camera/sun/time block @0,
  // target cell @96, glow count @112, then GLOW_MAX×2 float4 of glow points @128.
  const CB_SIZE = 128 + GLOW_MAX * 2 * 16; // 1152 bytes (multiple of 16)
  const cb = gpu.makeConstantBuffer(CB_SIZE);
  const cbData = Buffer.alloc(CB_SIZE);

  const samp = gpu.makeSampler(); // unused by the PS but harmless; kept for parity

  // GDI HUD font.
  const consolas = Buffer.from('Consolas\0', 'utf16le'); // kept alive; shared by all HUD fonts
  const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, consolas.ptr!);
  const hudFontSm = GDI32.CreateFontW(-13, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, consolas.ptr!); // status/labels
  const hudFontBig = GDI32.CreateFontW(-30, 0, 0, 0, 800, 0, 0, 0, 0, 0, 0, 4, 0, consolas.ptr!); // banner/score/toast

  // ── Camera state ────────────────────────────────────────────────────────────
  let camX = W * 0.5;
  let camY = SEA_LEVEL + 18;
  let camZ = -10;
  let yaw = 0.0; // around +Y; 0 looks toward +Z
  let pitch = -0.28;

  // ── Player body (walk mode) ───────────────────────────────────────────────────
  const PSX = 0.6; // body half-extents → AABB 0.6 × 1.8 × 0.6
  const PSY = 1.8;
  const PSZ = 0.6;
  const EYE_H = 1.62; // eye height above the feet
  const GRAVITY = 28;
  const JUMP_V = 8.8;
  const WALK_SPEED = 5.6;
  const SPRINT_SPEED = 9.4;
  const STEP_UP = 1.05; // climb a single full block automatically
  // Spawn on solid ground a bit off the central river.
  const spawnX = Math.floor(W * 0.5) + 0.5;
  const spawnZ = Math.floor(D * 0.28) + 0.5;
  let spawnFeet = SEA_LEVEL + 1;
  for (let y = H - 1; y >= 1; y -= 1) {
    if (isSolid(voxelAt(Math.floor(spawnX), y, Math.floor(spawnZ)))) {
      spawnFeet = y + 1;
      break;
    }
  }
  const player: [number, number, number] = [spawnX, spawnFeet + 0.05, spawnZ];
  const pvel: [number, number, number] = [0, 0, 0];
  let onGround = false;
  let flying = false; // interactive starts in walk mode; F toggles free-fly
  let prevF = false;

  // ── Hotbar: slot 0 digs, 1-7 place materials, 8 places TNT, 9 throws bombs ─────
  const HOTBAR: { name: string; block: number }[] = [
    { name: 'Dig', block: -1 },
    { name: 'Stone', block: B_STONE },
    { name: 'Dirt', block: B_DIRT },
    { name: 'Sand', block: B_SAND },
    { name: 'Gravel', block: B_GRAVEL },
    { name: 'Water', block: B_WATER },
    { name: 'Lava', block: B_LAVA },
    { name: 'Plank', block: B_PLANK },
    { name: 'TNT', block: B_TNT },
    { name: 'Bomb', block: -2 },
  ];
  let selectedSlot = 0;
  let actCooldown = 0; // throttles held break/place
  let meleeCd = 0; // throttles melee swats
  let crosshairHot = false; // a hostile is within melee reach (crosshair reddens)
  let prevE = false;
  let prevB = false;
  let prevM = false;
  let prevC = false;
  let prevR = false;
  let toast = '';
  let toastUntil = 0;
  const setToast = (msg: string, now: number): void => {
    toast = msg;
    toastUntil = now + 2.4;
  };
  // Solid test for body collision: world edges + floor are walls; air/water/lava pass through.
  const solidAt = (x: number, y: number, z: number): boolean => {
    if (x < 0 || z < 0 || x >= W || z >= D) return true;
    if (y < 0) return true;
    if (y >= H) return false;
    return isSolid(voxelAt(x, y, z));
  };
  // Sun direction, recomputed every frame from timeOfDay (animated day/night cycle).
  const sun: [number, number, number] = [0, 0, 0];
  /** Map time-of-day (0..1) → sun direction. 0.25 ≈ dawn, 0.5 ≈ noon, 0.75 ≈ dusk, ~0/1 ≈ night. */
  function computeSun(tod: number): void {
    const phase = tod * Math.PI * 2;
    const elev = Math.sin(phase - Math.PI / 2) * 1.15; // radians; <0 ⇒ sun below horizon (night)
    const azim = 2.15 + tod * 0.9; // heading drifts slowly across the day
    const ce = Math.cos(elev);
    sun[0] = ce * Math.sin(azim);
    sun[1] = Math.sin(elev);
    sun[2] = ce * Math.cos(azim);
  }

  // Debug/verification static camera in capture mode: VOX_CAM="x,y,z,yaw,pitch".
  let camOverride: number[] | null = process.env.VOX_CAM
    ? process.env.VOX_CAM.split(',').map(Number)
    : null;
  // VOX_SURVIVAL: run the night-wave loop in capture mode (verification), camera pinned at
  // the player's eye so the converging mobs swarm into view. VOX_CAM still overrides.
  if (process.env.VOX_SURVIVAL && !camOverride) {
    camOverride = [player[0], player[1] + EYE_H, player[2], 0.6, -0.04];
  }
  // VOX_DIVE: drop a static camera INSIDE a water body to verify the underwater render path.
  if (process.env.VOX_DIVE) {
    let found = false;
    for (let zz = 2; zz < D - 2 && !found; zz += 1) {
      for (let xx = 2; xx < W - 2 && !found; xx += 1) {
        for (let yy = SEA_LEVEL; yy >= 3; yy -= 1) {
          if (voxelAt(xx, yy, zz) === B_WATER && voxelAt(xx, yy - 1, zz) === B_WATER) {
            camOverride = [xx + 0.5, yy + 0.25, zz + 0.5, 0.6, -0.1];
            found = true;
            break;
          }
        }
      }
    }
  }
  // Procedural audio only in interactive play (silent in capture).
  const audio: Audio | null = interactive ? makeAudio() : null;
  let footTimer = 0;
  let prevOnGround = false;
  let prevInWater = false;

  // Mouse-look recenter target (screen coords of the window center).
  const centerScr = { x: 0, y: 0 };
  if (interactive) {
    const rect = Buffer.alloc(16);
    User32.GetWindowRect(win.hwnd, rect.ptr!);
    centerScr.x = Math.floor((rect.readInt32LE(0) + rect.readInt32LE(8)) / 2);
    centerScr.y = Math.floor((rect.readInt32LE(4) + rect.readInt32LE(12)) / 2);
    User32.ShowCursor(0);
    User32.SetCursorPos(centerScr.x, centerScr.y);
  }

  // Edge-debounce for click edits.
  let prevLeft = false;
  let prevRight = false;
  const ptBuf = Buffer.alloc(8);

  console.log('Voxelscape — DDA voxel raytracer on the GPU.');
  console.log(`  ${g.driver} · ${g.gpuName}  ·  world ${W}x${H}x${D}`);
  console.log(interactive ? '  WASD move · space/shift up/down · mouse look · LMB break · RMB place · ESC exit.' : `  Scripted fly-through (${durationMs} ms).`);

  const startTime = performance.now();
  let frames = 0;
  let fps = 0;
  let fpsWindowStart = startTime;
  let lastNow = startTime;

  function basis(): { fwd: [number, number, number]; right: [number, number, number]; up: [number, number, number] } {
    const cp = Math.cos(pitch);
    const fwd: [number, number, number] = [Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp];
    // right = normalize(cross(worldUp, fwd))
    const rx = fwd[2];
    const rz = -fwd[0];
    const rl = Math.hypot(rx, rz) || 1;
    const right: [number, number, number] = [rx / rl, 0, rz / rl];
    // up = cross(fwd, right)
    const up: [number, number, number] = [
      fwd[1] * right[2] - fwd[2] * right[1],
      fwd[2] * right[0] - fwd[0] * right[2],
      fwd[0] * right[1] - fwd[1] * right[0],
    ];
    return { fwd, right, up };
  }

  // Stamp one dynamic voxel into the render grid, without burying solid terrain.
  function stampCell(x: number, y: number, z: number, b: number): void {
    if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
    const i = idx(x, y, z);
    const cur = frame[i]!;
    if (cur === B_AIR || cur === B_WATER) frame[i] = b;
  }

  function reuploadField(): void {
    // Render grid = world snapshot + stamped entities (debris, critters, projectiles).
    frame.set(voxels);
    for (const e of entities.list) {
      const x = Math.floor(e.pos[0]);
      const z = Math.floor(e.pos[2]);
      const y = Math.floor(e.pos[1]);
      if (e.kind === ENT_CRITTER) {
        stampCell(x, y, z, e.block);
        stampCell(x, y + 1, z, e.block);
      } else {
        stampCell(x, y, z, e.block);
      }
    }
    gpu.updateDynamicBuffer(field.buffer, frameBuf);
  }
  // Cheap signature of every entity's CELL (+ count). The render grid only changes when an
  // entity crosses a cell boundary (or the world ticks/is edited), so this lets us skip the
  // full 37.7 MB grid re-upload on the many frames where everything sits in the same cells.
  let lastFieldSig = -1;
  function entityCellSig(): number {
    let s = (entities.list.length * 0x9e3779b1) | 0;
    for (const e of entities.list) {
      s = (Math.imul(s, 16777619) ^ (Math.floor(e.pos[0]) * 73856093 ^ Math.floor(e.pos[1]) * 19349663 ^ Math.floor(e.pos[2]) * 83492791)) | 0;
    }
    return s;
  }

  function setBlock(x: number, y: number, z: number, t: number): void {
    sim.setBlock(x, y, z, t); // routes through the sim so edits wake the physics
  }

  const hudRect = Buffer.alloc(16);
  // Reused per-call scratch for label text (avoids a Buffer.from() alloc per draw,
  // ~10+ per HUD frame). 512 UTF-16 code units is ample for every HUD string.
  const labelBuf = Buffer.alloc(1024);
  const LABEL_MAX = 512;
  function drawHud(nowSec: number): void {
    hud.draw(g, cw, ch, (dc) => {
      GDI32.SetBkMode(dc, TRANSPARENT_BK);
      const rgb = (r: number, gg: number, b: number): number => (b << 16) | (gg << 8) | r;
      const fillRect = (x: number, y: number, w: number, h: number, color: number): void => {
        hudRect.writeInt32LE(x, 0);
        hudRect.writeInt32LE(y, 4);
        hudRect.writeInt32LE(x + w, 8);
        hudRect.writeInt32LE(y + h, 12);
        const br = GDI32.CreateSolidBrush(color);
        User32.FillRect(dc, hudRect.ptr!, br);
        GDI32.DeleteObject(br);
      };
      const label = (s: string, x: number, y: number, color: number): void => {
        const n = Math.min(s.length, LABEL_MAX);
        const written = labelBuf.write(n < s.length ? s.slice(0, n) : s, 0, 'utf16le') / 2;
        GDI32.SetTextColor(dc, color);
        GDI32.TextOutW(dc, x, y, labelBuf.ptr!, written);
      };
      const swatch = (b: number): number => {
        switch (b) {
          case B_STONE:
            return rgb(120, 122, 130);
          case B_DIRT:
            return rgb(120, 84, 52);
          case B_SAND:
            return rgb(220, 205, 150);
          case B_GRAVEL:
            return rgb(128, 125, 118);
          case B_WATER:
            return rgb(40, 110, 175);
          case B_LAVA:
            return rgb(235, 95, 22);
          case B_PLANK:
            return rgb(172, 132, 80);
          case B_TNT:
            return rgb(200, 40, 30);
          case -2:
            return rgb(70, 32, 32); // bomb
          default:
            return rgb(64, 64, 64); // dig
        }
      };
      const prevFont = GDI32.SelectObject(dc, hudFont);
      const useFont = (f: bigint): void => void GDI32.SelectObject(dc, f);
      const cxp = Math.floor(cw / 2);
      const cyp = Math.floor(ch / 2);

      // ── Top-left: compact status (clock lives in the day/night banner now) ──
      useFont(hudFontSm);
      const status = `${fps} fps · ${g.gpuName} · ents ${entities.list.length}`;
      label(status, 17, 11, rgb(0, 0, 0));
      label(status, 16, 10, rgb(205, 216, 234));

      // ── Top-center: day / night + wave banner (big), with a sun/moon dot ──
      useFont(hudFontBig);
      let banner: string;
      let bcol: number;
      let dot: number;
      if (waveActive) {
        banner = `NIGHT ${wave}    ${entities.hostileCount()} ENEMIES`;
        bcol = rgb(255, 150, 138);
        dot = rgb(150, 172, 255);
      } else if (wave > 0) {
        banner = `DAY ${wave + 1}    prepare`;
        bcol = rgb(255, 238, 188);
        dot = rgb(255, 206, 64);
      } else {
        banner = 'DAY 1    build your defenses';
        bcol = rgb(255, 238, 188);
        dot = rgb(255, 206, 64);
      }
      const bx = Math.floor(cw / 2 - banner.length * 8);
      fillRect(bx - 30, 12, 20, 20, rgb(0, 0, 0));
      fillRect(bx - 29, 11, 20, 20, dot);
      label(banner, bx + 1, 9, rgb(0, 0, 0));
      label(banner, bx, 8, bcol);

      // ── Top-right: score (big) ──
      const sTxt = `SCORE ${score}`;
      const sxr = cw - 24 - sTxt.length * 16;
      label(sTxt, sxr + 1, 9, rgb(0, 0, 0));
      label(sTxt, sxr, 8, rgb(255, 224, 120));

      // ── Crosshair (reddens when a hostile is within reach) ──
      const chCol = crosshairHot ? rgb(255, 76, 60) : rgb(255, 255, 255);
      fillRect(cxp - 1, cyp - 10, 3, 21, rgb(0, 0, 0));
      fillRect(cxp - 10, cyp - 1, 21, 3, rgb(0, 0, 0));
      fillRect(cxp, cyp - 9, 1, 19, chCol);
      fillRect(cxp - 9, cyp, 19, 1, chCol);

      // ── Health bar (bottom-left) ──
      const hbW = 248;
      const hbH = 20;
      const hbx = 22;
      const hby = ch - 104;
      fillRect(hbx - 2, hby - 2, hbW + 4, hbH + 4, rgb(0, 0, 0));
      fillRect(hbx, hby, hbW, hbH, rgb(34, 12, 12));
      const hfrac = Math.max(0, Math.min(1, health / HEALTH_MAX));
      const hcol = health > 55 ? rgb(74, 200, 86) : health > 28 ? rgb(236, 182, 44) : rgb(228, 52, 42);
      fillRect(hbx, hby, Math.round(hbW * hfrac), hbH, hcol);
      useFont(hudFontSm);
      label(`HP ${Math.max(0, Math.ceil(health))}`, hbx + 7, hby + 2, rgb(255, 255, 255));

      // ── Hotbar (bottom-center): swatch + number + name; the selected slot lifts ──
      const n = HOTBAR.length;
      const sw = 48;
      const sgap = 6;
      const totalW = n * sw + (n - 1) * sgap;
      const x0 = Math.floor((cw - totalW) / 2);
      const y0 = ch - sw - 26;
      for (let i = 0; i < n; i += 1) {
        const sel = i === selectedSlot;
        const sx = x0 + i * (sw + sgap);
        const sy = sel ? y0 - 7 : y0;
        fillRect(sx - 3, sy - 3, sw + 6, sw + 6, sel ? rgb(255, 238, 150) : rgb(18, 18, 24));
        fillRect(sx, sy, sw, sw, swatch(HOTBAR[i]!.block));
        useFont(hudFontSm);
        label(`${(i + 1) % 10}`, sx + 3, sy + 1, rgb(255, 255, 255));
        const nm = HOTBAR[i]!.name;
        label(nm, sx + Math.max(0, Math.floor((sw - nm.length * 7) / 2)), sy + sw + 2, sel ? rgb(255, 240, 180) : rgb(176, 184, 200));
      }

      // ── Controls hint, centered just above the hotbar (out of the banner's way) ──
      const help = 'WASD move · Space jump · LMB attack/dig · RMB place · M meteor · B carpet · F fly · T scrub time · R new world';
      const hx = Math.floor(cw / 2 - help.length * 3.5);
      label(help, hx + 1, y0 - 25, rgb(0, 0, 0));
      label(help, hx, y0 - 26, rgb(156, 164, 182));

      // ── Event toast (center, big) ──
      if (nowSec < toastUntil && toast) {
        useFont(hudFontBig);
        const tx = Math.floor(cw / 2 - toast.length * 8);
        label(toast, tx + 1, 73, rgb(0, 0, 0));
        label(toast, tx, 72, rgb(255, 228, 130));
      }

      // ── Death overlay ──
      if (dead) {
        useFont(hudFontBig);
        const dTxt = 'YOU DIED';
        const dx = Math.floor(cw / 2 - dTxt.length * 8);
        label(dTxt, dx + 2, cyp - 38, rgb(0, 0, 0));
        label(dTxt, dx, cyp - 40, rgb(235, 60, 50));
        useFont(hudFontSm);
        const rTxt = 'respawning…';
        label(rTxt, Math.floor(cw / 2 - rTxt.length * 4), cyp - 4, rgb(230, 200, 200));
      }

      GDI32.SelectObject(dc, prevFont);
    });
  }

  const FOV = 1.5;

  // ── Physics ticking (fixed 20 Hz, accumulator-driven; per-tick cell-visit cap) ─
  const PHYS_TICK = 1 / 20;
  const PHYS_BUDGET = 24000;
  let physAccum = 0;
  let editedThisFrame = false;

  // ── FX state: screen-shake, white flash, transient glow effects, day cycle ─────
  let shake = 0;
  let flash = 0;
  let slowmo = 0; // bullet-time: seconds of remaining slow motion
  let nextBoom = 0.4; // VOX_BOOM repeating-detonation timer (capture-mode verification)
  let cinematicBoomed = false; // one-shot finale detonation for the gallery shot
  let cinematicMeteor = false; // one-shot finale meteor streak for the gallery shot

  // ── Survival game state (day = build/prep · night = waves of hostile mobs) ─────
  const HEALTH_MAX = 100;
  let health = HEALTH_MAX;
  let score = 0;
  let wave = 0; // waves survived
  let waveActive = false; // a night assault is currently underway
  let hurt = 0; // red damage-vignette envelope (decays each frame)
  let dead = false; // brief death/respawn pause
  let deadTimer = 0;
  let damageCd = 0; // i-frames between mob contact hits
  let regenCd = 0; // delay before health regen kicks in after taking damage
  let prevNight = false; // edge-detect dusk/dawn for wave start/clear
  let reinforceCd = 0; // delay before a cleared-early night sends reinforcements
  const aiTarget: [number, number, number] = [0, 0, 0]; // reused per-frame (no churn)
  // Time of day (0..1). Capture mode pins it to a moody low-dusk sun (richer sky for
  // contrast, so the finale fireball + glow POP instead of washing out) unless VOX_TOD is set.
  let timeOfDay = process.env.VOX_TOD ? Number(process.env.VOX_TOD) : interactive ? 0.30 : 0.27;
  interface GlowFx {
    x: number;
    y: number;
    z: number;
    r0: number;
    cr: number;
    cg: number;
    cb: number;
    intensity: number;
    life: number;
    maxLife: number;
  }
  const glowFx: GlowFx[] = [];

  /** Approximate base albedo (normalized RGB) for a block id — used to tint break flecks. */
  function blockGlowTint(b: number): [number, number, number] {
    switch (b) {
      case B_GRASS:
        return [0.4, 0.62, 0.24];
      case B_DIRT:
        return [0.46, 0.32, 0.2];
      case B_STONE:
        return [0.44, 0.45, 0.48];
      case B_SAND:
        return [0.84, 0.76, 0.53];
      case B_WOOD:
        return [0.32, 0.21, 0.12];
      case B_LEAF:
        return [0.2, 0.48, 0.18];
      case B_SNOW:
        return [0.92, 0.95, 1.0];
      case B_GRAVEL:
        return [0.48, 0.46, 0.43];
      case B_TNT:
        return [0.74, 0.13, 0.1];
      case B_GLOWSTONE:
        return [0.98, 0.85, 0.5];
      case B_PLANK:
        return [0.68, 0.51, 0.32];
      case B_BRICK:
        return [0.6, 0.28, 0.2];
      case B_OBSIDIAN:
        return [0.1, 0.07, 0.14];
      default:
        return [0.6, 0.6, 0.6];
    }
  }

  // ── Lightweight particle system (pool-capped; feeds the additive glow layer) ───
  // Each particle is a tiny physics point that fades over its life. They are emitted
  // as low-priority glow candidates in buildGlows(), so transient explosions/fire
  // always keep their slots and the GLOW_MAX cap bounds GPU cost automatically.
  // gravity: +ve falls, -ve rises (smoke/embers); drag damps velocity each second.
  const PARTICLE_CAP = 300;
  interface Particle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    cr: number;
    cg: number;
    cb: number;
    r0: number; // glow radius
    inten: number; // peak intensity (scaled by remaining life)
    gravity: number;
    drag: number;
    life: number;
    maxLife: number;
  }
  const particles: Particle[] = [];
  /** Emit one particle, evicting the oldest when the pool is full (cheap, bounded). */
  function emitParticle(p: Particle): void {
    if (particles.length >= PARTICLE_CAP) particles.shift();
    particles.push(p);
  }
  /** Block break: a small dark burst of flecks in the broken block's color. */
  function spawnBreakFlecks(bx: number, by: number, bz: number, block: number): void {
    const [br, bg, bb] = blockGlowTint(block);
    for (let i = 0; i < 8; i += 1) {
      emitParticle({
        x: bx + 0.5 + (Math.random() - 0.5) * 0.7,
        y: by + 0.5 + (Math.random() - 0.5) * 0.7,
        z: bz + 0.5 + (Math.random() - 0.5) * 0.7,
        vx: (Math.random() - 0.5) * 4,
        vy: 1.5 + Math.random() * 3,
        vz: (Math.random() - 0.5) * 4,
        cr: br * 0.55,
        cg: bg * 0.55,
        cb: bb * 0.55, // dark flecks: dim, brief
        r0: 0.5 + Math.random() * 0.3,
        inten: 0.7,
        gravity: 22,
        drag: 1.6,
        life: 0.28 + Math.random() * 0.22,
        maxLife: 0.5,
      });
    }
  }
  /** Explosion: a rising grey smoke column + a scatter of bright warm sparks. */
  function spawnExplosionParticles(ex: number, ey: number, ez: number, power: number): void {
    const sparks = Math.min(20, Math.round(8 + power * 7));
    for (let i = 0; i < sparks; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 5 + Math.random() * 9 * power;
      emitParticle({
        x: ex + 0.5,
        y: ey + 0.5,
        z: ez + 0.5,
        vx: Math.cos(a) * sp,
        vy: 3 + Math.random() * 8,
        vz: Math.sin(a) * sp,
        cr: 2.2,
        cg: 1.1 + Math.random() * 0.4,
        cb: 0.25,
        r0: 0.55 + Math.random() * 0.35,
        inten: 1.6,
        gravity: 20,
        drag: 1.1,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
      });
    }
    const puffs = Math.min(14, Math.round(6 + power * 4));
    for (let i = 0; i < puffs; i += 1) {
      emitParticle({
        x: ex + 0.5 + (Math.random() - 0.5) * 1.6,
        y: ey + 0.5 + Math.random() * 1.0,
        z: ez + 0.5 + (Math.random() - 0.5) * 1.6,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 2.5,
        vz: (Math.random() - 0.5) * 2,
        cr: 0.5,
        cg: 0.5,
        cb: 0.55, // faint cool-grey: reads as a fading smoke puff (additive can't darken)
        r0: 1.6 + Math.random() * 1.4,
        inten: 0.7 + power * 0.2,
        gravity: -3.5, // buoyant: rises as it fades
        drag: 1.3,
        life: 0.9 + Math.random() * 0.7,
        maxLife: 1.6,
      });
    }
  }
  /** Fire: an occasional rising ember from a burning cell (warm, small, drifting). */
  function spawnEmber(fx: number, fy: number, fz: number): void {
    emitParticle({
      x: fx + 0.5 + (Math.random() - 0.5) * 0.6,
      y: fy + 0.8,
      z: fz + 0.5 + (Math.random() - 0.5) * 0.6,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 1.5 + Math.random() * 1.5,
      vz: (Math.random() - 0.5) * 1.2,
      cr: 2.0,
      cg: 0.85,
      cb: 0.2,
      r0: 0.45 + Math.random() * 0.3,
      inten: 1.1,
      gravity: -4.5, // hot air lift
      drag: 0.8,
      life: 0.6 + Math.random() * 0.6,
      maxLife: 1.2,
    });
  }
  /** Advance every particle (gravity + drag + fade) and reap the dead ones. */
  function stepParticles(pdt: number): void {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i]!;
      p.vy -= p.gravity * pdt;
      const damp = Math.max(0, 1 - p.drag * pdt);
      p.vx *= damp;
      p.vz *= damp;
      p.x += p.vx * pdt;
      p.y += p.vy * pdt;
      p.z += p.vz * pdt;
      p.life -= pdt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function triggerExplosionFx(ex: number, ey: number, ez: number, power: number): void {
    glowFx.push({ x: ex + 0.5, y: ey + 0.5, z: ez + 0.5, r0: 2.4 * power, cr: 1.8, cg: 0.8, cb: 0.36, intensity: 2.6 * power, life: 0.5, maxLife: 0.5 });
    spawnExplosionParticles(ex, ey, ez, power);
    const dist = Math.hypot(ex - camX, ey - camY, ez - camZ);
    const atten = 1 / (1 + dist * 0.06);
    shake = Math.min(2.4, shake + power * 1.3 * atten);
    flash = Math.min(0.85, flash + power * 0.3 * atten);
    audio?.boom(power * atten + 0.3);
    if (interactive && dist < 5.5) hurtPlayer((5.5 - dist) * 3.0 * power); // caught in your own blast
  }

  function processSimEvents(ev: SimEvents): void {
    for (const e of ev.explosions) {
      triggerExplosionFx(e.x, e.y, e.z, e.power);
      entities.knockback(e.x + 0.5, e.y + 0.5, e.z + 0.5, e.power);
      entities.alarm(e.x + 0.5, e.y + 0.5, e.z + 0.5, e.power);
      entities.damage(e.x + 0.5, e.y + 0.5, e.z + 0.5, 4 + e.power * 3, 4 + e.power * 4); // blasts gib mobs (scored via onCritterDeath)
      // Fling some debris cubes from the destroyed blocks (sampled + capped).
      const destroyed = e.result.destroyed;
      const stride = Math.max(1, Math.floor(destroyed.length / 28));
      for (let k = 0; k < destroyed.length; k += stride) {
        const d = destroyed[k]!;
        const dx = d.x - e.x;
        const dy = d.y - e.y;
        const dz = d.z - e.z;
        const dl = Math.hypot(dx, dy, dz) || 1;
        const sp = 6 + Math.random() * 8;
        entities.spawnDebris(d.x + 0.5, d.y + 0.5, d.z + 0.5, (dx / dl) * sp + (Math.random() - 0.5) * 3, (dy / dl) * sp + 5 + Math.random() * 4, (dz / dl) * sp + (Math.random() - 0.5) * 3, d.block);
      }
    }
    for (const s of ev.steam) glowFx.push({ x: s.x + 0.5, y: s.y + 0.9, z: s.z + 0.5, r0: 2.0, cr: 1.0, cg: 1.0, cb: 1.0, intensity: 2.2, life: 0.45, maxLife: 0.45 });
    // Bullet-time on a big blast or a chain reaction.
    let maxPower = 0;
    for (const e of ev.explosions) maxPower = Math.max(maxPower, e.power);
    if (maxPower >= 1.8 || ev.explosions.length >= 2) slowmo = Math.max(slowmo, 0.55);
  }

  /** Detonate immediately at (x,y,z): carve + spawn FX (used by tools + the cinematic). */
  function detonate(x: number, y: number, z: number, radius: number, power: number): void {
    const result = sim.explode(x, y, z, radius, power);
    processSimEvents({ explosions: [{ x, y, z, power, result }], steam: [], splashes: [], extinguished: [] });
    editedThisFrame = true;
  }

  // Projectiles detonate via this callback; spawn a few critters to roam the world.
  entities.onExplode = (x, y, z, power) => detonate(x, y, z, 4.0 + 1.6 * power, power);
  // Creature death → debris gibs + a poof of glow; slain hostiles score points.
  entities.onCritterDeath = (x, y, z, hostile) => {
    for (let k = 0; k < 5; k += 1) {
      entities.spawnDebris(x, y + 0.5, z, (Math.random() - 0.5) * 5, 3 + Math.random() * 3, (Math.random() - 0.5) * 5, hostile ? B_MOB : B_CRITTER);
    }
    glowFx.push({ x, y: y + 0.6, z, r0: 1.8, cr: hostile ? 2.4 : 1.1, cg: hostile ? 0.4 : 1.0, cb: hostile ? 0.3 : 0.9, intensity: 1.6, life: 0.4, maxLife: 0.4 });
    if (hostile) score += 25;
  };
  function spawnCritters(n: number): void {
    for (let i = 0; i < n; i += 1) {
      const cx = 4 + Math.floor(Math.random() * (W - 8));
      const cz = 4 + Math.floor(Math.random() * (D - 8));
      let cy = SEA_LEVEL + 1;
      for (let y = H - 1; y >= 1; y -= 1) {
        if (isSolid(voxelAt(cx, y, cz))) {
          cy = y + 1;
          break;
        }
      }
      entities.spawnCritter(cx + 0.5, cy + 0.1, cz + 0.5);
    }
  }
  /** Spawn n hostile mobs on the ground in a ring around the player (a night wave). */
  function spawnMobWave(n: number): void {
    for (let i = 0; i < n; i += 1) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 46;
      const mx = Math.max(2, Math.min(W - 3, Math.floor(player[0] + Math.cos(ang) * dist)));
      const mz = Math.max(2, Math.min(D - 3, Math.floor(player[2] + Math.sin(ang) * dist)));
      let my = SEA_LEVEL + 2;
      for (let y = H - 1; y >= 1; y -= 1) {
        if (isSolid(voxelAt(mx, y, mz))) {
          my = y + 1;
          break;
        }
      }
      entities.spawnMob(mx + 0.5, my + 0.1, mz + 0.5, Math.random() < 0.3 ? 1 : 0);
    }
  }
  /** Drop the player onto dry ground near the basin center (after a regenerate). */
  function respawnPlayer(): void {
    let bx = Math.floor(W * 0.5);
    let bz = Math.floor(D * 0.28);
    let feet = SEA_LEVEL + 2;
    // Spiral out from the spawn bias for a column whose top sits above sea level (dry land).
    for (let r = 0; r < 48; r += 2.5) {
      const cx = Math.max(2, Math.min(W - 3, Math.floor(W * 0.5 + Math.cos(r) * r)));
      const cz = Math.max(2, Math.min(D - 3, Math.floor(D * 0.28 + Math.sin(r) * r)));
      let top = 0;
      for (let y = H - 1; y >= 1; y -= 1) {
        if (isSolid(voxelAt(cx, y, cz))) {
          top = y;
          break;
        }
      }
      if (top > SEA_LEVEL) {
        bx = cx;
        bz = cz;
        feet = top + 1;
        break;
      }
    }
    player[0] = bx + 0.5;
    player[1] = feet + 0.05;
    player[2] = bz + 0.5;
    pvel[0] = 0;
    pvel[1] = 0;
    pvel[2] = 0;
    onGround = false;
  }
  /** R: brand-new RANDOM world — reset blocks, fluids, physics, entities; respawn the player. */
  function regenerate(): void {
    worldSeed = (Math.random() * 0x7fffffff) | 0;
    sim.world.set(generateWorld(worldSeed));
    sim.active.clear();
    sim.fuses.clear();
    sim.burning.clear();
    sim.water.fill(0);
    for (let i = 0; i < sim.world.length; i += 1) if (sim.world[i] === B_WATER) sim.water[i] = WATER_MAX;
    entities.list.length = 0;
    spawnCritters(30);
    respawnPlayer();
    health = HEALTH_MAX;
    score = 0;
    wave = 0;
    waveActive = false;
    prevNight = false;
    dead = false;
    deadTimer = 0;
    hurt = 0;
    damageCd = 0;
    regenCd = 0;
    reinforceCd = 0;
    timeOfDay = 0.3; // a fresh world always starts in the morning (a full prep day)
    computeSun(timeOfDay);
    editedThisFrame = true;
  }

  // ── Survival loop: day = build/prep · night = a wave of mobs hunts you ─────────
  function hurtPlayer(amount: number): void {
    if (dead || flying) return;
    health -= amount;
    hurt = 1;
    regenCd = 3.5;
    audio?.hurt();
    shake = Math.min(2.4, shake + 0.45);
  }
  /** Night ends (dawn OR death): spawned mobs retreat (despawn); feral wildlife revert. */
  function retreatHostiles(): void {
    for (let i = entities.list.length - 1; i >= 0; i -= 1) {
      const e = entities.list[i]!;
      if (e.kind !== ENT_CRITTER || !e.hostile) continue;
      if (e.variant === 2) {
        e.hostile = false;
        e.block = B_CRITTER;
        e.variant = 0;
      } else {
        glowFx.push({ x: e.pos[0], y: e.pos[1] + 0.6, z: e.pos[2], r0: 1.4, cr: 1.0, cg: 0.5, cb: 0.4, intensity: 1.0, life: 0.3, maxLife: 0.3 });
        entities.list.splice(i, 1);
      }
    }
  }
  function onNightfall(now: number): void {
    wave += 1;
    waveActive = true;
    reinforceCd = 7;
    spawnMobWave(5 + 2 * wave);
    // A quarter of the wildlife goes feral until dawn (variant 2 = revert, not despawn).
    let wild = 0;
    for (const e of entities.list) if (e.kind === ENT_CRITTER && !e.hostile) wild += 1;
    const cap = Math.ceil(wild * 0.25);
    let feral = 0;
    for (const e of entities.list) {
      if (feral >= cap) break;
      if (e.kind === ENT_CRITTER && !e.hostile && Math.random() < 0.4) {
        e.hostile = true;
        e.block = B_MOB;
        e.variant = 2;
        feral += 1;
      }
    }
    setToast(`NIGHT ${wave} — ${entities.hostileCount()} incoming, defend!`, now);
    audio?.boom(0.6);
  }
  function onDawn(now: number): void {
    if (waveActive) {
      const bonus = 100 * wave;
      score += bonus;
      setToast(`Dawn — survived wave ${wave}!  +${bonus}`, now);
    }
    waveActive = false;
    retreatHostiles(); // spawned mobs retreat at first light; feral wildlife revert
  }
  function onDeath(now: number): void {
    dead = true;
    deadTimer = 2.4;
    waveActive = false;
    flash = Math.max(flash, 0.5);
    setToast('You fell — respawning…', now);
    retreatHostiles(); // the assault breaks off (incl. reverting the feral wildlife)
    timeOfDay = 0.3; // skip to morning so the player gets a prep day
    computeSun(timeOfDay);
    prevNight = false;
  }
  // `rdt` is REAL-time dt (not the bullet-time-scaled sdt): waves, health, i-frames and the
  // hurt vignette tick in real time so a slow-mo explosion never warps the survival clock.
  function updateSurvival(rdt: number, now: number): void {
    const night = sun[1] < -0.04;
    if (night && !prevNight && !dead) onNightfall(now);
    else if (!night && prevNight && !dead) onDawn(now);
    prevNight = night;

    // Reinforcements if the player clears a night early.
    if (waveActive && night && !dead) {
      reinforceCd -= rdt;
      if (entities.hostileCount() === 0 && reinforceCd <= 0) {
        spawnMobWave(Math.min(14, 4 + wave));
        reinforceCd = 7;
        setToast('reinforcements close in!', now);
      }
    }

    // Mob contact damage (i-framed so a swarm doesn't shred you instantly).
    damageCd -= rdt;
    if (!dead && !flying && damageCd <= 0) {
      for (const e of entities.list) {
        if (e.kind !== ENT_CRITTER || !e.hostile) continue;
        const dx = e.pos[0] - player[0];
        const dz = e.pos[2] - player[2];
        const dy = e.pos[1] - player[1];
        if (dx * dx + dz * dz < 1.7 && dy > -1.4 && dy < 2.2) {
          hurtPlayer(e.variant === 1 ? 8 : 12);
          const d = Math.hypot(dx, dz) || 1;
          pvel[0] -= (dx / d) * 4.5;
          pvel[2] -= (dz / d) * 4.5;
          damageCd = 0.7;
          break;
        }
      }
    }

    // Lava burns; fire too.
    if (!dead && !flying && voxelAt(Math.floor(player[0]), Math.floor(player[1] + 0.1), Math.floor(player[2])) === B_LAVA) {
      hurtPlayer(26 * rdt);
      regenCd = 2;
    }

    // Health regen after a lull; the hurt vignette decays.
    regenCd -= rdt;
    if (!dead && regenCd <= 0 && health < HEALTH_MAX) health = Math.min(HEALTH_MAX, health + 7 * rdt);
    hurt = Math.max(0, hurt - rdt * 2.2);

    // Death + respawn.
    if (health <= 0 && !dead) onDeath(now);
    if (dead) {
      deadTimer -= rdt;
      if (deadTimer <= 0) {
        dead = false;
        respawnPlayer();
        health = HEALTH_MAX;
        hurt = 0;
      }
    }
  }
  spawnCritters(30);
  // Debug/verification: VOX_MOBS=N spawns a hostile wave at start (test seek + eye-glow).
  if (process.env.VOX_MOBS) spawnMobWave(Number(process.env.VOX_MOBS) | 0);

  // Assemble up to GLOW_MAX glow points into the cbuffer (offset 128), nearest-first
  // with transient FX prioritized. Returns the count written.
  const GLOW_BASE = 128;
  interface GlowCand {
    x: number;
    y: number;
    z: number;
    r: number;
    cr: number;
    cg: number;
    cb: number;
    inten: number;
    pri: number;
    d2: number;
  }
  const glowCands: GlowCand[] = [];
  function buildGlows(nowSec: number): number {
    glowCands.length = 0;
    for (const g of glowFx) {
      const k = Math.max(0, g.life / g.maxLife);
      glowCands.push({ x: g.x, y: g.y, z: g.z, r: g.r0 * (1.35 - 0.35 * k), cr: g.cr, cg: g.cg, cb: g.cb, inten: g.intensity * k, pri: 3, d2: 0 });
    }
    for (const fi of sim.fuses.keys()) {
      const y = (fi / (W * D)) | 0;
      const rem = fi - y * W * D;
      const z = (rem / W) | 0;
      const x = rem - z * W;
      const blink = 0.5 + 0.5 * Math.sin(nowSec * 30);
      glowCands.push({ x: x + 0.5, y: y + 0.5, z: z + 0.5, r: 2.0, cr: 2.2, cg: 0.5, cb: 0.12, inten: 1.4 + 2.4 * blink, pri: 2, d2: 0 });
    }
    let bn = 0;
    for (const bi of sim.burning.keys()) {
      if (bn >= 48) break;
      bn += 1;
      const y = (bi / (W * D)) | 0;
      const rem = bi - y * W * D;
      const z = (rem / W) | 0;
      const x = rem - z * W;
      const fl = 0.7 + 0.3 * Math.sin(nowSec * 20 + x * 1.3 + z * 0.7);
      glowCands.push({ x: x + 0.5, y: y + 1.0, z: z + 0.5, r: 1.9, cr: 1.7, cg: 0.62, cb: 0.18, inten: 1.5 * fl, pri: 1, d2: 0 });
    }
    // Flying projectiles: bombs glow with their fuse, meteors blaze with a fiery trail.
    for (const e of entities.list) {
      if (e.kind === ENT_BOMB) {
        const blink = 0.5 + 0.5 * Math.sin(nowSec * 28);
        glowCands.push({ x: e.pos[0], y: e.pos[1], z: e.pos[2], r: 1.8, cr: 2.2, cg: 0.5, cb: 0.12, inten: 1.2 + 1.8 * blink, pri: 2, d2: 0 });
      } else if (e.kind === ENT_METEOR) {
        glowCands.push({ x: e.pos[0], y: e.pos[1], z: e.pos[2], r: 3.0, cr: 2.4, cg: 0.8, cb: 0.18, inten: 4.0, pri: 3, d2: 0 });
      } else if (e.kind === ENT_CRITTER && e.hostile) {
        // Menacing red eye-glow at head height (flickers); pri 1 so it survives the cap.
        const fl = 0.8 + 0.2 * Math.sin(nowSec * 9 + e.pos[0] * 1.7);
        glowCands.push({ x: e.pos[0], y: e.pos[1] + e.size[1] * 0.85, z: e.pos[2], r: 1.0, cr: 2.6, cg: 0.32, cb: 0.12, inten: 1.1 * fl, pri: 1, d2: 0 });
      }
    }
    // Particles (break flecks, explosion sparks/smoke, fire embers): low priority so
    // transient explosions/fire keep their slots; the GLOW_MAX cap bounds GPU cost.
    for (const pt of particles) {
      const k = Math.max(0, pt.life / pt.maxLife);
      glowCands.push({ x: pt.x, y: pt.y, z: pt.z, r: pt.r0, cr: pt.cr, cg: pt.cg, cb: pt.cb, inten: pt.inten * k, pri: 0, d2: 0 });
    }
    // Nearby emissive blocks (lava/glowstone) via a small local scan.
    const R = 12;
    const ccx = Math.floor(camX);
    const ccy = Math.floor(camY);
    const ccz = Math.floor(camZ);
    for (let yy = Math.max(0, ccy - R); yy <= Math.min(H - 1, ccy + R); yy += 1) {
      for (let zz = Math.max(0, ccz - R); zz <= Math.min(D - 1, ccz + R); zz += 1) {
        for (let xx = Math.max(0, ccx - R); xx <= Math.min(W - 1, ccx + R); xx += 1) {
          const b = voxels[idx(xx, yy, zz)]!;
          if (EMISSIVE[b]! <= 0) continue;
          if (b === B_LAVA) {
            if (voxelAt(xx, yy + 1, zz) !== B_AIR) continue; // only surface lava glows out
            glowCands.push({ x: xx + 0.5, y: yy + 0.95, z: zz + 0.5, r: 2.4, cr: 1.9, cg: 0.7, cb: 0.18, inten: 1.7, pri: 0, d2: 0 });
          } else {
            glowCands.push({ x: xx + 0.5, y: yy + 0.5, z: zz + 0.5, r: 2.6, cr: 1.0, cg: 0.82, cb: 0.42, inten: 1.5, pri: 0, d2: 0 });
          }
        }
      }
    }
    for (const g of glowCands) g.d2 = (g.x - camX) ** 2 + (g.y - camY) ** 2 + (g.z - camZ) ** 2;
    glowCands.sort((a, b) => b.pri - a.pri || a.d2 - b.d2);
    const count = Math.min(GLOW_MAX, glowCands.length);
    for (let i = 0; i < count; i += 1) {
      const g = glowCands[i]!;
      const o = GLOW_BASE + i * 32;
      cbData.writeFloatLE(g.x, o);
      cbData.writeFloatLE(g.y, o + 4);
      cbData.writeFloatLE(g.z, o + 8);
      cbData.writeFloatLE(g.r, o + 12);
      cbData.writeFloatLE(g.cr, o + 16);
      cbData.writeFloatLE(g.cg, o + 20);
      cbData.writeFloatLE(g.cb, o + 24);
      cbData.writeFloatLE(g.inten, o + 28);
    }
    return count;
  }

  while (!win.shouldClose()) {
    win.pump();
    if (win.shouldClose()) break;

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    const elapsed = (now - startTime) / 1000;
    editedThisFrame = false;
    shake *= Math.exp(-dt * 6);
    flash *= Math.exp(-dt * 5);
    for (let i = glowFx.length - 1; i >= 0; i -= 1) {
      glowFx[i]!.life -= dt;
      if (glowFx[i]!.life <= 0) glowFx.splice(i, 1);
    }

    // ── Day/night progression (interactive animates; capture pins golden hour) ──
    if (interactive || process.env.VOX_SURVIVAL) {
      timeOfDay += dt / 75; // a full day/night cycle every ~75s (brisk survival pacing)
      if (win.keyDown(VK_T)) timeOfDay += dt * 0.12; // hold T to scrub fast
      if (timeOfDay >= 1) timeOfDay -= 1;
    }
    computeSun(timeOfDay);

    if (interactive) {
      // ── Relative mouse-look via GetCursorPos diff against the recenter point ──
      if (User32.GetCursorPos(ptBuf.ptr!)) {
        const mx = ptBuf.readInt32LE(0);
        const my = ptBuf.readInt32LE(4);
        yaw += (mx - centerScr.x) * 0.0022;
        pitch -= (my - centerScr.y) * 0.0022;
        pitch = Math.max(-1.45, Math.min(1.45, pitch));
        User32.SetCursorPos(centerScr.x, centerScr.y);
      }

      // ── Fly/walk toggle (F) ────────────────────────────────────────────────
      const fDown = win.keyDown(VK_F);
      if (fDown && !prevF) flying = !flying;
      prevF = fDown;

      const { fwd, right } = basis();
      let mvF = 0;
      let mvR = 0;
      if (!dead) {
        // Frozen during the death pause; mouse-look still works so you can watch the respawn.
        if (win.keyDown(VK_W)) mvF += 1;
        if (win.keyDown(VK_S)) mvF -= 1;
        if (win.keyDown(VK_DK)) mvR += 1;
        if (win.keyDown(VK_A)) mvR -= 1;
      }

      if (flying) {
        // Free-fly: move the eye directly along the look basis (no gravity/collision).
        const speed = (win.keyDown(VK_SHIFT) ? 30 : 15) * dt;
        let mvU = 0;
        if (win.keyDown(VK_SPACE)) mvU += 1;
        if (win.keyDown(VK_SHIFT)) mvU -= 1;
        player[0] += (fwd[0] * mvF + right[0] * mvR) * speed;
        player[1] += (fwd[1] * mvF + mvU) * speed;
        player[2] += (fwd[2] * mvF + right[2] * mvR) * speed;
        pvel[0] = 0;
        pvel[1] = 0;
        pvel[2] = 0;
      } else {
        // Walk: horizontal velocity on the yaw plane + gravity + jump + swim + step-up.
        const fwdH: [number, number] = [Math.sin(yaw), Math.cos(yaw)];
        const spd = win.keyDown(VK_SHIFT) ? SPRINT_SPEED : WALK_SPEED;
        const inWater = voxelAt(Math.floor(player[0]), Math.floor(player[1] + 0.9), Math.floor(player[2])) === B_WATER;
        const inLava = voxelAt(Math.floor(player[0]), Math.floor(player[1] + 0.2), Math.floor(player[2])) === B_LAVA;
        const drag = inWater ? 0.62 : 1.0;
        pvel[0] = (fwdH[0] * mvF + right[0] * mvR) * spd * drag;
        pvel[2] = (fwdH[1] * mvF + right[2] * mvR) * spd * drag;
        pvel[1] -= (inWater ? GRAVITY * 0.28 : GRAVITY) * dt;
        if (inWater) {
          pvel[1] += GRAVITY * 0.2 * dt; // buoyancy
          pvel[1] = Math.max(pvel[1], -4.5); // slow sink
          if (!dead && win.keyDown(VK_SPACE)) pvel[1] = 4.2; // swim up
        } else if (!dead && onGround && win.keyDown(VK_SPACE)) {
          pvel[1] = JUMP_V; // jump (auto-repeats while held on ground)
          audio?.jump();
        }
        if (inLava) pvel[1] = 9.0; // slapstick pop out of lava
        pvel[1] = Math.max(pvel[1], -55); // terminal velocity
        const fallSpeed = -pvel[1];
        const res = sweptMove(player[0], player[1], player[2], pvel[0], pvel[1], pvel[2], PSX, PSY, PSZ, dt, solidAt, STEP_UP);
        player[0] = res.x;
        player[1] = res.y;
        player[2] = res.z;
        pvel[0] = res.vx;
        pvel[1] = res.vy;
        pvel[2] = res.vz;
        onGround = res.onGround;
        // Footsteps, landing thud, and water splashes.
        footTimer -= dt;
        if (onGround && (mvF !== 0 || mvR !== 0) && footTimer <= 0) {
          audio?.foot();
          footTimer = win.keyDown(VK_SHIFT) ? 0.28 : 0.37;
        }
        if (onGround && !prevOnGround && fallSpeed > 6) audio?.land(fallSpeed);
        if (inWater && !prevInWater) {
          audio?.splash();
          for (let s = 0; s < 8; s += 1) glowFx.push({ x: player[0] + (Math.random() - 0.5), y: player[1] + 1, z: player[2] + (Math.random() - 0.5), r0: 0.7, cr: 0.8, cg: 0.95, cb: 1.0, intensity: 0.9, life: 0.3, maxLife: 0.3 });
        }
        prevOnGround = onGround;
        prevInWater = inWater;
      }
      // Eye follows the body.
      camX = player[0];
      camY = player[1] + EYE_H;
      camZ = player[2];

      // ── Tools (frozen during the death pause): hotbar + LMB/RMB + set-pieces ───
      if (!dead) {
      const { fwd: cf } = basis();
      for (let k = 0; k < 9; k += 1) if (win.keyDown(0x31 + k)) selectedSlot = k; // '1'..'9' → 0..8
      if (win.keyDown(0x30)) selectedSlot = 9; // '0' → bomb
      const slot = HOTBAR[selectedSlot]!;
      const leftDown = (User32.GetAsyncKeyState(VK_LBUTTON) & 0x8000) !== 0;
      const rightDown = (User32.GetAsyncKeyState(VK_RBUTTON) & 0x8000) !== 0;
      const pick = pickVoxel(voxels, [camX, camY, camZ], cf, 90);
      actCooldown -= dt;
      // Aim point for set-pieces (B/M): the targeted block, else a point ~24 blocks
      // ahead projected down to the terrain — so they work even aiming at sky/water.
      const aim = (): [number, number, number] => {
        if (pick.hit) return [pick.cell[0], pick.cell[1], pick.cell[2]];
        let ax = Math.floor(camX + cf[0] * 24);
        const az = Math.floor(camZ + cf[2] * 24);
        ax = Math.max(1, Math.min(W - 2, ax));
        const cz = Math.max(1, Math.min(D - 2, az));
        let ay = Math.min(H - 2, Math.floor(camY + cf[1] * 24));
        for (let y = H - 1; y >= 1; y -= 1) {
          if (isSolid(voxelAt(ax, y, cz))) {
            ay = y;
            break;
          }
        }
        return [ax, ay, cz];
      };

      // Melee: a hostile in front + within reach → LMB swats it (so you're never
      // defenseless), taking priority over digging/lobbing so close combat always works.
      let meleeTarget: Entity | null = null;
      {
        let best = 3.0 * 3.0;
        for (const e of entities.list) {
          if (e.kind !== ENT_CRITTER || !e.hostile) continue;
          const dx = e.pos[0] - camX;
          const dy = e.pos[1] + 0.8 - camY;
          const dz = e.pos[2] - camZ;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > best) continue;
          const d = Math.sqrt(d2) || 1;
          if ((dx * cf[0] + dy * cf[1] + dz * cf[2]) / d < 0.5) continue; // must be roughly ahead
          best = d2;
          meleeTarget = e;
        }
      }
      crosshairHot = meleeTarget !== null;
      meleeCd -= dt;

      // LMB: swat a mob → else lob a bomb (Bomb slot) → else dig (held, throttled).
      if (leftDown && meleeTarget && meleeCd <= 0) {
        entities.damage(meleeTarget.pos[0], meleeTarget.pos[1], meleeTarget.pos[2], 1.3, 3.4);
        entities.knockback(meleeTarget.pos[0], meleeTarget.pos[1], meleeTarget.pos[2], 0.5);
        meleeCd = 0.32;
        audio?.breakBlock();
      } else if (slot.block === -2) {
        if (leftDown && !prevLeft) {
          entities.spawnBomb(camX + cf[0] * 1.2, camY + cf[1] * 1.2, camZ + cf[2] * 1.2, cf[0] * 24, cf[1] * 24 + 4, cf[2] * 24, 2.6);
        }
      } else if (leftDown && actCooldown <= 0 && pick.hit) {
        const broken = voxelAt(pick.cell[0], pick.cell[1], pick.cell[2]);
        setBlock(pick.cell[0], pick.cell[1], pick.cell[2], B_AIR);
        spawnBreakFlecks(pick.cell[0], pick.cell[1], pick.cell[2], broken);
        editedThisFrame = true;
        actCooldown = 0.07;
        audio?.breakBlock();
      }

      // RMB: place the selected material at the adjacent face (or light targeted TNT).
      if (rightDown && actCooldown <= 0 && pick.hit && slot.block >= 0) {
        if (slot.block === B_TNT && voxelAt(pick.cell[0], pick.cell[1], pick.cell[2]) === B_TNT) {
          sim.light(pick.cell[0], pick.cell[1], pick.cell[2]);
        } else {
          setBlock(pick.prev[0], pick.prev[1], pick.prev[2], slot.block);
        }
        editedThisFrame = true;
        actCooldown = 0.11;
        audio?.place();
      }
      prevLeft = leftDown;
      prevRight = rightDown;

      // E: ignite — light a targeted TNT, or set a flammable block alight.
      const eDown = win.keyDown(VK_E);
      if (eDown && !prevE && pick.hit) {
        const tb = voxelAt(pick.cell[0], pick.cell[1], pick.cell[2]);
        if (tb === B_TNT) sim.light(pick.cell[0], pick.cell[1], pick.cell[2]);
        else sim.ignite(pick.cell[0], pick.cell[1], pick.cell[2]);
        editedThisFrame = true;
      }
      prevE = eDown;

      // B: carpet bomb — rain TNT bombs over the aim point.
      const bDown = win.keyDown(VK_B);
      if (bDown && !prevB) {
        const [ax, ay, az] = aim();
        for (let dx = -2; dx <= 2; dx += 1) {
          for (let dz = -2; dz <= 2; dz += 1) {
            entities.spawnBomb(
              Math.max(1, Math.min(W - 2, ax + dx * 2)) + 0.5,
              Math.min(H - 1, ay + 24),
              Math.max(1, Math.min(D - 2, az + dz * 2)) + 0.5,
              (Math.random() - 0.5) * 2,
              0,
              (Math.random() - 0.5) * 2,
              0.9 + Math.random() * 0.6,
            );
          }
        }
        setToast('carpet bomb away!', elapsed);
      }
      prevB = bDown;

      // M: meteor — a flaming projectile streaks down from high overhead onto the aim.
      const mDown = win.keyDown(VK_M);
      if (mDown && !prevM) {
        const [ax, ay, az] = aim();
        const sx = Math.max(1, Math.min(W - 2, ax + 6));
        const sz = Math.max(1, Math.min(D - 2, az + 6));
        entities.spawnMeteor(sx, H - 2, sz, ax, ay, az);
        setToast('incoming meteor!', elapsed);
      }
      prevM = mDown;

      // C: spawn a critter; R: regenerate the world.
      const cDown = win.keyDown(VK_C);
      if (cDown && !prevC && pick.hit) {
        entities.spawnCritter(pick.cell[0] + 0.5, pick.cell[1] + 1.1, pick.cell[2] + 0.5);
        audio?.squeak();
      }
      prevC = cDown;
      const rDown = win.keyDown(VK_R);
      if (rDown && !prevR) {
        regenerate();
        setToast('new world', elapsed);
      }
      prevR = rDown;
      } // end !dead tool actions
    } else if (camOverride) {
      // ── Debug/verification static camera: VOX_CAM="x,y,z,yaw,pitch" ───────────
      camX = camOverride[0]!;
      camY = camOverride[1]!;
      camZ = camOverride[2]!;
      yaw = camOverride[3]!;
      pitch = camOverride[4]!;
    } else {
      // ── Scripted cinematic fly-through (capture mode) ─────────────────────────
      // The shot is timed so the FINAL frame frames the low sun over the river: we
      // glide low across the meadow, descending and turning to face into the light.
      const tt = elapsed;
      const total = Math.max(0.001, durationMs / 1000);
      const u = Math.min(1, tt / total); // 0..1 over the whole take
      const ease = u * u * (3 - 2 * u);
      const cx = W * 0.5;
      const cz = D * 0.5;
      // Sun azimuth: aim the hero frame near that bearing so the low sun rakes the
      // scene, but hold it OFF-center so its glare never merges with the fireball.
      const sunYaw = Math.atan2(sun[0], sun[2]);
      const heroYaw = sunYaw + 0.20; // sun rakes from just frame-right; fireball stays central
      // Position the camera up-sun of the river basin, looking back toward the light
      // so the river leads the eye to the sun on the horizon. Keep it fairly close
      // and low so foreground blocks read crisply and the sky/sun fill the top.
      const back = 88 - ease * 16;       // pulled well back to survey the enormous basin
      camX = cx - Math.sin(sunYaw) * back + Math.sin(tt * 0.18) * 4;
      camZ = cz - Math.cos(sunYaw) * back + Math.sin(tt * 0.13) * 4;
      // Soar high over the new (taller) terrain, descending to an elevated vista.
      camY = SEA_LEVEL + 52 - ease * 9 + Math.sin(tt * 0.4) * 1.3;
      // Settle the heading just off-sun, with a slow drift earlier to feel alive.
      yaw = heroYaw + (1 - ease) * -0.28;
      // Tilt down to survey terrain, levelling toward the horizon so sky + sun show.
      pitch = lerp01(-0.42, -0.15, ease) + Math.sin(tt * 0.45) * 0.01;
      // Gentle gaze dip into the finale so the fireball sits in the lower-center.
      if (tt > total - 0.8) pitch -= (tt - (total - 0.8)) * 0.07;

      // Finale: a flaming METEOR screams down and a distant TNT eruption blooms ~48
      // blocks downrange, framed against the low sun — a fireball in the landscape, not
      // smoke in the lens. Both sit in the lower-centre of the survey vista.
      const f = basis().fwd;
      const aheadX = Math.max(6, Math.min(W - 6, Math.floor(camX + f[0] * 48)));
      const aheadZ = Math.max(6, Math.min(D - 6, Math.floor(camZ + f[2] * 48)));
      let aheadY = SEA_LEVEL + 1;
      for (let y = H - 1; y >= 1; y -= 1) {
        if (isSolid(voxelAt(aheadX, y, aheadZ))) {
          aheadY = y;
          break;
        }
      }
      if (!cinematicMeteor && tt > total - 1.7) {
        const sx = Math.max(2, Math.min(W - 3, aheadX + 9));
        const sz = Math.max(2, Math.min(D - 3, aheadZ + 9));
        entities.spawnMeteor(sx, H - 2, sz, aheadX, aheadY, aheadZ); // streaks + impacts in-frame
        cinematicMeteor = true;
      }
      if (!cinematicBoomed && !process.env.VOX_BOOM && tt > total - 0.42) {
        const tx = Math.max(5, Math.min(W - 6, aheadX - 6));
        const tz = aheadZ;
        let ty = SEA_LEVEL + 1;
        for (let y = H - 1; y >= 1; y -= 1) {
          if (isSolid(voxelAt(tx, y, tz))) {
            ty = y;
            break;
          }
        }
        for (let dx = -1; dx <= 1; dx += 1) for (let dz = -1; dz <= 1; dz += 1) {
          setBlock(tx + dx, ty + 1, tz + dz, B_TNT);
          setBlock(tx + dx, ty + 2, tz + dz, B_TNT);
        }
        detonate(tx, ty + 3, tz, 8.0, 2.2);
        // A warm rising fireball column of glow points so the finale reads as a fiery
        // eruption (hot orange core fading up into amber smoke).
        for (let k = 0; k < 6; k += 1) {
          const f01 = k / 5;
          glowFx.push({
            x: tx + 0.5 + (Math.random() - 0.5) * 1.6,
            y: ty + 3 + k * 1.9,
            z: tz + 0.5 + (Math.random() - 0.5) * 1.6,
            r0: 3.2 - f01 * 1.0,
            cr: lerp01(2.3, 1.5, f01),
            cg: lerp01(1.02, 0.6, f01),
            cb: lerp01(0.34, 0.22, f01),
            intensity: lerp01(3.0, 1.4, f01),
            life: 0.7 - f01 * 0.15,
            maxLife: 0.7,
          });
        }
        cinematicBoomed = true;
      }
    }

    // Debug/verification: repeating detonations on terrain in capture mode (VOX_BOOM=1).
    if (!interactive && process.env.VOX_BOOM && elapsed > nextBoom) {
      const bx = Math.floor(W * 0.5);
      const bz = Math.floor(D * 0.38);
      let by = SEA_LEVEL + 2;
      for (let y = H - 1; y >= 1; y -= 1) {
        if (isSolid(voxelAt(bx, y, bz))) {
          by = y;
          break;
        }
      }
      detonate(bx, by, bz, 6, 1.8);
      nextBoom = elapsed + 0.9;
    }
    // Debug/verification: launch a meteor at the basin center in capture mode (VOX_METEOR=1).
    if (!interactive && process.env.VOX_METEOR && elapsed > nextBoom) {
      const mx = Math.floor(W * 0.5);
      const mz = Math.floor(D * 0.5);
      let my = SEA_LEVEL + 2;
      for (let y = H - 1; y >= 1; y -= 1) {
        if (isSolid(voxelAt(mx, y, mz))) {
          my = y;
          break;
        }
      }
      entities.spawnMeteor(Math.min(W - 2, mx + 6), H - 2, Math.min(D - 2, mz + 6), mx, my, mz);
      nextBoom = elapsed + 1.5;
    }

    // ── Bullet-time + step physics & entities (fixed-step sim, smooth entities) ──
    if (slowmo > 0) slowmo -= dt; // decays in real time
    const timeScale = slowmo > 0 ? 0.3 : 1.0;
    const sdt = dt * timeScale;
    const wasActive = sim.active.size > 0 || sim.fuses.size > 0 || sim.burning.size > 0;
    physAccum += sdt;
    let ticksRun = 0;
    while (physAccum >= PHYS_TICK && ticksRun < 6) {
      processSimEvents(sim.stepTick(PHYS_BUDGET));
      physAccum -= PHYS_TICK;
      ticksRun += 1;
    }
    // Hostiles hunt this point; wildlife flee it (the player — the camera in capture).
    aiTarget[0] = camX;
    aiTarget[1] = camY;
    aiTarget[2] = camZ;
    entities.target = aiTarget;
    entities.step(sdt);
    if (interactive || process.env.VOX_SURVIVAL) updateSurvival(dt, elapsed); // day/night waves, health, combat, respawn
    stepParticles(sdt);
    // Fire embers: sample a few burning cells per frame for occasional rising embers.
    if (sim.burning.size > 0 && particles.length < PARTICLE_CAP - 8) {
      let sampled = 0;
      for (const bi of sim.burning.keys()) {
        if (sampled >= 6) break;
        sampled += 1;
        if (Math.random() < 0.18) {
          const by = (bi / (W * D)) | 0;
          const rem = bi - by * W * D;
          const bz = (rem / W) | 0;
          const bx = rem - bz * W;
          spawnEmber(bx, by, bz);
        }
      }
    }
    // Meteor ember trail: fiery sparks + smoke stream off each falling meteor so it
    // reads as a blazing airstrike, not a lone voxel. Spawned in render time (dt).
    for (const e of entities.list) {
      if (e.kind !== ENT_METEOR || particles.length >= PARTICLE_CAP - 4) continue;
      for (let k = 0; k < 3; k += 1) {
        const ember = k < 2;
        emitParticle({
          x: e.pos[0] + (Math.random() - 0.5) * 0.8,
          y: e.pos[1] + (Math.random() - 0.5) * 0.8,
          z: e.pos[2] + (Math.random() - 0.5) * 0.8,
          vx: -e.vel[0] * 0.12 + (Math.random() - 0.5) * 2.5,
          vy: -e.vel[1] * 0.06 + (Math.random() - 0.5) * 2.5,
          vz: -e.vel[2] * 0.12 + (Math.random() - 0.5) * 2.5,
          cr: ember ? 2.6 : 0.5,
          cg: ember ? 0.95 + Math.random() * 0.3 : 0.45,
          cb: ember ? 0.2 : 0.5,
          r0: ember ? 0.7 + Math.random() * 0.5 : 1.5,
          inten: ember ? 1.8 : 0.6,
          gravity: ember ? -2 : -4,
          drag: 1.3,
          life: 0.4 + Math.random() * 0.5,
          maxLife: 0.9,
        });
      }
    }
    audio?.pump(sim.fuses.size > 0, sim.burning.size > 0);
    // Re-upload only when the render grid actually changed: the sim ticked or an edit
    // happened (world cells), or an entity crossed into a new cell. Sub-cell drift leaves
    // the per-cell grid identical, so most frames skip the full 37.7 MB upload entirely.
    const fieldSig = entityCellSig();
    if (wasActive || editedThisFrame || fieldSig !== lastFieldSig) {
      reuploadField();
      lastFieldSig = fieldSig;
    }

    // ── Build the constant buffer immediately before the consuming call ─────────
    const { fwd, right, up } = basis();
    const eyeInWater = voxelAt(Math.floor(camX), Math.floor(camY), Math.floor(camZ)) === B_WATER;
    // Screen-shake jitters the eye position.
    const ox = shake > 0.001 ? (Math.random() * 2 - 1) * shake * 0.35 : 0;
    const oy = shake > 0.001 ? (Math.random() * 2 - 1) * shake * 0.35 : 0;
    const oz = shake > 0.001 ? (Math.random() * 2 - 1) * shake * 0.35 : 0;
    cbData.writeFloatLE(cw, 0);
    cbData.writeFloatLE(ch, 4);
    cbData.writeFloatLE(elapsed, 8);
    cbData.writeFloatLE(timeOfDay, 12);
    cbData.writeFloatLE(camX + ox, 16);
    cbData.writeFloatLE(camY + oy, 20);
    cbData.writeFloatLE(camZ + oz, 24);
    cbData.writeFloatLE(Math.min(1, flash), 28);
    cbData.writeFloatLE(fwd[0], 32);
    cbData.writeFloatLE(fwd[1], 36);
    cbData.writeFloatLE(fwd[2], 40);
    cbData.writeFloatLE(eyeInWater ? 1 : 0, 44);
    cbData.writeFloatLE(right[0], 48);
    cbData.writeFloatLE(right[1], 52);
    cbData.writeFloatLE(right[2], 56);
    cbData.writeFloatLE(0, 60);
    cbData.writeFloatLE(up[0], 64);
    cbData.writeFloatLE(up[1], 68);
    cbData.writeFloatLE(up[2], 72);
    cbData.writeFloatLE(FOV, 76);
    cbData.writeFloatLE(sun[0], 80);
    cbData.writeFloatLE(sun[1], 84);
    cbData.writeFloatLE(sun[2], 88);
    cbData.writeFloatLE(0, 92);
    // Targeted block under the crosshair (interactive only → selection outline).
    const tgt = pickVoxel(voxels, [camX, camY, camZ], fwd, 80);
    if (interactive && tgt.hit) {
      cbData.writeInt32LE(tgt.cell[0], 96);
      cbData.writeInt32LE(tgt.cell[1], 100);
      cbData.writeInt32LE(tgt.cell[2], 104);
      cbData.writeInt32LE(1, 108);
    } else {
      cbData.writeInt32LE(0, 108);
    }
    cbData.writeUInt32LE(buildGlows(elapsed), 112);
    cbData.writeFloatLE(Math.min(1, hurt), 116); // red damage vignette
    gpu.updateConstantBuffer(cb, cbData);

    gpu.setRenderTargets([g.backBufferRTV]);
    gpu.setViewport(cw, ch);
    gpu.vsSet(vs);
    gpu.psSet(ps, { cb: [cb], srv: [field.srv!] });
    gpu.drawFullscreenTriangle();

    // HUD composites into the back buffer (interactive; VOX_HUD forces it in capture).
    if (interactive || process.env.VOX_HUD) drawHud(elapsed);

    // ── Capture the gallery PNG on the final frame, before present() ────────────
    const lastFrame = durationMs > 0 && now - startTime >= durationMs;
    if (lastFrame) {
      const shotDir = resolve(import.meta.dir, '..', 'screenshots');
      mkdirSync(shotDir, { recursive: true });
      const stats = captureBackBuffer(g, resolve(shotDir, 'voxelscape.png'), { gridW: 48, gridH: 22 });
      console.log(formatGrid(stats));
      console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
    }

    g.present(false);

    frames += 1;
    if (now - fpsWindowStart >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsWindowStart));
      frames = 0;
      fpsWindowStart = now;
    }

    if (lastFrame) break;
  }

  console.log(`Voxelscape done · ${fps} fps · ${g.driver} · ${g.gpuName}`);
  teardown(0);

  // ── Teardown ──────────────────────────────────────────────────────────────
  function teardown(code: number): void {
    if (interactive) User32.ShowCursor(1);
    audio?.close();
    hud.release();
    GDI32.DeleteObject(hudFont);
    GDI32.DeleteObject(hudFontSm);
    GDI32.DeleteObject(hudFontBig);
    comReleaseSafe(samp);
    comReleaseSafe(cb);
    comReleaseSafe(field.srv);
    comReleaseSafe(field.buffer);
    comReleaseSafe(ps);
    comReleaseSafe(vs);
    if (vsCode) gpu.blobRelease(vsCode.blob);
    if (psCode) gpu.blobRelease(psCode.blob);
    comReleaseSafe(g.backBufferRTV);
    comReleaseSafe(g.swapChain);
    comReleaseSafe(g.context);
    comReleaseSafe(g.device);
    win.destroy();
    process.exit(code);
  }
}

function comReleaseSafe(ptr: bigint | undefined): void {
  if (ptr !== undefined && ptr !== 0n) gpu.comRelease(ptr);
}

// Only launch the game when run directly. Importing this module (e.g. from
// voxelscape.logic.test.ts) exposes the pure exports without opening a window.
if (import.meta.main) {
  process.on('SIGINT', () => process.exit(0));
  process.on('uncaughtException', (e) => {
    console.error(e);
    process.exit(1);
  });
  main();
}
