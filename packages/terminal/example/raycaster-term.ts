/**
 * Raycaster (terminal) — a playable, fully-textured first-person dungeon crawl
 * rendered into the _term framebuffer: the Wolfenstein-3D / DOOM grid-raycasting
 * trick reborn in pure TypeScript, drawn with Unicode sextant sub-cells so a
 * 160×50 terminal becomes a 320×150 truecolour image. No GPU, no triangles, no
 * z-buffer — the entire 3D view is ONE DDA grid-march per screen column.
 *
 * (The sibling `raycaster.ts` does the same world on the real GPU as a fullscreen
 * HLSL shader; THIS file proves the CPU/_term engine can carry a real game at high
 * FPS and high detail, fully headless-capturable.)
 *
 * The world is a procedural maze on a power-of-two grid (seeded with mulberry32 so
 * it is identical every run): a recursive-backtracker carves a guaranteed-connected
 * labyrinth, a few rooms are punched out for sight-lines, and each wall cell carries
 * a MATERIAL id (brick / mossy stone / hewn block / blood-red accent) so the maze
 * reads as built architecture rather than a flat colour field.
 *
 * Rendering, per frame, for each of the t.W columns:
 *   • Cast one ray through the camera plane and DDA-step the grid cell-to-cell until
 *     it hits a wall — the classic Lode inner loop, zero allocation.
 *   • The PERPENDICULAR distance (not euclidean — kills the fisheye) sets the wall
 *     slice height; the exact hit coordinate along the face gives the texture u.
 *   • The vertical slice is filled straight into t.buf with a procedural per-material
 *     wall TEXTURE (brick courses + mortar / jittered mossy ashlar / chiselled hewn
 *     bevels, all via hash2 + smoothstep), shaded by DISTANCE FOG toward near-black,
 *     dimmed on N/S faces vs E/W so corners pop, and lit by a soft head-lamp gradient.
 *   • Above/below the slice a perspective FLOOR + CEILING cast: every ground pixel is
 *     back-projected to a world point and sampled from a procedural flagstone/grout
 *     pattern (warm stone below, cold vault above), both swallowed by the same fog.
 *   • A per-column depth buffer (perp distance) then lets billboarded, BOBBING pickup
 *     ORBS composite correctly — drawn only in columns where they sit in FRONT of the
 *     wall, depth-sorted far→near for free.
 *
 * A corner MINIMAP overlays the maze top-down with the player dot + a swept view
 * cone. Movement is WASD + arrows (forward/back, strafe, turn) with axis-separated
 * collision so you slide along walls instead of sticking. With NO key input — i.e. a
 * headless capture — an AUTOPILOT takes over: it probes a fan of headings, steers
 * toward the most open direction and eases its turn, so the captured frame is always
 * a rich textured corridor receding into fog, never a dead wall.
 *
 * Technique: DDA grid raycasting · perpendicular-distance fisheye correction ·
 *   per-column 1-ray vertical slice fill · procedural per-material wall textures ·
 *   perspective floor/ceiling casting · distance fog + N/S vs E/W side shading ·
 *   per-column depth-buffer billboard sprites · recursive-backtracker maze · slide
 *   collision · top-down minimap + view cone · self-driving attract mode.
 *
 * Run:  bun run packages/all/example/raycaster-term.ts
 *       CAPTURE_PNG=/tmp/ray.png TERM_COLS=160 TERM_ROWS=50 CAPTURE_T=3 bun run …
 */
import { Term, run } from '@bun-win32/terminal';

import { clamp, clamp01, smoothstep, fract, mulberry32, hash2 } from './_kit';

// ── Maze world ───────────────────────────────────────────────────────────────
// A square grid of cells. cell value 0 = open, ≥1 = solid wall with that material
// id. Seeded with mulberry32 so the maze, rooms and pickup placement are identical
// every run (the capture sees exactly the live maze).
const MAP_W = 24;
const MAP_H = 24;
const SEED = 0x5eed1337;
const grid = new Uint8Array(MAP_W * MAP_H);
const cell = (x: number, y: number): number => {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 1; // out of bounds = solid
  return grid[y * MAP_W + x];
};
const isWall = (x: number, y: number): boolean => cell(x | 0, y | 0) !== 0;

// Material ids → base wall colours; the texture function adds the brick/stone detail
// on top. 1 brick (warm clay), 2 mossy stone (cool grey-green), 3 hewn block (sandy),
// 4 accent (deep blood-red feature wall ringing rooms).
const MAT_BASE: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0],         // 0 unused (open)
  [168, 86, 56],     // 1 brick
  [104, 116, 100],   // 2 mossy stone
  [168, 152, 112],   // 3 hewn block
  [150, 46, 50],     // 4 accent
];

// Build the maze with a recursive backtracker over a cell lattice where odd cells are
// passages — this guarantees a fully-connected labyrinth — then punch a few rooms and
// assign materials in coherent patches.
let built = false;
const buildMaze = (): void => {
  if (built) return;
  built = true;
  const rnd = mulberry32(SEED);
  grid.fill(1); // start fully solid
  const stack: number[] = [];
  grid[1 * MAP_W + 1] = 0;
  stack.push(1, 1);
  const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
  while (stack.length) {
    const cy = stack.pop()!;
    const cx = stack.pop()!;
    const order = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = (rnd() * (i + 1)) | 0;
      const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }
    let pushedSelf = false;
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = dirs[order[d]];
      const nx = cx + dx, ny = cy + dy;
      if (nx <= 0 || ny <= 0 || nx >= MAP_W - 1 || ny >= MAP_H - 1) continue;
      if (grid[ny * MAP_W + nx] === 0) continue; // already open
      grid[(cy + dy / 2) * MAP_W + (cx + dx / 2)] = 0; // knock down the wall between
      grid[ny * MAP_W + nx] = 0;
      if (!pushedSelf) { stack.push(cx, cy); pushedSelf = true; }
      stack.push(nx, ny);
    }
  }
  // Punch out rooms (keep a 1-cell solid border).
  const carveRoom = (rx: number, ry: number, rw: number, rh: number): void => {
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++)
        if (x > 0 && y > 0 && x < MAP_W - 1 && y < MAP_H - 1) grid[y * MAP_W + x] = 0;
  };
  carveRoom(3, 3, 5, 4);
  carveRoom(15, 5, 5, 5);
  carveRoom(6, 16, 6, 5);
  carveRoom(16, 16, 4, 4);
  // Assign materials in coherent low-frequency patches so a corridor tends to share a
  // material (reads as one built structure); ring rooms with the accent feature wall.
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (grid[y * MAP_W + x] === 0) continue;
      const region = hash2((x / 3) | 0, (y / 3) | 0);
      let mat = region < 0.34 ? 1 : region < 0.68 ? 2 : 3;
      const nearOpen =
        (cell(x + 1, y) === 0 && cell(x + 2, y) === 0) ||
        (cell(x - 1, y) === 0 && cell(x - 2, y) === 0) ||
        (cell(x, y + 1) === 0 && cell(x, y + 2) === 0) ||
        (cell(x, y - 1) === 0 && cell(x, y - 2) === 0);
      if (nearOpen && hash2(x * 7 + 3, y * 13 + 5) < 0.16) mat = 4;
      grid[y * MAP_W + x] = mat;
    }
  }
};

// ── Procedural wall texture ──────────────────────────────────────────────────
// Sample a wall surface at (u in [0,1] across the face, v in [0,1] down the slice)
// for material `mat`, returning a 0..1 brightness multiplier on the base colour. Kept
// tight (a handful of fract/hash2/smoothstep) — called once per wall pixel.
const TEX = 64; // texels per wall face
const wallTexel = (mat: number, u: number, v: number): number => {
  const tu = u * TEX;
  const tv = v * TEX;
  if (mat === 1 || mat === 4) {
    // BRICK: staggered running-bond courses with dark mortar grooves + per-brick
    // value jitter + a soft inset round so each brick reads with relief.
    const courseH = 8;
    const row = Math.floor(tv / courseH);
    const offset = (row & 1) ? 8 : 0;
    const bx = Math.floor((tu + offset) / 16);
    const inU = ((tu + offset) % 16) / 16;
    const inV = (tv % courseH) / courseH;
    if (inU < 0.07 || inU > 0.93 || inV < 0.12 || inV > 0.88) return 0.32; // mortar
    const jit = hash2(bx, row);
    const round = smoothstep(0.0, 0.25, inU) * smoothstep(1.0, 0.75, inU)
                * smoothstep(0.0, 0.30, inV) * smoothstep(1.0, 0.70, inV);
    return 0.60 + jit * 0.30 + round * 0.22;
  }
  if (mat === 2) {
    // MOSSY STONE: jittered ashlar grid (so it's not a clean lattice) + speckle, with
    // moss pooling darker in the grout.
    const gx = Math.floor(tu / 16);
    const gy = Math.floor(tv / 11);
    const jx = hash2(gx, gy) * 4 - 2;
    const inU = fract((tu + jx) / 16);
    const inV = fract(tv / 11);
    const moss = smoothstep(0.55, 1.0, hash2(gx * 3 + 1, gy * 5 + 2));
    if (inU < 0.08 || inU > 0.92 || inV < 0.10 || inV > 0.90) return 0.28 + moss * 0.10;
    const speck = hash2(tu | 0, tv | 0) * 0.18;
    return 0.56 + speck + hash2(gx, gy) * 0.18 - moss * 0.16;
  }
  // HEWN BLOCK (3): big sandy ashlars with chiselled bevels + faint tool marks.
  const gx = Math.floor(tu / 21);
  const gy = Math.floor(tv / 13);
  const inU = fract(tu / 21);
  const inV = fract(tv / 13);
  if (inU < 0.05 || inV < 0.06) return 0.40; // seam
  const bevel = smoothstep(0.0, 0.16, inU) * smoothstep(1.0, 0.84, inU)
              * smoothstep(0.0, 0.18, inV) * smoothstep(1.0, 0.82, inV);
  const tool = Math.sin(tu * 1.7 + gy) * 0.04;
  return 0.58 + bevel * 0.28 + hash2(gx, gy) * 0.14 + tool;
};

// ── Player + input ───────────────────────────────────────────────────────────
const player = { x: 5.0, y: 5.0, ang: 0.35 };
let playerInit = false;
const resetPlayer = (): void => { player.x = 5.0; player.y = 5.0; player.ang = 0.35; playerInit = true; };

const keys = { w: false, s: false, a: false, d: false, up: false, dn: false, lf: false, rt: false };
let everPressed = false;          // has a real key EVER arrived? (attract until then)
let lastInputT = -1e9;
const simTime = { v: 0 };
const ATTRACT_IDLE = 2.5;         // seconds idle before autopilot resumes

// Terminals send key REPEATS, not press/release: latch a key as held, clear shortly
// after the last repeat so continuous WASD reads as continuous motion.
const releaseTimers: Record<string, number> = {};
const hold = (k: keyof typeof keys): void => { keys[k] = true; releaseTimers[k] = simTime.v + 0.16; };
const expireKeys = (now: number): void => {
  for (const k in releaseTimers) if (now >= releaseTimers[k]) keys[k as keyof typeof keys] = false;
};
const onKey = (key: string): void => {
  everPressed = true;
  lastInputT = simTime.v;
  switch (key) {
    case 'w': hold('w'); break;
    case 's': hold('s'); break;
    case 'a': hold('a'); break;
    case 'd': hold('d'); break;
    case 'up': hold('up'); break;
    case 'down': hold('dn'); break;
    case 'left': hold('lf'); break;
    case 'right': hold('rt'); break;
  }
};

// Collision: move by (dx,dy) keeping a small radius clear of walls, each axis resolved
// independently so the player slides along a surface instead of sticking.
const RADIUS = 0.22;
const tryMove = (dx: number, dy: number): void => {
  const nx = player.x + dx;
  if (!isWall(nx + Math.sign(dx) * RADIUS, player.y)) player.x = nx;
  const ny = player.y + dy;
  if (!isWall(player.x, ny + Math.sign(dy) * RADIUS)) player.y = ny;
};

// ── Sprites (bobbing pickup orbs) ──────────────────────────────────────────────
interface Sprite { x: number; y: number; hue: number; }
const sprites: Sprite[] = [
  { x: 5.5, y: 5.5, hue: 0.13 },   // gold orb (spawn room)
  { x: 17.5, y: 7.5, hue: 0.55 },  // cyan orb (NE room)
  { x: 9.0, y: 18.5, hue: 0.83 },  // magenta orb (SW room)
];

// Precompute saturated orb colours by hue (no per-pixel allocation).
const orbColor = new Map<number, [number, number, number]>();
const hsvBright = (h: number): [number, number, number] => {
  let c = orbColor.get(h);
  if (!c) {
    const i = Math.floor(fract(h) * 6);
    const f = fract(h) * 6 - i;
    const v = 1, s = 0.85;
    const p = v * (1 - s), q = v * (1 - s * f), tt = v * (1 - s * (1 - f));
    let r: number, g: number, b: number;
    switch (i % 6) {
      case 0: r = v; g = tt; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = tt; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = tt; g = p; b = v; break;
      default: r = v; g = p; b = q; break;
    }
    c = [(r * 255) | 0, (g * 255) | 0, (b * 255) | 0];
    orbColor.set(h, c);
  }
  return c;
};

// ── Per-column scratch (resize-safe; reallocated only when W changes) ──────────
let depth!: Float32Array;   // perpendicular wall distance per column
let depthW = 0;

// Fog: walls/floor/ceiling melt toward a near-black cold colour with distance, so the
// corridor recedes into darkness (the head-lamp look).
const FOG_R = 6, FOG_G = 7, FOG_B = 12;
const FOG_MAX = 13; // distance at which everything is full fog (lower → deeper darkness ahead)

// ── Render ─────────────────────────────────────────────────────────────────────
const frame = (t: Term, time: number, dt: number, _frame: number): void => {
  simTime.v = time;
  buildMaze();
  if (!playerInit) resetPlayer();
  const W = t.width, H = t.height, buf = t.pixels;
  if (depthW !== W) { depth = new Float32Array(W); depthW = W; }

  // ── Input → movement ───────────────────────────────────────────────────────
  expireKeys(time);
  const attract = !everPressed || (time - lastInputT) > ATTRACT_IDLE;

  // probe distance to wall along heading a (longer = more open); capped.
  const probe = (a: number): number => {
    const cx = Math.cos(a), sy = Math.sin(a);
    let d = 0;
    while (d < 8) { d += 0.25; if (isWall(player.x + cx * d, player.y + sy * d)) break; }
    return d;
  };

  if (attract) {
    // AUTOPILOT: sample bearings around the current heading, pick the openest (with a
    // forward bias so it doesn't dither at junctions), ease the turn, and cruise —
    // slowing near walls so it curves rather than noses in. Deterministic.
    let best = -1, bestA = player.ang;
    for (let k = -3; k <= 3; k++) {
      const a = player.ang + k * 0.38;
      const open = probe(a) - Math.abs(k) * 0.55;
      if (open > best) { best = open; bestA = a; }
    }
    let da = bestA - player.ang;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    player.ang += da * Math.min(1, dt * 3.2) + Math.sin(time * 0.7) * 0.004;
    const ahead = probe(player.ang);
    const speed = clamp(ahead * 0.5, 0.4, 2.2);
    tryMove(Math.cos(player.ang) * speed * dt, Math.sin(player.ang) * speed * dt);
  } else {
    // MANUAL: WASD/arrows. W/S forward-back, A/D strafe, ←/→ turn.
    const TURN = 2.6, MOVE = 2.6;
    let fwd = 0, strafe = 0, turn = 0;
    if (keys.w || keys.up) fwd += 1;
    if (keys.s || keys.dn) fwd -= 1;
    if (keys.a) strafe -= 1;
    if (keys.d) strafe += 1;
    if (keys.lf) turn -= 1;
    if (keys.rt) turn += 1;
    player.ang += turn * TURN * dt;
    const ca = Math.cos(player.ang), sa = Math.sin(player.ang);
    tryMove((ca * fwd - sa * strafe) * MOVE * dt, (sa * fwd + ca * strafe) * MOVE * dt);
  }

  // ── Camera basis ───────────────────────────────────────────────────────────
  // direction vector + camera plane (perpendicular, scaled by tan(FOV/2)≈0.66 → ~66°
  // FOV, the Wolf3D default). screen column → ray = dir + plane*cameraX.
  const dirX = Math.cos(player.ang), dirY = Math.sin(player.ang);
  const planeX = -dirY * 0.66, planeY = dirX * 0.66;
  const horizon = H >> 1;
  const posX = player.x, posY = player.y;

  // ── Floor & ceiling cast (per row below/above the horizon, perspective-correct) ─
  // Each screen row maps to a constant world distance; step the world point across
  // the row and sample a procedural flagstone/grout pattern. Ceiling mirrors it,
  // colder + dimmer. Done before walls so the wall slices overwrite the middle band.
  const rayDir0X = dirX - planeX, rayDir0Y = dirY - planeY; // cameraX = -1
  const rayDir1X = dirX + planeX, rayDir1Y = dirY + planeY; // cameraX = +1
  for (let y = horizon + 1; y < H; y++) {
    const p = y - horizon;
    const rowDist = (0.5 * H) / p;
    const stepX = (rowDist * (rayDir1X - rayDir0X)) / W;
    const stepY = (rowDist * (rayDir1Y - rayDir0Y)) / W;
    let fx = posX + rowDist * rayDir0X;
    let fy = posY + rowDist * rayDir0Y;
    const fog = clamp01(rowDist / FOG_MAX);
    const ff = fog * fog, ia = 1 - ff;
    const yCeil = horizon - p;
    const oFloor = y * W * 3;
    const oCeil = yCeil >= 0 ? yCeil * W * 3 : -1;
    for (let x = 0; x < W; x++) {
      const cxw = Math.floor(fx), cyw = Math.floor(fy);
      const inU = fx - cxw, inV = fy - cyw;
      const grout = inU < 0.06 || inU > 0.94 || inV < 0.06 || inV > 0.94;
      const tile = hash2(cxw, cyw);
      // FLOOR: warm flagstones, dark grout grid, per-tile value jitter.
      let fr: number, fg: number, fb: number;
      if (grout) { fr = 26; fg = 22; fb = 18; }
      else { const v = 0.5 + tile * 0.5; fr = (104 * v) | 0; fg = (82 * v) | 0; fb = (56 * v) | 0; }
      const oF = oFloor + x * 3;
      buf[oF] = (fr * ia + FOG_R * ff) | 0;
      buf[oF + 1] = (fg * ia + FOG_G * ff) | 0;
      buf[oF + 2] = (fb * ia + FOG_B * ff) | 0;
      // CEILING: cold vault — darker, blue-grey.
      if (oCeil >= 0) {
        let cr: number, cg: number, cb: number;
        if (grout) { cr = 10; cg = 12; cb = 16; }
        else { const v = 0.4 + tile * 0.4; cr = (42 * v) | 0; cg = (48 * v) | 0; cb = (64 * v) | 0; }
        const oC = oCeil + x * 3;
        buf[oC] = (cr * ia + FOG_R * ff) | 0;
        buf[oC + 1] = (cg * ia + FOG_G * ff) | 0;
        buf[oC + 2] = (cb * ia + FOG_B * ff) | 0;
      }
      fx += stepX; fy += stepY;
    }
  }
  // horizon row (p=0 → divide-by-zero) painted as deep fog
  {
    const o = horizon * W * 3;
    for (let x = 0; x < W; x++) { const j = o + x * 3; buf[j] = FOG_R; buf[j + 1] = FOG_G; buf[j + 2] = FOG_B; }
  }

  // ── Wall column raycast (DDA) ────────────────────────────────────────────────
  for (let x = 0; x < W; x++) {
    const cameraX = (2 * x) / W - 1;
    const rdx = dirX + planeX * cameraX;
    const rdy = dirY + planeY * cameraX;
    let mapX = posX | 0, mapY = posY | 0;
    const deltaX = rdx === 0 ? 1e30 : Math.abs(1 / rdx);
    const deltaY = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
    let stepX: number, stepY: number, sideDistX: number, sideDistY: number;
    if (rdx < 0) { stepX = -1; sideDistX = (posX - mapX) * deltaX; }
    else { stepX = 1; sideDistX = (mapX + 1 - posX) * deltaX; }
    if (rdy < 0) { stepY = -1; sideDistY = (posY - mapY) * deltaY; }
    else { stepY = 1; sideDistY = (mapY + 1 - posY) * deltaY; }
    let side = 0;        // 0 = x-side (E/W), 1 = y-side (N/S)
    let mat = 1;
    for (let guard = 0; guard < 256; guard++) {
      if (sideDistX < sideDistY) { sideDistX += deltaX; mapX += stepX; side = 0; }
      else { sideDistY += deltaY; mapY += stepY; side = 1; }
      const c = cell(mapX, mapY);
      if (c !== 0) { mat = c; break; }
    }
    const perp = side === 0 ? (sideDistX - deltaX) : (sideDistY - deltaY);
    const dist = perp < 1e-4 ? 1e-4 : perp;
    depth[x] = dist;
    const lineH = (H / dist) | 0;
    const drawStart = horizon - (lineH >> 1);
    const drawEnd = horizon + (lineH >> 1);
    // exact hit coordinate along the wall face → texture u
    let wallU = side === 0 ? posY + perp * rdy : posX + perp * rdx;
    wallU -= Math.floor(wallU);
    if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) wallU = 1 - wallU; // unflip at corners
    const base = MAT_BASE[mat] ?? MAT_BASE[1];
    const br = base[0], bg = base[1], bb = base[2];
    const sideShade = side === 1 ? 0.62 : 1.0; // N/S darker so cube edges read as corners
    const fog = clamp01(dist / FOG_MAX);
    const ff = fog * fog, ia = 1 - ff;
    const yStart = drawStart < 0 ? 0 : drawStart;
    const yEnd = drawEnd > H ? H : drawEnd;
    const invLineH = 1 / (lineH || 1);
    const o0 = x * 3;
    for (let y = yStart; y < yEnd; y++) {
      const v = (y - drawStart) * invLineH; // 0..1 down the (un-clipped) wall
      const tx = wallTexel(mat, wallU, v);
      const lamp = 0.82 + 0.18 * (1 - Math.abs(v - 0.5) * 1.4); // soft head-lamp gradient
      const shade = tx * sideShade * lamp;
      const r = br * shade * ia + FOG_R * ff;
      const g = bg * shade * ia + FOG_G * ff;
      const b = bb * shade * ia + FOG_B * ff;
      const o = o0 + y * W * 3;
      buf[o] = r > 255 ? 255 : r | 0;
      buf[o + 1] = g > 255 ? 255 : g | 0;
      buf[o + 2] = b > 255 ? 255 : b | 0;
    }
  }

  // ── Billboard sprites (depth-sorted, per-column depth test) ─────────────────
  const order = sprites
    .map((s, i) => ({ i, d: (s.x - posX) * (s.x - posX) + (s.y - posY) * (s.y - posY) }))
    .sort((a, b) => b.d - a.d); // far → near
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  for (const { i } of order) {
    const s = sprites[i];
    const relX = s.x - posX, relY = s.y - posY;
    const transX = invDet * (dirY * relX - dirX * relY);
    const transY = invDet * (-planeY * relX + planeX * relY); // forward depth
    if (transY <= 0.15) continue;
    const screenX = (W / 2) * (1 + transX / transY);
    const bob = Math.sin(time * 2.4 + i * 1.7) * 0.12;
    const spriteH = Math.abs(H / transY) * 0.5;
    const rad = spriteH * 0.5;
    const vMove = (bob + 0.18) * (H / transY); // float above the floor
    const cys = horizon - vMove;
    const yTop = (cys - rad) | 0, yBot = (cys + rad) | 0;
    const xL = (screenX - rad) | 0, xR = (screenX + rad) | 0;
    const [cr, cg, cb] = hsvBright(s.hue);
    const fog = clamp01(transY / FOG_MAX);
    const ia = 1 - fog * fog;
    const invRad = 1 / (rad || 1);
    for (let x = xL; x <= xR; x++) {
      if (x < 0 || x >= W) continue;
      if (transY >= depth[x]) continue; // occluded by wall in this column
      const dx = (x - screenX) * invRad;
      for (let y = yTop; y <= yBot; y++) {
        if (y < 0 || y >= H) continue;
        const dy = (y - cys) * invRad;
        const r2 = dx * dx + dy * dy;
        if (r2 > 1) continue;            // round mask
        const glow = 1 - r2;             // hot core → soft edge
        const k = (0.5 + glow) * ia;
        t.blendPixel(x, y, clamp01(cr * k / 255) * 255, clamp01(cg * k / 255) * 255, clamp01(cb * k / 255) * 255, clamp01(glow * glow));
      }
    }
  }

  // ── Minimap overlay (top-right corner) ──────────────────────────────────────
  drawMinimap(t);
};

// ── Minimap: top-down maze + player dot + swept view cone ───────────────────────
const drawMinimap = (t: Term): void => {
  const W = t.width;
  const px = Math.max(2, Math.min(4, ((W / 80) | 0) || 2)); // pixels per cell
  const mw = MAP_W * px, mh = MAP_H * px;
  const ox = W - mw - 2, oy = 2;            // top-right corner, 2px margin
  t.plate(ox - 1, oy - 1, mw + 2, mh + 2, 0.55);
  for (let cy = 0; cy < MAP_H; cy++) {
    for (let cx = 0; cx < MAP_W; cx++) {
      const c = cell(cx, cy);
      let r: number, g: number, b: number;
      if (c === 0) { r = 24; g = 26; b = 34; }
      else { const base = MAT_BASE[c] ?? MAT_BASE[1]; r = (base[0] * 0.55) | 0; g = (base[1] * 0.55) | 0; b = (base[2] * 0.55) | 0; }
      const bx = ox + cx * px, by = oy + cy * px;
      for (let j = 0; j < px; j++) for (let k = 0; k < px; k++) t.setPixel(bx + k, by + j, r, g, b);
    }
  }
  // swept view cone
  const half = 0.58;
  for (let s = -3; s <= 3; s++) {
    const a = player.ang + (s / 3) * half;
    const dx = Math.cos(a), dy = Math.sin(a);
    for (let d = 0; d < 6 * px; d++) {
      const wx = player.x + dx * (d / px);
      const wy = player.y + dy * (d / px);
      if (isWall(wx, wy)) break;
      t.blendPixel((ox + wx * px) | 0, (oy + wy * px) | 0, 255, 220, 120, 0.18);
    }
  }
  // sprite dots
  for (const s of sprites) {
    const [cr, cg, cb] = hsvBright(s.hue);
    t.setPixel((ox + s.x * px) | 0, (oy + s.y * px) | 0, cr, cg, cb);
  }
  // player dot + heading nub
  const pX = ox + player.x * px, pY = oy + player.y * px;
  for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) t.setPixel((pX | 0) + k, (pY | 0) + j, 255, 255, 255);
  t.setPixel((pX + Math.cos(player.ang) * px) | 0, (pY + Math.sin(player.ang) * px) | 0, 255, 60, 60);
};

run({
  title: 'Raycaster',
  hud: 'WASD/ARROWS MOVE - A/D STRAFE - LEFT/RIGHT TURN - Q QUIT',
  mode: 'sextant',
  diff: 'threshold',
  threshold: 6,
  captureT: 3,
  targetFps: 0, // uncapped
  init: () => { buildMaze(); resetPlayer(); everPressed = false; lastInputT = -1e9; },
  frame,
  onKey,
});
