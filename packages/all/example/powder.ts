/**
 * Powder — a falling-sand sandbox you paint with your cursor.
 *
 * A CELLULAR-AUTOMATON world at full pixel resolution: every screen pixel is one
 * cell of a grain of matter. Each frame the grid is updated BOTTOM-UP (so a grain
 * that falls one row can't be re-stepped the same frame) with an alternating
 * LEFT↔RIGHT horizontal scan each frame so neither hand of diagonal flow is
 * favoured — piles stay symmetric instead of leaning. A per-cell `moved` stamp
 * (the running frame number) guarantees one move per grain per frame.
 *
 * Materials and their rules:
 *   SAND   — falls; slides diagonally to pile at the angle of repose; sinks
 *            through WATER/OIL (denser), displacing them upward.
 *   WATER  — falls, then spreads sideways to find its level (it FLOWS); carries a
 *            small persistent flow-direction bias so currents read as moving.
 *   OIL    — lighter than water (floats on it), flows like a thin liquid, and is
 *            FLAMMABLE — fire ignites it on contact.
 *   FIRE   — rises, has a short life, ignites neighbouring OIL/PLANT, dies into
 *            rising SMOKE. Emissive (blooms hot).
 *   LAVA   — a slow, viscous glowing liquid; ignites oil/plant; LAVA + WATER →
 *            STONE (with a hiss of steam). Emissive.
 *   STONE  — static solid (cooled lava / built terrain).
 *   WALL   — immovable boundary the player can paint.
 *   PLANT  — climbs into adjacent WATER (grows), and burns when touched by fire.
 *   SMOKE/STEAM — rise and dissipate (short life), fading to nothing.
 *
 * Per-cell colour JITTER (hashed from the grain's spawn coordinate) gives sand its
 * grit, water its rippled translucency, stone its speckle — so a uniform material
 * never reads as a flat slab. Fire and lava are rendered as HDR EMITTERS: their
 * heat is accumulated into a light buffer and a cheap separable bloom bleeds the
 * glow into surrounding pixels, all tonemapped with ACES for a hot, non-clipped
 * core. Liquids are alpha-composited over whatever is behind them.
 *
 * Interaction (live): the mouse PAINTS the current material in a round brush while
 * the left button is held; number keys 1..8 pick the material; the wheel grows /
 * shrinks the brush; 'c' clears the world (keeping the floor). With no input, an
 * ATTRACT performance plays automatically — pouring alternating streams of sand and
 * water that pile and pool, then dripping fire onto a slick of oil so it catches and
 * smokes, with a lava vent crusting into stone where it meets the water. It hands
 * control to you the instant you touch it and resumes attract after a few idle
 * seconds. Everything is mulberry32-seeded and time-derived, so captures reproduce.
 *
 * Technique: pixel-resolution cellular automaton · bottom-up + alternating-L/R scan
 * with a per-cell move stamp · density-ordered displacement (sand>lava>water>oil) ·
 * liquid level-finding flow · combustion/extinguish state machine · hash2 per-cell
 * colour grit · HDR emissive fire/lava + separable bloom + ACES grade.
 *
 * Run: bun run packages/all/example/powder.ts
 */
import { runDemo, Term, clamp, clamp01, aces, mulberry32, hash2 } from './_term';

// ── Material ids (packed into one Uint8 grid) ──────────────────────────────────
const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const OIL = 3;
const FIRE = 4;
const SMOKE = 5;
const LAVA = 6;
const STONE = 7;
const WALL = 8;
const PLANT = 9;
const STEAM = 10; // lava+water hiss — a brief bright smoke that rises faster
const NMAT = 11;

// Paintable materials in key order 1..8 (selector entries).
const PALETTE: { id: number; name: string }[] = [
  { id: SAND, name: 'SAND' },
  { id: WATER, name: 'WATER' },
  { id: OIL, name: 'OIL' },
  { id: FIRE, name: 'FIRE' },
  { id: LAVA, name: 'LAVA' },
  { id: STONE, name: 'STONE' },
  { id: WALL, name: 'WALL' },
  { id: PLANT, name: 'PLANT' },
];

// Density ordering for displacement. Higher = sinks below lower. Negative = gas.
const DENSITY = new Float32Array(NMAT);
DENSITY[SAND] = 6;
DENSITY[LAVA] = 4; // under water/oil, but sand still sinks through lava
DENSITY[WATER] = 3;
DENSITY[OIL] = 2;
DENSITY[FIRE] = -1;
DENSITY[SMOKE] = -2;
DENSITY[STEAM] = -2;

const isLiquid = (m: number): boolean => m === WATER || m === OIL || m === LAVA;
const isFlammable = (m: number): boolean => m === OIL || m === PLANT;
// May a falling/flowing grain swap into a cell currently holding `there`?
const canSinkInto = (mover: number, there: number): boolean =>
  there === EMPTY || (DENSITY[there] >= 0 && isLiquid(there) && DENSITY[mover] > DENSITY[there]);

// ── Grids (allocated for the live pixel resolution in init/resize) ─────────────
let GW = 0;
let GH = 0;
let cell = new Uint8Array(0); // material id
let life = new Uint8Array(0); // gas/lava countdown & liquid flow bias
let moved = new Int32Array(0); // last frame index this cell was moved (one / frame)
let sx = new Uint16Array(0); // grain spawn x — stable colour jitter while it falls
let sy = new Uint16Array(0); // grain spawn y
let stamp = 1; // running update counter (the move stamp; never 0)

// HDR emissive light buffer + separable-bloom scratch (full pixel res). Two scales
// of glow are accumulated: a TIGHT 5-tap blur for the hot near-core bleed, and a
// WIDE half-resolution blur that throws a soft warm light POOL across the scene so
// fire/lava actually illuminate the surrounding sand/water (not just themselves).
let light = new Float32Array(0); // [r-weighted emitter energy] full res
let bloomA = new Float32Array(0); // tight horizontal scratch
let bloomB = new Float32Array(0); // tight blurred glow
let wideA = new Float32Array(0); // half-res downsample / h-blur scratch
let wideB = new Float32Array(0); // half-res blurred glow
let HW = 0; // half-res width
let HH = 0; // half-res height

// Depth-of-water per column: y of the topmost water cell (or GH = none), so the
// renderer can darken water by how far below the surface it sits (translucency).
let waterTop = new Int16Array(0);

// A long-lived rng for simulation stochastics (probabilistic flow, flicker). It is
// advanced only inside the deterministic update path so capture/bench reproduce.
let rng = mulberry32(0x50fa11);

const idx = (x: number, y: number): number => y * GW + x;

const setCell = (x: number, y: number, m: number, spawnX: number, spawnY: number): void => {
  const i = y * GW + x;
  cell[i] = m;
  sx[i] = spawnX;
  sy[i] = spawnY;
  if (m === FIRE) life[i] = 40 + ((rng() * 28) | 0);
  else if (m === SMOKE) life[i] = 54 + ((rng() * 44) | 0);
  else if (m === STEAM) life[i] = 30 + ((rng() * 24) | 0);
  else if (m === LAVA) life[i] = 0; // lava life unused; kept 0
  else life[i] = 0;
};

const moveCell = (from: number, to: number): void => {
  cell[to] = cell[from];
  life[to] = life[from];
  sx[to] = sx[from];
  sy[to] = sy[from];
  cell[from] = EMPTY;
  life[from] = 0;
  moved[to] = stamp;
};

const swapCell = (a: number, b: number): void => {
  const cm = cell[a]; const cl = life[a]; const cx = sx[a]; const cy = sy[a];
  cell[a] = cell[b]; life[a] = life[b]; sx[a] = sx[b]; sy[a] = sy[b];
  cell[b] = cm; life[b] = cl; sx[b] = cx; sy[b] = cy;
  moved[a] = stamp;
  moved[b] = stamp;
};

// ── Allocate / reset for a given pixel resolution ──────────────────────────────
const allocate = (w: number, h: number): void => {
  GW = w;
  GH = h;
  const n = w * h;
  cell = new Uint8Array(n);
  life = new Uint8Array(n);
  moved = new Int32Array(n);
  sx = new Uint16Array(n);
  sy = new Uint16Array(n);
  light = new Float32Array(n);
  bloomA = new Float32Array(n);
  bloomB = new Float32Array(n);
  HW = (w + 1) >> 1;
  HH = (h + 1) >> 1;
  wideA = new Float32Array(HW * HH);
  wideB = new Float32Array(HW * HH);
  waterTop = new Int16Array(w);
  stamp = 1;
  rng = mulberry32(0x50fa11);
  // A thin floor + side walls so material has something to pile on / against.
  for (let x = 0; x < GW; x++) {
    cell[idx(x, GH - 1)] = WALL;
    sx[idx(x, GH - 1)] = x;
    sy[idx(x, GH - 1)] = GH - 1;
  }
};

// Clear everything but the floor/walls (live 'c' key).
const clearWorld = (): void => {
  for (let y = 0; y < GH - 1; y++) {
    const row = y * GW;
    for (let x = 0; x < GW; x++) {
      cell[row + x] = EMPTY;
      life[row + x] = 0;
    }
  }
};

// ── The cellular update: one bottom-up pass with alternating L/R scan ──────────
// Bottom-up means a grain that drops into row y+? this frame is already past the
// scan and won't be re-evaluated. The per-cell `moved` stamp additionally blocks a
// grain that was carried INTO the current cell (e.g. displaced upward) from moving
// again this frame, which would otherwise double-step liquids.
const update = (): void => {
  stamp++;
  const ltr = (stamp & 1) === 0; // alternate horizontal scan direction each frame
  for (let y = GH - 1; y >= 0; y--) {
    const row = y * GW;
    for (let xi = 0; xi < GW; xi++) {
      const x = ltr ? xi : GW - 1 - xi;
      const i = row + x;
      const m = cell[i];
      if (m === EMPTY || m === WALL || m === STONE) continue;
      if (moved[i] === stamp) continue;

      switch (m) {
        case SAND: stepSand(x, y, i); break;
        case WATER: stepLiquid(x, y, i, WATER, 5); break;
        case OIL: stepLiquid(x, y, i, OIL, 6); break;
        case LAVA: stepLava(x, y, i); break;
        case FIRE: stepFire(x, y, i); break;
        case SMOKE: stepGas(x, y, i, SMOKE); break;
        case STEAM: stepGas(x, y, i, STEAM); break;
        case PLANT: stepPlant(x, y, i); break;
      }
    }
  }
};

// SAND — fall straight; else slide to whichever lower-diagonal is open (random
// tie-break so piles don't lean); sinks through liquids it's denser than.
const stepSand = (x: number, y: number, i: number): void => {
  if (y >= GH - 1) return;
  const below = i + GW;
  if (canSinkInto(SAND, cell[below])) {
    if (cell[below] === EMPTY) moveCell(i, below);
    else swapCell(i, below); // displace the lighter liquid upward
    return;
  }
  // Diagonals.
  const left = x > 0;
  const right = x < GW - 1;
  const dl = left && canSinkInto(SAND, cell[below - 1]) && canSinkInto(SAND, cell[i - 1]);
  const dr = right && canSinkInto(SAND, cell[below + 1]) && canSinkInto(SAND, cell[i + 1]);
  if (dl && dr) {
    const to = rng() < 0.5 ? below - 1 : below + 1;
    if (cell[to] === EMPTY) moveCell(i, to); else swapCell(i, to);
  } else if (dl) {
    if (cell[below - 1] === EMPTY) moveCell(i, below - 1); else swapCell(i, below - 1);
  } else if (dr) {
    if (cell[below + 1] === EMPTY) moveCell(i, below + 1); else swapCell(i, below + 1);
  }
};

// LIQUID — water/oil. Fall, then sink through a less-dense liquid below; else flow
// sideways up to `spread` cells toward the lower / open side to find its level.
// life[i] carries a persistent flow-direction bias (0=left,1=right,2=settled) so a
// current keeps a direction for a while instead of jittering in place.
const stepLiquid = (x: number, y: number, i: number, mat: number, spread: number): void => {
  if (y < GH - 1) {
    const below = i + GW;
    const cb = cell[below];
    if (cb === EMPTY) { moveCell(i, below); return; }
    if (isLiquid(cb) && DENSITY[mat] > DENSITY[cb]) { swapCell(i, below); return; }
    // Diagonal trickle into an open lower cell (keeps liquids from stacking columns).
    const left = x > 0;
    const right = x < GW - 1;
    const odl = left && cell[below - 1] === EMPTY;
    const odr = right && cell[below + 1] === EMPTY;
    if (odl && odr) { moveCell(i, rng() < 0.5 ? below - 1 : below + 1); return; }
    if (odl) { moveCell(i, below - 1); return; }
    if (odr) { moveCell(i, below + 1); return; }
  }
  // Horizontal flow to find level. Choose a direction, persist it via life bias.
  let dir = life[i] === 1 ? 1 : life[i] === 0 ? -1 : 0;
  if (dir === 0) dir = rng() < 0.5 ? -1 : 1;
  // Probe the chosen side first; if blocked, try the other; cap the run length.
  for (let attempt = 0; attempt < 2; attempt++) {
    let nx = x;
    let last = i;
    let ran = false;
    for (let s = 0; s < spread; s++) {
      const tx = nx + dir;
      if (tx < 0 || tx >= GW) break;
      const t = idx(tx, y);
      if (cell[t] !== EMPTY) break;
      // Prefer falling if the cell below the candidate is open (water seeks down).
      last = t;
      nx = tx;
      ran = true;
      if (y < GH - 1 && cell[t + GW] === EMPTY) break;
    }
    if (ran) {
      moveCell(i, last);
      life[last] = dir === 1 ? 1 : 0; // remember the flow direction at the new cell
      return;
    }
    dir = -dir; // blocked this way — try the other side next attempt
  }
  // Couldn't move — mark as momentarily settled so it doesn't thrash a bias.
  life[i] = 2;
};

// LAVA — like a heavy liquid but VISCOUS (only flows some frames), glowing, and
// reactive: turns to STONE on contact with water (hissing STEAM), and ignites
// adjacent flammables into fire.
const stepLava = (x: number, y: number, i: number): void => {
  // React with neighbouring water → stone + steam; ignite flammables.
  if (reactLava(x, y, i)) return;
  // Viscosity: only attempt to move ~55% of frames so it crawls.
  if (rng() > 0.55) return;
  if (y < GH - 1) {
    const below = i + GW;
    const cb = cell[below];
    if (cb === EMPTY) { moveCell(i, below); return; }
    if ((cb === WATER || cb === OIL)) { swapCell(i, below); return; }
    const left = x > 0;
    const right = x < GW - 1;
    const odl = left && cell[below - 1] === EMPTY;
    const odr = right && cell[below + 1] === EMPTY;
    if (odl && odr) { moveCell(i, rng() < 0.5 ? below - 1 : below + 1); return; }
    if (odl) { moveCell(i, below - 1); return; }
    if (odr) { moveCell(i, below + 1); return; }
  }
  // Short, slow horizontal creep.
  const dir = rng() < 0.5 ? -1 : 1;
  for (let d = 0; d < 2; d++) {
    const dd = d === 0 ? dir : -dir;
    const tx = x + dd;
    if (tx < 0 || tx >= GW) continue;
    const t = idx(tx, y);
    if (cell[t] === EMPTY) { moveCell(i, t); return; }
  }
};

// Lava reactions on its 4-neighbourhood. Returns true if the lava cell was consumed
// (turned to stone) so the caller stops moving it.
const reactLava = (x: number, y: number, i: number): boolean => {
  const ns = [y > 0 ? i - GW : -1, y < GH - 1 ? i + GW : -1, x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1];
  let metWater = false;
  for (let k = 0; k < 4; k++) {
    const j = ns[k];
    if (j < 0) continue;
    const cm = cell[j];
    if (cm === WATER) {
      // Water touching lava boils to steam; lava chills to stone.
      metWater = true;
      cell[j] = STEAM;
      life[j] = 28 + ((rng() * 20) | 0);
      moved[j] = stamp;
    } else if (isFlammable(cm) && rng() < 0.5) {
      cell[j] = FIRE;
      life[j] = 38 + ((rng() * 26) | 0);
      moved[j] = stamp;
    }
  }
  if (metWater) {
    cell[i] = STONE;
    life[i] = 0;
    moved[i] = stamp;
    return true;
  }
  return false;
};

// FIRE — ignite flammable neighbours, rise/flicker, then burn out into smoke.
const stepFire = (x: number, y: number, i: number): void => {
  // Spread to flammable 8-neighbourhood.
  for (let dy = -1; dy <= 1; dy++) {
    const ny = y + dy;
    if (ny < 0 || ny >= GH) continue;
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      if (nx < 0 || nx >= GW) continue;
      const j = idx(nx, ny);
      const cm = cell[j];
      if (isFlammable(cm) && rng() < 0.34) {
        cell[j] = FIRE;
        life[j] = 30 + ((rng() * 24) | 0);
        moved[j] = stamp;
      } else if (cm === WATER && rng() < 0.6) {
        // Water snuffs the fire (turns this fire to a wisp of steam).
        cell[i] = STEAM;
        life[i] = 14 + ((rng() * 12) | 0);
        moved[i] = stamp;
        return;
      }
    }
  }
  // Age; on death leave a rising wisp of smoke (kept short-lived so the plume lifts
  // out cleanly instead of building a muddy floor haze).
  if (life[i] <= 1) {
    if (rng() < 0.42) { cell[i] = SMOKE; life[i] = 42 + ((rng() * 30) | 0); moved[i] = stamp; }
    else { cell[i] = EMPTY; life[i] = 0; }
    return;
  }
  life[i]--;
  // Rise: prefer moving up into an empty/gas cell, with a flicker drift.
  if (y > 0) {
    const up = i - GW;
    if (cell[up] === EMPTY) {
      const drift = rng();
      if (drift < 0.6) { moveCell(i, up); return; }
      const dd = drift < 0.8 ? -1 : 1;
      const nx = x + dd;
      if (nx >= 0 && nx < GW && cell[idx(nx, y - 1)] === EMPTY) { moveCell(i, idx(nx, y - 1)); return; }
      moveCell(i, up);
      return;
    }
    // Blocked above — drift sideways occasionally so flame licks around obstacles.
    if (rng() < 0.4) {
      const dd = rng() < 0.5 ? -1 : 1;
      const nx = x + dd;
      if (nx >= 0 && nx < GW && cell[idx(nx, y)] === EMPTY) { moveCell(i, idx(nx, y)); }
    }
  }
};

// GAS (smoke / steam) — rise & wander, fade out when life runs down. Smoke is
// STRONGLY buoyant so it lifts up and out of the chamber as a rising plume rather
// than pooling into a muddy haze in the lower corners; lateral diffusion is gated
// so a slow / old wisp drifts sideways far less than a fresh, hot one (keeping the
// plume a tidy column and the floor clean). Steam rises faster and dies sooner.
const stepGas = (x: number, y: number, i: number, mat: number): void => {
  if (life[i] <= 1) { cell[i] = EMPTY; life[i] = 0; return; }
  life[i]--;
  const buoyant = mat === STEAM ? 0.9 : 0.82;
  if (y > 0 && rng() < buoyant) {
    const up = i - GW;
    if (cell[up] === EMPTY) { moveCell(i, up); return; }
    const dd = rng() < 0.5 ? -1 : 1;
    const nx = x + dd;
    if (nx >= 0 && nx < GW && cell[idx(nx, y - 1)] === EMPTY) { moveCell(i, idx(nx, y - 1)); return; }
  }
  // Lateral diffusion — only while the wisp is still young/energetic, so a fading
  // plume narrows and clears instead of smearing along the floor.
  const lively = mat === STEAM || life[i] > 26;
  if (lively && rng() < 0.34) {
    const dd = rng() < 0.5 ? -1 : 1;
    const nx = x + dd;
    if (nx >= 0 && nx < GW && cell[idx(nx, y)] === EMPTY) moveCell(i, idx(nx, y));
  }
};

// PLANT — static, but grows a tendril into an adjacent WATER cell (drinking it),
// and is flammable (handled by FIRE/LAVA). Growth is rare per frame so vines creep.
const stepPlant = (x: number, y: number, i: number): void => {
  if (rng() > 0.06) return; // slow growth
  // Pick a random 4-neighbour that is water; convert it to plant.
  const dir = (rng() * 4) | 0;
  let nx = x;
  let ny = y;
  if (dir === 0) ny = y - 1; else if (dir === 1) ny = y + 1; else if (dir === 2) nx = x - 1; else nx = x + 1;
  if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) return;
  const j = idx(nx, ny);
  if (cell[j] === WATER) {
    cell[j] = PLANT;
    sx[j] = sx[i];
    sy[j] = sy[i];
    moved[j] = stamp;
  }
};

// ── Painting ───────────────────────────────────────────────────────────────────
// Round brush; liquids/sand/fire only land in open cells (so you can't overwrite
// solid built structures); wall/stone/plant overwrite anything (you're building).
const paint = (cx: number, cy: number, r: number, mat: number, density: number): void => {
  const r2 = r * r;
  const x0 = Math.max(0, (cx - r) | 0);
  const x1 = Math.min(GW - 1, (cx + r) | 0);
  const y0 = Math.max(0, (cy - r) | 0);
  const y1 = Math.min(GH - 1, (cy + r) | 0);
  const overwrite = mat === WALL || mat === STONE || mat === PLANT || mat === EMPTY;
  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      if (dx * dx + dy * dy > r2) continue;
      if (rng() > density) continue;
      const i = idx(x, y);
      if (cell[i] === WALL && mat !== EMPTY && mat !== WALL) continue; // floor protected
      if (!overwrite && cell[i] !== EMPTY) {
        // Sand/fire can fall into liquids; let liquids replace each other lightly.
        if (!(isLiquid(cell[i]) && (mat === SAND || mat === FIRE))) continue;
      }
      setCell(x, y, mat, x, y);
    }
  }
};

// A thin vertical pour stream (used by attract and natural for streams).
const pour = (cx: number, topY: number, r: number, mat: number, density: number): void => {
  paint(cx, topY, r, mat, density);
};

// ── Attract mode: a scripted, looping performance driven purely by `time` ──────
// A tight ~16s show choreographed so that EVERY material — including the emissive
// lava vent and oil-fire — is already on screen and active within the first few
// seconds (so a CAPTURE_T≈5 grab lands on a full, lit frame). Lanes run in parallel
// across the width: a LAVA vent on the left, SAND dunes centre-left, a WATER fall
// centre that pools and runs toward the lava (→ stone + steam), and an OIL slick on
// the right that FIRE keeps re-igniting. Stream x-positions sweep on sin so the
// frame is always evolving. All positions/times are deterministic → captures repeat.
const ATTRACT_LOOP = 16;
let lastAttractClear = -2;

const attract = (time: number): void => {
  const lp = time % ATTRACT_LOOP;
  const loopIndex = Math.floor(time / ATTRACT_LOOP);
  // Soft reset near the start of each NEW loop so piles don't grow forever. Loop 0
  // is skipped so the launch seed-scene survives until the first natural reset. The
  // stone terrain (ledges/basin) is re-laid right after a clear so it always frames
  // the scene.
  if (loopIndex >= 1 && loopIndex !== lastAttractClear && lp < 0.06) {
    clearWorld();
    buildTerrain();
    lastAttractClear = loopIndex;
  }
  const W = GW;
  const wob = (f: number, ph: number, amp: number): number => Math.sin(time * f + ph) * amp;

  // LAVA vent — pours onto a mid-height stone LEDGE on the left so it pools and then
  // SPILLS off the lip as a glowing cascade (a molten body, not a thin free-fall).
  if (lp >= 0.2 && lp < 13) {
    pour(((0.12 * W) + wob(0.7, 0, W * 0.025)) | 0, (GH * 0.30) | 0, 2.7, LAVA, 0.92);
  }
  // SAND — two WELL-SEPARATED fat streams that build a broad, layered BANK across
  // the lower-centre (not a single thin spire). Each sweeps on its own phase so the
  // landing points roam and the pile grows as a heaped dune, shifting shape over the
  // loop. Kept apart in x so they merge into a wide bank rather than one tall pillar.
  if (lp >= 0 && lp < 11) {
    pour(((0.33 * W) + wob(0.5, 0, W * 0.11)) | 0, 1, 3.0, SAND, 0.9);
    pour(((0.56 * W) + wob(0.8, 2.3, W * 0.12)) | 0, 1, 2.7, SAND, 0.88);
  }
  // WATER fall — a tall central cascade onto the sand; pools, finds its level, runs
  // left toward the lava ledge (→ stone + a hiss of steam) and right into the oil.
  // Wider so it forms a readable pool with a real surface, not a thin trickle.
  if (lp >= 0.8 && lp < 12) {
    pour(((0.50 * W) + wob(0.85, 1.0, W * 0.11)) | 0, 1, 3.0, WATER, 0.9);
  }
  // OIL slick — right third, on a low stone shelf so it spreads into a thin film.
  if (lp >= 1.2 && lp < 12) {
    pour(((0.80 * W) + wob(0.6, 0.4, W * 0.05)) | 0, (GH * 0.60) | 0, 3.0, OIL, 0.82);
  }
  // FIRE — dripped onto the oil from ~2.0s, pulsed so tongues climb and smoke rises.
  if (lp >= 2.0 && lp < 13 && Math.sin(time * 7) > 0) {
    pour(((0.80 * W) + wob(0.9, 0, W * 0.10)) | 0, (GH * 0.5) | 0, 2.1, FIRE, 1.0);
  }
  // PLANT — seeds at the waterline so vines creep through the pool over the loop.
  if (lp >= 2.6 && lp < 2.8) {
    paint(((0.62 * W)) | 0, (GH * 0.78) | 0, 1.6, PLANT, 1.0);
  }
};

// Stone terrain that frames every attract loop: a mid-left LEDGE the lava vents
// onto (so it pools and spills), and a low-right SHELF for the oil slick + fire.
const buildTerrain = (): void => {
  const W = GW;
  // Place a stone cell AND seed its grain-grit spawn coord so basalt is speckled
  // (not a flat slab) under the render's hash2 texture.
  const stone = (x: number, y: number): void => {
    const i = idx(x, y);
    cell[i] = STONE;
    sx[i] = x;
    sy[i] = y;
  };
  // Left ledge — a stone OUTCROP (a thick platform on a support column) the lava
  // pours onto. A tall lip on the outer (right) edge dams the lava into a DEEP
  // glowing pool that brims over and cascades down the cliff face.
  const ledgeY = (GH * 0.42) | 0;
  const lx0 = (0.04 * W) | 0;
  const lx1 = (0.22 * W) | 0;
  for (let x = lx0; x <= lx1; x++) {
    for (let yy = ledgeY; yy <= ledgeY + 4; yy++) stone(x, yy); // platform slab
    if (x >= lx1 - 2) for (let yy = ledgeY - 5; yy < ledgeY; yy++) stone(x, yy); // tall dam lip
    if (x <= lx0 + 4) for (let yy = ledgeY + 5; yy < GH - 1; yy++) stone(x, yy); // support column
  }
  // Right shelf — a stone bench (platform + short leg) that catches the oil slick.
  const shelfY = (GH * 0.74) | 0;
  const bx0 = (0.7 * W) | 0;
  const bx1 = (0.9 * W) | 0;
  for (let x = bx0; x <= bx1; x++) {
    for (let yy = shelfY; yy <= shelfY + 3; yy++) stone(x, yy);
    if (x <= bx0 + 2) for (let yy = shelfY - 4; yy < shelfY; yy++) stone(x, yy); // back lip
  }
};

// A substantial starting scene so the launch frame (t=0) already reads as a living
// sandbox: a settled sand dune, a water pool beside it, an oil slick that's already
// on fire (emissive flames + smoke), and a glowing lava pool. A handful of pre-roll
// update() steps let it settle so the very first painted frame looks physical, not
// like fresh paint floating in mid-air.
const seedScene = (): void => {
  const W = GW;
  const floor = GH - 2;
  buildTerrain();
  const ledgeY = (GH * 0.42) | 0;
  const shelfY = (GH * 0.74) | 0;
  // A thin SEDIMENT layer of settled sand drifted across the whole cellar floor, so the
  // chamber reads as one continuous landscape grounded on a beach rather than a few
  // isolated islands floating over black. It rises a touch under the central dune and
  // dips into the water basin, with a gently uneven crest from a hashed wobble so the
  // line never reads as a flat ruled edge.
  for (let x = 1; x < W - 1; x++) {
    const lump = (hash2(x * 5, 3) + hash2((x >> 2) * 11, 7)) * 0.5; // smooth-ish ripple 0..1
    const base = 1 + (lump * 2.4 | 0);
    for (let h = 0; h < base; h++) paint(x, floor - h, 0.7, SAND, 0.96);
  }
  // A broad, heaped sand BANK across the centre, taller and wider than before so the
  // opening frame reads as a substantial body of material rather than a thin mound.
  for (let dx = -24; dx <= 24; dx++) {
    const hgt = Math.round(16 * Math.exp(-(dx * dx) / 185));
    for (let h = 0; h <= hgt; h++) paint(((0.45 * W) | 0) + dx, floor - h, 1, SAND, 0.97);
  }
  // A real water POOL nestled in the dip to the right of the dune — a broad body with
  // a flat surface, not a thin column, so it reads with depth and a glinting sheet. A
  // gently dished basin (deeper in the middle) gives the sheet a clear top line that the
  // surface specular rides, so the launch frame already shows legible, lit water.
  for (let dx = -9; dx <= 9; dx++) {
    const wh = 8 - ((dx * dx) / 16 | 0);
    for (let h = 0; h < wh; h++) paint(((0.62 * W) | 0) + dx, floor - h, 1, WATER, 0.94);
  }
  // A glowing lava pool already brimming in the dammed left ledge (a DEEP pool that
  // spills, not a stream), so the emissive bloom is rich on the opening frame. The pool
  // is filled wide-and-deep and a continuous molten tongue is already spilling over the
  // lip and down the cliff so the left third reads as a fully-developed vent — the warm
  // light pool is at peak from the very first frame, not still filling in.
  for (let dx = -3; dx <= 5; dx++) {
    for (let h = 0; h < 10 - (Math.abs(dx) >> 1); h++) paint(((0.13 * W) | 0) + dx, ledgeY - 1 - h, 1, LAVA, 0.98);
  }
  // An established cascade already running the full cliff face into a pool at the base.
  for (let h = 0; h < 9; h++) paint(((0.18 * W) | 0), ledgeY + 2 + h, 1, LAVA, 0.96);
  for (let dx = -2; dx <= 2; dx++) {
    for (let h = 0; h < 4 + (2 - Math.abs(dx)); h++) paint(((0.17 * W) | 0) + dx, floor - h, 1, LAVA, 0.95);
  }
  // Oil slick on the right shelf, broad and already alight (emissive flames + smoke
  // at t=0) so the right third is a living fire, not a few stray embers.
  for (let dx = -6; dx <= 6; dx++) paint(((0.80 * W) | 0) + dx, shelfY - 1, 1, OIL, 0.9);
  paint((0.80 * W) | 0, shelfY - 4, 4, FIRE, 1.0);
  paint(((0.74 * W) | 0), shelfY - 3, 2, FIRE, 1.0);
  // Plant sprigs by the water.
  paint((0.64 * W) | 0, floor - 1, 1, PLANT, 1.0);
  paint((0.66 * W) | 0, floor - 2, 1, PLANT, 1.0);
  // Pre-roll so grains settle and the scene reads as physical at t=0. A longer settle
  // lets the lava cascade fully establish and a real smoke COLUMN climb mid-frame, so
  // the launch frame already carries the atmospheric haze later frames have.
  for (let k = 0; k < 56; k++) {
    update();
    // Keep the oil fire fed throughout the settle so a continuous plume rises (rather
    // than a single puff that has already cleared by the time we capture t=0).
    if (k >= 20 && (k & 3) === 0) {
      paint((0.80 * W) | 0, shelfY - 4, 3, FIRE, 1.0);
      paint(((0.74 * W) | 0), shelfY - 3, 2, FIRE, 1.0);
    }
  }
  // Re-light the oil after settling so flames are active on the opening frame, then
  // step a few more frames so the tongues actually CLIMB and the smoke plume is already
  // mid-rise — the right third reads as a living fire, not a fresh ignition.
  paint((0.80 * W) | 0, shelfY - 4, 4, FIRE, 1.0);
  paint(((0.74 * W) | 0), shelfY - 3, 2, FIRE, 1.0);
  for (let k = 0; k < 7; k++) update();
  paint((0.80 * W) | 0, shelfY - 4, 3, FIRE, 1.0); // top up so flames stay alive at t=0
};

// ── Render ─────────────────────────────────────────────────────────────────────
// Each material has a base colour, modulated by a stable per-grain hash (grit) and,
// for fire/lava, a time/life-driven heat that also writes the HDR light buffer for
// bloom. Liquids alpha-blend over the background so depth and translucency read.
type RGB = [number, number, number];

// Base linear-ish colours (0..255-ish; emitters exceed for HDR before tonemap).
const COL_SAND_A: RGB = [150, 110, 70]; // shadowed grain (cool-leaning ochre — sits in fill light)
const COL_SAND_B: RGB = [238, 206, 142]; // sun-lit grain (warm golden crest, less acid-yellow)
const COL_WATER_SHAL: RGB = [86, 196, 240]; // bright turquoise near the surface
const COL_WATER_DEEP: RGB = [10, 40, 110]; // dark blue in the depths
const COL_OIL_A: RGB = [40, 34, 30]; // base dark slick
const COL_OIL_B: RGB = [78, 60, 44]; // lit film
const COL_STONE_A: RGB = [62, 64, 76]; // shadowed basalt
const COL_STONE_B: RGB = [142, 144, 158]; // lit basalt speckle
const COL_WALL: RGB = [40, 42, 50];
const COL_PLANT_A: RGB = [34, 124, 46];
const COL_PLANT_B: RGB = [128, 230, 116];
// Atmospheric void: a cool indigo top fading to a faintly warm cellar floor, so the
// scene sits in a graded chamber instead of dead black. The wide warm bloom pool
// lifts this further wherever an emitter is near.
const BG_TOP: RGB = [9, 11, 21];
const BG_BOT: RGB = [27, 20, 27];

// Smooth-ish 3-stop blackbody ramp for fire/lava heat (t 0..1, cool→white-hot).
// Returns an unclamped HDR-ish RGB so the core can bloom past white.
const blackbody = (t: number, out: RGB): void => {
  // 0 = dull ember red, 0.5 = orange, 1 = white/blue-white hot.
  const r = 0.35 + 1.05 * t;
  const g = t < 0.45 ? 0.06 + 0.55 * (t / 0.45) : 0.55 + 0.55 * ((t - 0.45) / 0.55);
  const b = t < 0.6 ? 0.02 * t : 0.05 + 0.85 * ((t - 0.6) / 0.4);
  out[0] = r;
  out[1] = g;
  out[2] = b;
};
const bbTmp: RGB = [0, 0, 0];

const render = (t: Term, time: number): void => {
  const buf = t.buf;
  const W = t.W;
  const H = t.H;
  const N = W * H;
  light.fill(0);

  // Flicker phase for fire (deterministic, time-derived).
  const flick = time * 16;
  const tw = (time * 6) | 0; // quantised time for the water ripple hash

  // Pass A — per column, find the topmost WATER cell so water can be shaded by how
  // deep below its own surface it lies (gives liquids real volume & translucency).
  for (let x = 0; x < W; x++) {
    let top = GH; // sentinel = no water in this column
    for (let y = 0; y < H; y++) {
      if (cell[y * W + x] === WATER) { top = y; break; }
    }
    waterTop[x] = top;
  }

  for (let y = 0; y < H; y++) {
    const row = y * W;
    // Sky/void vertical gradient behind everything.
    const vt = y / (H - 1);
    const bgR = BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * vt;
    const bgG = BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * vt;
    const bgB = BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * vt;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      const m = cell[i];
      let r = bgR;
      let g = bgG;
      let b = bgB;
      if (m !== EMPTY) {
        const h = hash2(sx[i] * 131 + 7, sy[i] * 197 + 13); // stable grain grit 0..1
        switch (m) {
          case SAND: {
            // Grain grit + a cheap fake-AO: a grain with EMPTY directly above it is a
            // lit crest (brighter); one buried under more sand is shadowed (darker).
            const lit = y > 0 && cell[i - W] === EMPTY ? 1.12 : 0.9;
            const j = h * lit;
            r = COL_SAND_A[0] + (COL_SAND_B[0] - COL_SAND_A[0]) * j;
            g = COL_SAND_A[1] + (COL_SAND_B[1] - COL_SAND_A[1]) * j;
            b = COL_SAND_A[2] + (COL_SAND_B[2] - COL_SAND_A[2]) * j;
            break;
          }
          case WATER: {
            // Depth-shaded translucency: blend a turquoise→deep-blue ramp (by depth
            // below this column's surface) over the background. A bright moving
            // specular glint rides the top band of the body and a faint caustic
            // shimmer ripples through the volume, so the surface reads as a living
            // rippling sheet rather than a flat slab.
            const d = y - waterTop[x];
            const depth = clamp01(d / 22);
            const surface = d <= 1;
            let wr = COL_WATER_SHAL[0] + (COL_WATER_DEEP[0] - COL_WATER_SHAL[0]) * depth;
            let wg = COL_WATER_SHAL[1] + (COL_WATER_DEEP[1] - COL_WATER_SHAL[1]) * depth;
            let wb = COL_WATER_SHAL[2] + (COL_WATER_DEEP[2] - COL_WATER_SHAL[2]) * depth;
            // Caustic shimmer — a slow travelling bright/dark band through the body.
            const caus = 0.86 + 0.3 * hash2((x + tw) * 7, (y - (tw >> 1)) * 11);
            wr *= caus; wg *= caus; wb *= caus;
            if (surface) {
              // The exposed top skin gets a crisp, sculpted specular: a smooth
              // travelling sine highlight (the steady sheen of a settled sheet) plus a
              // finer hashed sparkle. The exposed surface (open air above) gets the
              // full glint; a submerged "surface" cell only a soft sub-surface sheen.
              const exposed = y > 0 && cell[i - W] === EMPTY ? 1 : 0.32;
              const wave = 0.5 + 0.5 * Math.sin((x + tw) * 0.55 + waterTop[x] * 0.3);
              const spark = hash2(x * 13 + tw, 7);
              const glint = (0.28 + 0.5 * wave + 0.34 * spark) * exposed;
              wr += 78 * glint; wg += 104 * glint; wb += 130 * glint;
            }
            // Opaque enough at the surface that even a one-cell-thick sheet reads as
            // water; the body deepens toward translucent as it thins below.
            const a = surface ? 0.9 : 0.74 + 0.16 * (1 - depth);
            r = bgR * (1 - a) + wr * a;
            g = bgG * (1 - a) + wg * a;
            b = bgB * (1 - a) + wb * a;
            break;
          }
          case OIL: {
            // Dark, near-opaque slick with an iridescent sheen that shifts with the
            // grain hash AND a bright surface-film highlight on the top skin, so the
            // slick reads as a glossy oily film catching light, not a flat brown smear.
            const a = 0.93;
            const skin = y > 0 && cell[i - W] === EMPTY ? 1 : 0;
            const sheen = h;
            let or0 = COL_OIL_A[0] + (COL_OIL_B[0] - COL_OIL_A[0]) * sheen + sheen * 22;
            let og0 = COL_OIL_A[1] + (COL_OIL_B[1] - COL_OIL_A[1]) * sheen + sheen * sheen * 26;
            let ob0 = COL_OIL_A[2] + (COL_OIL_B[2] - COL_OIL_A[2]) * sheen + sheen * 70;
            if (skin) { or0 += 18; og0 += 22; ob0 += 46; } // rainbow film on the skin
            r = bgR * (1 - a) + or0 * a;
            g = bgG * (1 - a) + og0 * a;
            b = bgB * (1 - a) + ob0 * a;
            break;
          }
          case LAVA: {
            // Emissive molten rock: an ORANGE-dominated blackbody (capped below white
            // so it reads as glowing magma, not flame). A slow convecting pulse and a
            // darker basalt CRUST where a solid sits on top give it a viscous, skinned
            // surface. Writes the HDR light buffer (warm, scene-illuminating).
            const crust = y > 0 && cell[i - W] !== EMPTY && cell[i - W] !== LAVA ? 0.42 : 0;
            const pulse = 0.5 + 0.5 * Math.sin(flick * 0.32 + x * 0.3 + y * 0.5);
            const heat = clamp01(0.34 + 0.26 * h + 0.18 * pulse - crust); // capped ~0.78
            blackbody(heat, bbTmp);
            const e = 1.5 + 0.55 * heat; // emissive scale
            r = bbTmp[0] * 255 * e;
            g = bbTmp[1] * 255 * e * 0.92;
            b = bbTmp[2] * 255 * e * 0.6;
            light[i] += (1.3 + 1.1 * heat) * (0.55 + 0.45 * pulse);
            break;
          }
          case FIRE: {
            // Blackbody flame: hot blue-white at the base of a tongue, cooling to a
            // smoky orange-red tip as life runs down + with a per-cell flicker.
            const lf = clamp01(life[i] / 60);
            const fl = 0.5 + 0.5 * hash2(x * 3 + (flick | 0), y * 5 + (flick * 0.5 | 0));
            const heat = clamp01(0.42 + 0.6 * lf) * (0.7 + 0.4 * fl);
            blackbody(heat, bbTmp);
            const e = 1.3 + 1.3 * heat;
            r = bbTmp[0] * 255 * e;
            g = bbTmp[1] * 255 * e;
            b = bbTmp[2] * 255 * e;
            light[i] += (1.3 + 2.0 * heat) * (0.6 + 0.4 * fl);
            break;
          }
          case SMOKE: {
            // Warm SOOT that cools to a thin neutral grey as it fades — never the
            // muddy blue-grey that used to settle low. Opacity tracks life and is
            // kept modest so smoke reads as airy haze the firelight tints, not a
            // flat speckled smear. A faint warm bias (r>g>b) keeps it lit, not dead.
            const lf = clamp01(life[i] / 98);
            const a = (0.16 + 0.32 * lf) * (0.7 + 0.3 * h);
            const tone = 52 + h * 30 + lf * 26; // hotter, paler when fresh
            const sr = tone * 1.06;
            const sg = tone * 0.98;
            const sb = tone * 0.9;
            r = bgR * (1 - a) + sr * a;
            g = bgG * (1 - a) + sg * a;
            b = bgB * (1 - a) + sb * a;
            break;
          }
          case STEAM: {
            const a = clamp01(life[i] / 50) * 0.72;
            const sm = 186 + h * 60;
            r = bgR * (1 - a) + sm * a;
            g = bgG * (1 - a) + sm * a;
            b = bgB * (1 - a) + sm * a;
            break;
          }
          case STONE: {
            // Speckled basalt with a thin lit top edge where it meets open air.
            const lit = y > 0 && cell[i - W] === EMPTY ? 1.18 : 1;
            const j = h;
            r = (COL_STONE_A[0] + (COL_STONE_B[0] - COL_STONE_A[0]) * j) * lit;
            g = (COL_STONE_A[1] + (COL_STONE_B[1] - COL_STONE_A[1]) * j) * lit;
            b = (COL_STONE_A[2] + (COL_STONE_B[2] - COL_STONE_A[2]) * j) * lit;
            break;
          }
          case WALL: {
            const j = h * 0.5;
            r = COL_WALL[0] + j * 14;
            g = COL_WALL[1] + j * 14;
            b = COL_WALL[2] + j * 16;
            break;
          }
          case PLANT: {
            // Foliage with a lit/shadow split + the brightest highlight on the tips.
            const lit = y > 0 && cell[i - W] === EMPTY ? 1.15 : 0.85;
            const j = clamp01(h * lit);
            r = COL_PLANT_A[0] + (COL_PLANT_B[0] - COL_PLANT_A[0]) * j;
            g = COL_PLANT_A[1] + (COL_PLANT_B[1] - COL_PLANT_A[1]) * j;
            b = COL_PLANT_A[2] + (COL_PLANT_B[2] - COL_PLANT_A[2]) * j;
            break;
          }
        }
      }
      const o = i * 3;
      buf[o] = r;
      buf[o + 1] = g;
      buf[o + 2] = b;
    }
  }

  // Separable box-ish bloom of the emissive light buffer → additive HDR glow.
  bloomAndComposite(t, N);

  // A sparse, slow-drifting ember layer breathes life into the upper void without
  // touching the simulation (purely time-derived, deterministic, additive).
  drawEmbers(t, time);
};

// ── Drifting embers ──────────────────────────────────────────────────────────────
// A handful of warm sparks rise through the empty air above the scene, swaying on a
// slow sine and twinkling, then wrap around at the top — so the chamber's headroom
// reads as a living, lit space rather than dead black. Each ember is a deterministic
// function of its index and `time` (no state, no RNG), drawn additively ONLY over
// void/gas so it never paints over solid material. Negligible cost (≈48 points).
const EMBER_N = 56;
const drawEmbers = (t: Term, time: number): void => {
  const W = t.W;
  const H = t.H;
  for (let k = 0; k < EMBER_N; k++) {
    // Per-ember stable parameters from a hash of its index.
    const hx = hash2(k * 53 + 11, 7);
    const hy = hash2(k * 97 + 23, 31);
    const hr = hash2(k * 131 + 5, 53);
    const rise = 4 + hr * 9; // px/sec upward drift
    const swayA = 1.5 + hy * 5.0; // horizontal sway amplitude
    const swayF = 0.4 + hx * 0.9; // sway frequency
    // Slow upward travel, wrapping over the full height; embers cluster in the upper
    // two-thirds where the void lives.
    const baseY = (hy * H) % H;
    const y = (baseY - time * rise) % H;
    const yy = (y < 0 ? y + H : y) * 0.66; // confine to upper region
    const x = hx * W + Math.sin(time * swayF + k) * swayA;
    const xi = x | 0;
    const yi = yy | 0;
    if (xi < 0 || yi < 0 || xi >= W || yi >= H) continue;
    const m = cell[yi * W + xi];
    if (m !== EMPTY && m !== SMOKE && m !== STEAM) continue; // float only in the air
    // Twinkle: a per-ember flicker so the field shimmers.
    const tw = 0.32 + 0.68 * (0.5 + 0.5 * Math.sin(time * (2.0 + hr * 3.0) + k * 1.7));
    const fade = clamp01(1 - yi / (H * 0.62)); // dimmer toward the top edge
    const e = 40 * tw * (0.4 + 0.6 * fade);
    // Warm spark with a tiny vertical halo so it reads as a glowing mote, not a lone
    // hot pixel. Some embers skew yellow-white (hotter), some deep orange.
    const warm = 0.5 + 0.5 * hr;
    t.addPixel(xi, yi, e, e * (0.5 + 0.22 * warm), e * (0.18 + 0.14 * warm));
    // A faint vertical halo, only into adjacent AIR, so the spark reads as a glowing
    // mote without smudging warm dots onto solid material.
    const eh = e * 0.4;
    if (yi > 0 && isAir(cell[(yi - 1) * W + xi])) t.addPixel(xi, yi - 1, eh, eh * 0.55, eh * 0.22);
    if (yi < H - 1 && isAir(cell[(yi + 1) * W + xi])) t.addPixel(xi, yi + 1, eh, eh * 0.55, eh * 0.22);
  }
};
const isAir = (m: number): boolean => m === EMPTY || m === SMOKE || m === STEAM;

// Two scales of warm glow are bled from the emissive `light` buffer and composited
// additively, then ACES-tonemapped so the fire/lava cores stay hot while the bleed
// is rich, not clipped:
//   TIGHT — a full-res 5-tap separable blur (the near-core halo).
//   WIDE  — a half-res 5-tap separable blur (a soft warm LIGHT POOL that reaches far
//           across the scene, so emitters actually illuminate nearby sand/water).
// Cheap O(W·H + (W·H)/4) and allocation-free.
const bloomAndComposite = (t: Term, N: number): void => {
  const W = t.W;
  const H = t.H;
  const buf = t.buf;
  // — TIGHT bloom: horizontal (light → bloomA), 5-tap —
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const c = light[row + x];
      const l1 = light[row + (x > 0 ? x - 1 : x)];
      const r1 = light[row + (x < W - 1 ? x + 1 : x)];
      const l2 = light[row + (x > 1 ? x - 2 : 0)];
      const r2 = light[row + (x < W - 2 ? x + 2 : W - 1)];
      bloomA[row + x] = c * 0.34 + (l1 + r1) * 0.22 + (l2 + r2) * 0.11;
    }
  }
  // — TIGHT bloom: vertical (bloomA → bloomB), 5-tap —
  for (let y = 0; y < H; y++) {
    const row = y * W;
    const up1 = (y > 0 ? y - 1 : y) * W;
    const dn1 = (y < H - 1 ? y + 1 : y) * W;
    const up2 = (y > 1 ? y - 2 : 0) * W;
    const dn2 = (y < H - 2 ? y + 2 : H - 1) * W;
    for (let x = 0; x < W; x++) {
      const c = bloomA[row + x];
      bloomB[row + x] =
        c * 0.34 + (bloomA[up1 + x] + bloomA[dn1 + x]) * 0.22 + (bloomA[up2 + x] + bloomA[dn2 + x]) * 0.11;
    }
  }
  // — WIDE bloom: downsample light → wideA (2×2 average) —
  for (let hy = 0; hy < HH; hy++) {
    const sy0 = hy * 2;
    const sy1 = sy0 + 1 < H ? sy0 + 1 : sy0;
    const hrow = hy * HW;
    const r0 = sy0 * W;
    const r1 = sy1 * W;
    for (let hx = 0; hx < HW; hx++) {
      const sx0 = hx * 2;
      const sx1 = sx0 + 1 < W ? sx0 + 1 : sx0;
      wideA[hrow + hx] = (light[r0 + sx0] + light[r0 + sx1] + light[r1 + sx0] + light[r1 + sx1]) * 0.25;
    }
  }
  // — WIDE bloom: horizontal 5-tap (wideA → wideB) —
  for (let hy = 0; hy < HH; hy++) {
    const hrow = hy * HW;
    for (let hx = 0; hx < HW; hx++) {
      const c = wideA[hrow + hx];
      const l1 = wideA[hrow + (hx > 0 ? hx - 1 : hx)];
      const r1 = wideA[hrow + (hx < HW - 1 ? hx + 1 : hx)];
      const l2 = wideA[hrow + (hx > 1 ? hx - 2 : 0)];
      const r2 = wideA[hrow + (hx < HW - 2 ? hx + 2 : HW - 1)];
      wideB[hrow + hx] = c * 0.3 + (l1 + r1) * 0.22 + (l2 + r2) * 0.13;
    }
  }
  // — WIDE bloom: vertical 5-tap (wideB → wideA), back into wideA —
  for (let hy = 0; hy < HH; hy++) {
    const hrow = hy * HW;
    const u1 = (hy > 0 ? hy - 1 : hy) * HW;
    const d1 = (hy < HH - 1 ? hy + 1 : hy) * HW;
    const u2 = (hy > 1 ? hy - 2 : 0) * HW;
    const d2 = (hy < HH - 2 ? hy + 2 : HH - 1) * HW;
    for (let hx = 0; hx < HW; hx++) {
      const c = wideB[hrow + hx];
      wideA[hrow + hx] = c * 0.3 + (wideB[u1 + hx] + wideB[d1 + hx]) * 0.22 + (wideB[u2 + hx] + wideB[d2 + hx]) * 0.13;
    }
  }
  // Composite: tight halo + the upsampled wide pool, ACES-tonemapped everywhere so
  // the warm light pool also lifts the dark surroundings into a lit scene.
  for (let y = 0; y < H; y++) {
    const row = y * W;
    const hrow = (y >> 1) * HW;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      const wide = wideA[hrow + (x >> 1)];
      // The wide pool reaches further and warmer so emitters genuinely ILLUMINATE
      // the surrounding sand/water/stone — the scene sits in a pool of firelight
      // rather than floating in black. The tight halo keeps the cores crisp.
      const gl = bloomB[i] + light[i] * 0.5 + wide * 1.15;
      const o = i * 3;
      if (gl <= 0.0015) {
        const r = buf[o]; const g = buf[o + 1]; const b = buf[o + 2];
        buf[o] = r > 255 ? 255 : r;
        buf[o + 1] = g > 255 ? 255 : g;
        buf[o + 2] = b > 255 ? 255 : b;
        continue;
      }
      // Linearise the base, add the warm (orange-biased) glow, tonemap.
      const lr = buf[o] / 255 + gl * 1.0;
      const lg = buf[o + 1] / 255 + gl * 0.52;
      const lb = buf[o + 2] / 255 + gl * 0.2;
      buf[o] = (aces(lr) * 255) | 0;
      buf[o + 1] = (aces(lg) * 255) | 0;
      buf[o + 2] = (aces(lb) * 255) | 0;
    }
  }
};

// ── Interaction state ───────────────────────────────────────────────────────────
let curMat = SAND;
let brush = 4;
let lastInputTime = -1e9; // sim-time of the last user interaction
let sawKey = false;
let prevMouseX = -1;
let prevMouseY = -1;

const IDLE_BEFORE_ATTRACT = 3; // seconds of no input before attract resumes

runDemo({
  title: 'Powder',
  hud: '1-8 MATERIAL  -  DRAG TO PAINT  -  WHEEL BRUSH  -  C CLEAR',
  captureT: 5,
  mouse: true,
  targetFps: 60,
  init: (t) => {
    allocate(t.W, t.H);
    seedScene();
    curMat = SAND;
    brush = 4;
    lastInputTime = -1e9;
    sawKey = false;
    lastAttractClear = 0;
    prevMouseX = -1;
    prevMouseY = -1;
  },
  resize: (t) => {
    allocate(t.W, t.H);
    seedScene();
    lastAttractClear = 0;
  },
  onKey: (key, _t) => {
    sawKey = true; // refresh the idle clock in `frame` (onKey has no sim clock)
    if (key === 'c') { clearWorld(); return; }
    const n = parseInt(key, 10);
    if (Number.isFinite(n) && n >= 1 && n <= PALETTE.length) curMat = PALETTE[n - 1].id;
  },
  frame: (t, time, dt) => {
    if (GW !== t.W || GH !== t.H) allocate(t.W, t.H);

    // Wheel → brush size (read AND reset).
    if (t.wheel !== 0) {
      brush = clamp(brush + t.wheel, 1, 24) | 0;
      t.wheel = 0;
      lastInputTime = time;
    }
    // Track interaction. onKey can't see `time`, so any mouse activity or a pending
    // key flag refreshes the idle clock here.
    if (t.mouseActive && (t.mouseSeq !== 0)) {
      if (t.mouseX !== prevMouseX || t.mouseY !== prevMouseY || t.mouseDown) lastInputTime = time;
      prevMouseX = t.mouseX;
      prevMouseY = t.mouseY;
    }
    if (sawKey) { lastInputTime = time; sawKey = false; }

    const userActive = time - lastInputTime < IDLE_BEFORE_ATTRACT;

    if (userActive) {
      // Live painting.
      if (t.mouseDown && t.mouseInside) {
        const dens = curMat === FIRE ? 1.0 : isLiquid(curMat) ? 0.9 : 0.92;
        paint(t.mouseX, t.mouseY, brush, curMat, dens);
      }
    } else {
      // Attract performance.
      attract(time);
    }

    // Step the world. Sub-step a bit so fast motion still resolves cleanly without
    // doubling the per-grain logic; one update/frame is plenty at 60fps.
    update();

    render(t, time);

    // Brush preview ring + material/brush readout (live only; capture shows attract).
    if (userActive && t.mouseInside) drawBrushRing(t);
    drawSelector(t, userActive);
  },
});

// A thin ring at the cursor showing the current brush radius (live feedback).
const drawBrushRing = (t: Term): void => {
  const cx = t.mouseX;
  const cy = t.mouseY;
  const r = brush;
  const steps = Math.max(16, (r * 4) | 0);
  for (let s = 0; s < steps; s++) {
    const a = (s / steps) * Math.PI * 2;
    const x = (cx + Math.cos(a) * r) | 0;
    const y = (cy + Math.sin(a) * r) | 0;
    t.blendPixel(x, y, 240, 240, 255, 0.65);
  }
};

// A compact material selector strip with the current pick highlighted, drawn into
// the pixel buffer. It is anchored to the TOP-RIGHT but kept BELOW the engine's FPS
// HUD band (which occupies the top ~30px) so the two never collide. In attract mode
// the strip shrinks to a single small "ATTRACT" tag so the cinematic capture frame
// stays clean and uncluttered.
const drawSelector = (t: Term, userActive: boolean): void => {
  const swW = 9;
  const swH = 7;
  const gap = 2;
  if (!userActive) {
    // Minimal, unobtrusive mode tag tucked into the top-right under the HUD band.
    const label = 'ATTRACT';
    const tw = Term.textWidth(label, 1);
    const tx = t.W - tw - 4;
    const ty = 34;
    t.plate(tx - 2, ty - 2, tw + 4, 11, 0.42);
    t.text(tx, ty, label, 235, 170, 120, 1);
    return;
  }
  const total = PALETTE.length * (swW + gap) - gap;
  const x0 = t.W - total - 3;
  const y0 = 34; // below the FPS HUD band
  t.plate(x0 - 2, y0 - 2, total + 4, swH + 6, 0.5);
  for (let k = 0; k < PALETTE.length; k++) {
    const px = x0 + k * (swW + gap);
    const col = swatchColor(PALETTE[k].id);
    const sel = PALETTE[k].id === curMat;
    for (let yy = 0; yy < swH; yy++) {
      for (let xx = 0; xx < swW; xx++) {
        t.setPixel(px + xx, y0 + yy, col[0], col[1], col[2]);
      }
    }
    // Index digit above; bright frame on the selected one.
    t.text(px + 1, y0 - 0, String(k + 1), sel ? 255 : 30, sel ? 255 : 30, sel ? 255 : 40, 1, false);
    if (sel) {
      for (let xx = -1; xx <= swW; xx++) {
        t.setPixel(px + xx, y0 - 1, 255, 240, 120);
        t.setPixel(px + xx, y0 + swH, 255, 240, 120);
      }
      for (let yy = -1; yy <= swH; yy++) {
        t.setPixel(px - 1, y0 + yy, 255, 240, 120);
        t.setPixel(px + swW, y0 + yy, 255, 240, 120);
      }
    }
  }
  // Mode tag.
  const tag = `${PALETTE.find((p) => p.id === curMat)?.name ?? ''}  R${brush}`;
  t.text(x0, y0 + swH + 2, tag, 200, 205, 220, 1);
};

// Representative swatch colour for the selector (mid-tone of each material).
const swatchColor = (m: number): RGB => {
  switch (m) {
    case SAND: return [214, 183, 118];
    case WATER: return [50, 120, 220];
    case OIL: return [70, 58, 50];
    case FIRE: return [255, 150, 40];
    case LAVA: return [255, 110, 24];
    case STONE: return [104, 106, 116];
    case WALL: return [60, 62, 72];
    case PLANT: return [70, 180, 72];
    default: return [40, 40, 50];
  }
};
