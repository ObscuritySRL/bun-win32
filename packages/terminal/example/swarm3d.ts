/**
 * swarm3d — a 3D murmuration. Thousands of starlings folding through a dusk sky.
 *
 * Every agent is a real Reynolds boid steering in true 3D by three urges —
 * SEPARATION (avoid crowding the nearest neighbours), ALIGNMENT (match the local
 * heading) and COHESION (drift toward the local centre of mass) — over a hashed
 * uniform grid so each bird only tests the 27 cells around it and the flock stays
 * O(n) past a few thousand agents. A soft spherical bound keeps the cloud in
 * frame; a slow eased "lure" the flock chases and a quietly breathing predator it
 * shears away from keep the shape forever splitting, sheeting and condensing; and
 * a large-scale curl-noise wind shears the volume so the murmuration tears into
 * ribbons and rolls into a hollow rotating knot the way real starlings do.
 *
 * Rendering is deliberately restrained and built around ONE rule: a bird is a
 * single crisp SPECK, never a blob. Each agent deposits a small, low-energy,
 * sub-pixel-resolved point (its light is bilinearly spread across the four pixels
 * it straddles), so a dense knot reads as thousands of distinct specks and a
 * deepening tone — never a cottony white cloud. Specks are graded hard by depth:
 * near birds are larger, warmer and brighter motes; far birds dissolve to a fine,
 * cool, near-transparent mist. Colour rides a single designed dusk ramp (cool
 * slate for the far mist, warm pale ember for the near cores) — no rainbow — and
 * only the very densest cores bloom softly to pale gold. Behind it: a vertical
 * dusk gradient (deep indigo above, warm band at the horizon), a sparse
 * deterministic starfield, and a soft vignette. A filmic shoulder rolls the
 * brightest cores off to white. Nothing is scripted; every fold is emergent.
 *
 * Technique: spatial-hash boids (separation/alignment/cohesion + soft bound +
 * eased lure/predator + curl-noise wind) · perspective projection · depth-graded
 * sub-pixel speck splats · single-ramp dusk grade · additive bloom · filmic
 * shoulder.
 *
 * Run: bun run packages/all/example/swarm3d.ts
 */
import { Term, run } from '@bun-win32/terminal';

import { clamp, clamp01, lerp, smoothstep, aces, mulberry32, hash2, TAU } from './_kit';

// ── Flock parameters ───────────────────────────────────────────────────────────
const N = 3600; // boids — tuned for >=120 fps full-screen at BENCH
const WORLD = 62; // half-extent of the cubic world
const BOUND_R = WORLD * 0.98; // soft containment radius
const CELL = 5.2; // spatial-hash cell size (~= neighbour radius)
const GRID = (Math.ceil((WORLD * 2) / CELL) + 2) | 0; // cells per axis (+pad)
const GRID2 = GRID * GRID;
const NCELLS = GRID * GRID2;

// Steering weights / radii. Separation runs strong with a generous reach and
// cohesion stays gentle, so the cloud breathes open into filaments and sheets
// rather than collapsing to a ball — that openness is what reads as a real
// murmuration. Alignment is the dominant urge (starlings copy heading first),
// which is what makes a whole sheet turn and shimmer as one body.
const R_SEP = 4.6,
  R_SEP2 = R_SEP * R_SEP;
const R_NEI = CELL,
  R_NEI2 = R_NEI * R_NEI;
const W_SEP = 3.3,
  W_ALI = 1.7,
  W_COH = 0.62,
  W_LURE = 0.2,
  W_PRED = 1.1,
  W_BND = 1.8,
  W_WIND = 0.82;
const MAX_SPEED = 32,
  MIN_SPEED = 18,
  MAX_FORCE = 56;
const R_PRED = 22,
  R_PRED2 = R_PRED * R_PRED; // predator avoidance radius

// ── State (typed arrays, allocated in init) ────────────────────────────────────
let px!: Float32Array, py!: Float32Array, pz!: Float32Array; // positions
let vx!: Float32Array, vy!: Float32Array, vz!: Float32Array; // velocities
let order!: Int32Array; // boid indices sorted by cell (for the grid sweep)
let cellOf!: Int32Array; // cell index per boid
let cellStart!: Int32Array; // first slot in `order` for each cell (-1 = empty)
let cellSize!: Int32Array; // boids per cell (stable across the sweep)
let cellCursor!: Int32Array; // scratch write-cursor for the counting sort

// Screen-space scratch (filled each frame, then painted far→near by depth).
let sx!: Float32Array, sy!: Float32Array, sDepth!: Float32Array;
let sDirX!: Float32Array, sDirY!: Float32Array; // projected heading (for the streak)
let sLen!: Float32Array, sBright!: Float32Array, sWarm!: Float32Array, sSize!: Float32Array;
let sHaze!: Float32Array; // aerial-perspective blend toward the sky tone (far→1)
let zOrder!: Int32Array;

// Starfield (deterministic, screen-fraction space → placed per W/H each frame).
const STARS = 300;
let starX!: Float32Array, starY!: Float32Array, starB!: Float32Array;

function init(t: Term): void {
  const rnd = mulberry32(0xb0_1d_5eed);
  px = new Float32Array(N);
  py = new Float32Array(N);
  pz = new Float32Array(N);
  vx = new Float32Array(N);
  vy = new Float32Array(N);
  vz = new Float32Array(N);
  order = new Int32Array(N);
  cellOf = new Int32Array(N);
  cellStart = new Int32Array(NCELLS);
  cellSize = new Int32Array(NCELLS);
  cellCursor = new Int32Array(NCELLS);
  sx = new Float32Array(N);
  sy = new Float32Array(N);
  sDepth = new Float32Array(N);
  sDirX = new Float32Array(N);
  sDirY = new Float32Array(N);
  sLen = new Float32Array(N);
  sBright = new Float32Array(N);
  sWarm = new Float32Array(N);
  sSize = new Float32Array(N);
  sHaze = new Float32Array(N);
  zOrder = new Int32Array(N);
  bucketCount = new Int32Array(DEPTH_BUCKETS + 1);
  bucketKey = new Int32Array(N);
  sortScratch = new Int32Array(N);

  // Seed the flock as a loose oblate shell with tangential spin so it finds its
  // swirling motion immediately instead of needing seconds to organise.
  for (let i = 0; i < N; i++) {
    const u = rnd() * 2 - 1;
    const phi = rnd() * TAU;
    const r = WORLD * (0.34 + 0.42 * Math.cbrt(rnd()));
    const s = Math.sqrt(1 - u * u);
    const x = r * s * Math.cos(phi),
      y = r * u * 0.65,
      z = r * s * Math.sin(phi);
    px[i] = x;
    py[i] = y;
    pz[i] = z;
    const tx = -z,
      tz = x; // tangent of (x,_,z) about the world Y axis
    const tl = Math.hypot(tx, tz) || 1;
    const sp = lerp(MIN_SPEED, MAX_SPEED, rnd());
    vx[i] = (tx / tl) * sp + (rnd() - 0.5) * 5;
    vy[i] = (rnd() - 0.5) * 6;
    vz[i] = (tz / tl) * sp + (rnd() - 0.5) * 5;
  }

  // Deterministic starfield, upper sky only.
  const srnd = mulberry32(0x57_a4_f1_e1);
  starX = new Float32Array(STARS);
  starY = new Float32Array(STARS);
  starB = new Float32Array(STARS);
  for (let i = 0; i < STARS; i++) {
    starX[i] = srnd();
    starY[i] = srnd() * srnd() * 0.72; // bias toward the very top of the sky
    starB[i] = 0.16 + 0.84 * srnd();
  }
  void t;
}

// Cell coordinate → flat index (positions live in [-WORLD, WORLD]).
function cellIndex(x: number, y: number, z: number): number {
  let cx = ((x + WORLD) / CELL + 1) | 0;
  let cy = ((y + WORLD) / CELL + 1) | 0;
  let cz = ((z + WORLD) / CELL + 1) | 0;
  if (cx < 0) cx = 0;
  else if (cx >= GRID) cx = GRID - 1;
  if (cy < 0) cy = 0;
  else if (cy >= GRID) cy = GRID - 1;
  if (cz < 0) cz = 0;
  else if (cz >= GRID) cz = GRID - 1;
  return (cz * GRID + cy) * GRID + cx;
}

// Build the spatial hash via a counting sort into a contiguous `order` array.
// cellSize keeps the per-cell counts for the neighbour sweep; cellCursor is the
// scratch write head so cellSize is never mutated during the scatter.
function buildGrid(): void {
  cellStart.fill(-1);
  cellSize.fill(0);
  for (let i = 0; i < N; i++) {
    const c = cellIndex(px[i], py[i], pz[i]);
    cellOf[i] = c;
    cellSize[c]++;
  }
  let acc = 0;
  for (let c = 0; c < NCELLS; c++) {
    if (cellSize[c] > 0) {
      cellStart[c] = acc;
      cellCursor[c] = acc;
      acc += cellSize[c];
    }
  }
  for (let i = 0; i < N; i++) {
    const c = cellOf[i];
    order[cellCursor[c]++] = i;
  }
}

// ── Eased attractors ────────────────────────────────────────────────────────────
const lure = new Float32Array(3);
const pred = new Float32Array(3);
function attractors(time: number): void {
  // The lure: a slow two-frequency Lissajous the flock chases — keeps the cloud
  // translating and folding across the volume so the silhouette never settles.
  const a = WORLD * 0.7;
  lure[0] = a * Math.sin(time * 0.21 + 0.4) * Math.cos(time * 0.13 * 0.6);
  lure[1] = a * 0.6 * Math.sin(time * 0.17 * 1.3 + 1.7);
  lure[2] = a * Math.cos(time * 0.19 * 0.8) * Math.sin(time * 0.11 * 1.1 + 0.9);
  // The predator: a second, faster, counter-phase path the flock shears away
  // from — this is what carves the dramatic splits and rolling sheets. It eases
  // in and out of relevance so it never feels mechanical.
  const b = WORLD * 0.8;
  pred[0] = b * Math.cos(time * 0.37 + 2.1) * Math.sin(time * 0.23 + 0.3);
  pred[1] = b * 0.55 * Math.cos(time * 0.29 + 0.7);
  pred[2] = b * Math.sin(time * 0.31 + 1.2) * Math.cos(time * 0.27 + 1.9);
}

// A cheap analytic curl field (divergence-free swirl from sin/cos potentials).
// Sampling on a slow large scale shears the whole volume into ribbons and rolls
// the dense core into a hollow rotating knot — the structural drama of a real
// murmuration that pure local boids alone never quite reach. Tangential by
// construction, so it never inflates or collapses the flock, only twists it.
const wind = new Float32Array(3);
function curlWind(x: number, y: number, z: number, time: number): void {
  const s = 0.052; // spatial scale of the swirl cells
  const tt = time * 0.18;
  const X = x * s,
    Y = y * s,
    Z = z * s;
  // Curl (∇×A) of a pair of staggered swirl potentials. Only the six partials
  // are needed for the flow, so we evaluate exactly those six trig terms — the
  // potentials themselves never appear, keeping this cheap enough per-boid.
  const dAz_dy = -1.3 * Math.sin(Y * 1.3 + tt);
  const dAy_dz = Math.cos(Z + tt * 1.1);
  const dAx_dz = -1.3 * Math.sin(Z * 1.3 - tt * 0.7);
  const dAz_dx = Math.cos(X - tt * 0.9);
  const dAy_dx = -1.3 * Math.sin(X * 1.3 + tt * 0.5);
  const dAx_dy = Math.cos(Y + tt);
  wind[0] = dAz_dy - dAy_dz;
  wind[1] = dAx_dz - dAz_dx;
  wind[2] = dAy_dx - dAx_dy;
}

// ── Simulation step ────────────────────────────────────────────────────────────
function simulate(time: number, dt: number): void {
  if (dt <= 0) return;
  if (dt > 0.04) dt = 0.04; // clamp so a stall can't explode the flock

  buildGrid();
  attractors(time);
  const lx = lure[0],
    ly = lure[1],
    lz = lure[2];
  const prx = pred[0],
    pry = pred[1],
    prz = pred[2];
  // Predator influence and wind both breathe on slow cycles so the flock
  // periodically relaxes into a calm sheet then tears apart again — the rhythm
  // that makes it feel alive.
  const predPulse = W_PRED * (0.45 + 0.55 * smoothstep(0.2, 0.8, 0.5 + 0.5 * Math.sin(time * 0.16)));
  const windPulse = W_WIND * (0.5 + 0.5 * smoothstep(0.15, 0.85, 0.5 + 0.5 * Math.sin(time * 0.097 + 1.3)));

  for (let i = 0; i < N; i++) {
    const x = px[i],
      y = py[i],
      z = pz[i];
    const myvx = vx[i],
      myvy = vy[i],
      myvz = vz[i];

    let sepX = 0,
      sepY = 0,
      sepZ = 0;
    let aliX = 0,
      aliY = 0,
      aliZ = 0,
      aliN = 0;
    let cohX = 0,
      cohY = 0,
      cohZ = 0,
      cohN = 0;

    // Sweep the 27 neighbouring cells.
    const base = cellOf[i];
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        const rowBase = base + dz * GRID2 + dy * GRID;
        for (let dx = -1; dx <= 1; dx++) {
          const c = rowBase + dx;
          if (c < 0 || c >= NCELLS) continue;
          const start = cellStart[c];
          if (start < 0) continue;
          const end = start + cellSize[c];
          for (let s = start; s < end; s++) {
            const j = order[s];
            if (j === i) continue;
            // Load each neighbour position ONCE and reuse it for both the
            // distance test and the cohesion accumulator (was a double read).
            const pjx = px[j],
              pjy = py[j],
              pjz = pz[j];
            const ddx = x - pjx,
              ddy = y - pjy,
              ddz = z - pjz;
            const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
            if (d2 > R_NEI2 || d2 <= 1e-6) continue;
            if (d2 < R_SEP2) {
              const inv = 1 / d2; // inverse-square push, stronger up close
              sepX += ddx * inv;
              sepY += ddy * inv;
              sepZ += ddz * inv;
            }
            aliX += vx[j];
            aliY += vy[j];
            aliZ += vz[j];
            aliN++;
            cohX += pjx;
            cohY += pjy;
            cohZ += pjz;
            cohN++;
          }
        }
      }
    }

    // Steering: each rule yields (desired→MAX_SPEED) − velocity, capped to
    // MAX_FORCE·weight. All inlined so the inner loop allocates nothing.
    let fx = 0,
      fy = 0,
      fz = 0;
    let dl: number, k: number, gx: number, gy: number, gz: number, fl: number, cap: number;

    if (sepX !== 0 || sepY !== 0 || sepZ !== 0) {
      dl = Math.sqrt(sepX * sepX + sepY * sepY + sepZ * sepZ);
      if (dl > 1e-6) {
        k = MAX_SPEED / dl;
        gx = sepX * k - myvx;
        gy = sepY * k - myvy;
        gz = sepZ * k - myvz;
        fl = Math.sqrt(gx * gx + gy * gy + gz * gz);
        cap = MAX_FORCE * W_SEP;
        if (fl > cap) {
          const c = cap / fl;
          gx *= c;
          gy *= c;
          gz *= c;
        }
        fx += gx;
        fy += gy;
        fz += gz;
      }
    }
    if (aliN > 0) {
      const ix = aliX / aliN,
        iy = aliY / aliN,
        iz = aliZ / aliN;
      dl = Math.sqrt(ix * ix + iy * iy + iz * iz);
      if (dl > 1e-6) {
        k = MAX_SPEED / dl;
        gx = ix * k - myvx;
        gy = iy * k - myvy;
        gz = iz * k - myvz;
        fl = Math.sqrt(gx * gx + gy * gy + gz * gz);
        cap = MAX_FORCE * W_ALI;
        if (fl > cap) {
          const c = cap / fl;
          gx *= c;
          gy *= c;
          gz *= c;
        }
        fx += gx;
        fy += gy;
        fz += gz;
      }
    }
    if (cohN > 0) {
      const ix = cohX / cohN - x,
        iy = cohY / cohN - y,
        iz = cohZ / cohN - z;
      dl = Math.sqrt(ix * ix + iy * iy + iz * iz);
      if (dl > 1e-6) {
        k = MAX_SPEED / dl;
        gx = ix * k - myvx;
        gy = iy * k - myvy;
        gz = iz * k - myvz;
        fl = Math.sqrt(gx * gx + gy * gy + gz * gz);
        cap = MAX_FORCE * W_COH;
        if (fl > cap) {
          const c = cap / fl;
          gx *= c;
          gy *= c;
          gz *= c;
        }
        fx += gx;
        fy += gy;
        fz += gz;
      }
    }
    // Lure (the wandering target the flock chases).
    {
      const ix = lx - x,
        iy = ly - y,
        iz = lz - z;
      dl = Math.sqrt(ix * ix + iy * iy + iz * iz);
      if (dl > 1e-6) {
        k = MAX_SPEED / dl;
        gx = ix * k - myvx;
        gy = iy * k - myvy;
        gz = iz * k - myvz;
        fl = Math.sqrt(gx * gx + gy * gy + gz * gz);
        cap = MAX_FORCE * W_LURE;
        if (fl > cap) {
          const c = cap / fl;
          gx *= c;
          gy *= c;
          gz *= c;
        }
        fx += gx;
        fy += gy;
        fz += gz;
      }
    }
    // Predator (flee — only inside R_PRED, ramping up as it nears).
    {
      const ix = x - prx,
        iy = y - pry,
        iz = z - prz;
      const d2 = ix * ix + iy * iy + iz * iz;
      if (d2 < R_PRED2 && d2 > 1e-6) {
        dl = Math.sqrt(d2);
        const fear = predPulse * (1 - dl / R_PRED);
        k = MAX_SPEED / dl;
        gx = ix * k - myvx;
        gy = iy * k - myvy;
        gz = iz * k - myvz;
        fl = Math.sqrt(gx * gx + gy * gy + gz * gz);
        cap = MAX_FORCE * fear * 2.0;
        if (fl > cap) {
          const c = cap / fl;
          gx *= c;
          gy *= c;
          gz *= c;
        }
        fx += gx;
        fy += gy;
        fz += gz;
      }
    }
    // Curl-noise wind: a tangential swirl that shears the volume into ribbons and
    // rolls the core into a hollow knot. Added as a velocity-relative steer so it
    // bends headings rather than just translating everything.
    {
      curlWind(x, y, z, time);
      const wlen = Math.sqrt(wind[0] * wind[0] + wind[1] * wind[1] + wind[2] * wind[2]);
      if (wlen > 1e-6) {
        k = MAX_SPEED / wlen;
        gx = wind[0] * k - myvx;
        gy = wind[1] * k - myvy;
        gz = wind[2] * k - myvz;
        fl = Math.sqrt(gx * gx + gy * gy + gz * gz);
        cap = MAX_FORCE * windPulse;
        if (fl > cap) {
          const c = cap / fl;
          gx *= c;
          gy *= c;
          gz *= c;
        }
        fx += gx;
        fy += gy;
        fz += gz;
      }
    }
    // Soft spherical bound: gentle inward push that ramps past BOUND_R.
    {
      const d = Math.sqrt(x * x + y * y + z * z);
      if (d > BOUND_R * 0.64 && d > 1e-6) {
        const push = smoothstep(BOUND_R * 0.64, BOUND_R * 1.14, d) * W_BND;
        k = MAX_SPEED / d;
        gx = -x * k - myvx;
        gy = -y * k - myvy;
        gz = -z * k - myvz;
        fl = Math.sqrt(gx * gx + gy * gy + gz * gz);
        cap = MAX_FORCE * push;
        if (fl > cap) {
          const c = cap / fl;
          gx *= c;
          gy *= c;
          gz *= c;
        }
        fx += gx;
        fy += gy;
        fz += gz;
      }
    }

    let nvx = myvx + fx * dt,
      nvy = myvy + fy * dt,
      nvz = myvz + fz * dt;
    let sp = Math.sqrt(nvx * nvx + nvy * nvy + nvz * nvz);
    if (sp > MAX_SPEED) {
      const c = MAX_SPEED / sp;
      nvx *= c;
      nvy *= c;
      nvz *= c;
    } else if (sp < MIN_SPEED && sp > 1e-4) {
      const c = MIN_SPEED / sp;
      nvx *= c;
      nvy *= c;
      nvz *= c;
    }
    vx[i] = nvx;
    vy[i] = nvy;
    vz[i] = nvz;
    px[i] = x + nvx * dt;
    py[i] = y + nvy * dt;
    pz[i] = z + nvz * dt;
  }
}

// ── Designed dusk palette ───────────────────────────────────────────────────────
// A single two-stop ramp, NOT a rainbow: cool slate for the far/high mist, warm
// pale ember for the near/dense cores. `warm` ∈ [0,1] selects along it.
function birdColor(warm: number, out: Float32Array): void {
  // cool slate  (low warm)            warm pale ember (high warm)
  const cr = 104,
    cg = 138,
    cb = 196;
  const wr = 255,
    wg = 184,
    wb = 116;
  const w = clamp01(warm);
  const w2 = w * w * (1.6 - 0.6 * w); // smooth bias of warmth toward bright cores
  out[0] = lerp(cr, wr, w2);
  out[1] = lerp(cg, wg, w2);
  out[2] = lerp(cb, wb, w2);
}
const colScratch = new Float32Array(3);

// ── Cinematic dusk-sky gradient (cached per-height row LUT) ─────────────────────
// Four hand-picked stops sampled top→bottom give a cohesive dusk: a deep indigo
// zenith, a muted blue-violet upper sky, a soft rose-amber afterglow band lifting
// off the horizon, and a slightly cooler, denser haze hugging the very bottom.
// Storing the per-row RGB once (rebuilt only when H changes) lets the sky fill be
// a flat copy AND lets far birds sample the exact sky tone behind them for true
// aerial-perspective haze — the cheap trick that sells real atmospheric depth.
let skyRGB!: Float32Array; // 3 floats per row, length H*3
let skyH = -1;
// Stops as {y, r,g,b}. y∈[0,1] top→bottom.
const SKY_STOPS = [
  [0.0, 4, 6, 20], // deep indigo zenith
  [0.46, 11, 13, 38], // muted blue-violet upper sky
  [0.72, 33, 23, 52], // dusty mauve where the afterglow begins
  [0.88, 96, 54, 66], // warm rose afterglow lifting off the horizon
  [0.96, 150, 88, 62], // brightest amber ember just above the horizon line
  [1.0, 46, 28, 42], // cooler dense haze settling at the very base
] as const;
function buildSky(H: number): void {
  if (skyH === H && skyRGB) return;
  skyH = H;
  skyRGB = new Float32Array(H * 3);
  for (let y = 0; y < H; y++) {
    const fy = y / (H - 1 || 1);
    // find bracketing stops
    let s = 0;
    while (s < SKY_STOPS.length - 2 && fy > SKY_STOPS[s + 1][0]) s++;
    const a = SKY_STOPS[s],
      b = SKY_STOPS[s + 1];
    const span = b[0] - a[0] || 1e-6;
    const tRaw = clamp01((fy - a[0]) / span);
    const tt = tRaw * tRaw * (3 - 2 * tRaw); // smoothstep each segment for a soft blend
    const o = y * 3;
    skyRGB[o] = lerp(a[1], b[1], tt);
    skyRGB[o + 1] = lerp(a[2], b[2], tt);
    skyRGB[o + 2] = lerp(a[3], b[3], tt);
  }
}

// ── Render ─────────────────────────────────────────────────────────────────────
function frame(t: Term, time: number, dt: number): void {
  simulate(time, dt);

  const W = t.width,
    H = t.height,
    buf = t.pixels;
  const aspect = t.aspect;

  // — Cinematic dusk sky: a designed multi-stop vertical gradient (deep indigo
  //   zenith → mauve → rose-amber afterglow → cool base haze). Painted directly
  //   into buf (replaces, not adds) so the night stays clean. The per-row colour
  //   is precomputed in a height-keyed LUT, so this is a flat copy per row. —
  buildSky(H);
  for (let y = 0; y < H; y++) {
    const so = y * 3;
    const r = skyRGB[so],
      g = skyRGB[so + 1],
      b = skyRGB[so + 2];
    let o = y * W * 3;
    for (let x = 0; x < W; x++) {
      buf[o] = r;
      buf[o + 1] = g;
      buf[o + 2] = b;
      o += 3;
    }
  }

  // — Starfield (deterministic; gentle twinkle from time) —
  for (let i = 0; i < STARS; i++) {
    const xx = (starX[i] * W) | 0;
    const yy = (starY[i] * H) | 0;
    const tw = 0.55 + 0.45 * Math.sin(time * 1.5 + i * 2.39);
    const b = starB[i] * tw;
    t.addPixel(xx, yy, 88 * b, 102 * b, 138 * b);
  }

  // — Camera: slow whole-flock rotation on two axes, then perspective project.
  //   Pulled in close and widened so the flock fills the frame. —
  const yaw = time * 0.105;
  const pitch = 0.18 + 0.11 * Math.sin(time * 0.063);
  const cy = Math.cos(yaw),
    syy = Math.sin(yaw);
  const cp = Math.cos(pitch),
    spp = Math.sin(pitch);

  const CAM_Z = WORLD * 2.05; // closer camera → bigger flock in frame
  const FOV = 1.16; // wider field of view
  const focal = (H * 0.5) / Math.tan(FOV * 0.5);
  const NEAR = CAM_Z - WORLD * 1.2;
  const FAR = CAM_Z + WORLD * 1.2;
  const aspX = aspect < 1 ? 1 : aspect; // keep splats round on non-square grids
  const aspY = aspect < 1 ? 1 / aspect : 1;

  let visible = 0;
  for (let i = 0; i < N; i++) {
    const x0 = px[i],
      y0 = py[i],
      z0 = pz[i];
    // yaw about Y, then pitch about X.
    const xr = x0 * cy - z0 * syy;
    const zr = x0 * syy + z0 * cy;
    const yr = y0 * cp - zr * spp;
    const zr2 = y0 * spp + zr * cp;

    const camZ = zr2 + CAM_Z;
    if (camZ < 4) {
      sDepth[i] = 1e30;
      continue;
    }
    const inv = focal / camZ;
    const scrX = W * 0.5 + xr * inv;
    const scrY = H * 0.46 - yr * inv; // bias the flock slightly above centre
    if (scrX < -30 || scrX > W + 30 || scrY < -30 || scrY > H + 30) {
      sDepth[i] = 1e30;
      continue;
    }

    sx[i] = scrX;
    sy[i] = scrY;
    sDepth[i] = camZ;

    // Projected heading → a short oriented streak (motion blur along travel).
    const vxr = vx[i] * cy - vz[i] * syy;
    const vzr = vx[i] * syy + vz[i] * cy;
    const vyr = vy[i] * cp - vzr * spp;
    const hx = vxr,
      hy = -vyr; // screen-space heading
    const hl = Math.hypot(hx, hy) || 1;
    sDirX[i] = hx / hl;
    sDirY[i] = hy / hl;

    // Depth grade in [0,1]: 1 = nearest, 0 = farthest. Graded HARD so far birds
    // are a faint cool mist and near birds are distinct, slightly-larger motes —
    // this is what keeps a dense knot reading as countless specks, not a cloud.
    const depth01 = clamp01((FAR - camZ) / (FAR - NEAR));
    const d2 = depth01 * depth01;
    const speed01 = Math.hypot(vxr, vyr) / MAX_SPEED;
    // Streak length: kept short so the field reads as specks. Near + fast = a
    // slightly longer dash; far = a single point.
    sLen[i] = lerp(0.0, 1.7, d2 * d2) * (0.55 + 0.45 * speed01);
    // Per-bird brightness rises steeply with nearness; far birds are dim motes.
    sBright[i] = lerp(0.1, 1.0, d2 * d2);
    // Footprint: near birds occupy a touch more than one pixel (soft, not a
    // blob); far birds are sub-pixel points.
    sSize[i] = lerp(0.7, 1.35, d2);
    // Warmth follows depth (near cores ember, far mist slate) plus a gentle
    // golden-hour cast for birds lower in frame, nearer the horizon glow.
    sWarm[i] = clamp01(d2 + 0.26 * smoothstep(0.3, 1.0, scrY / H));
    // Aerial perspective: the farthest birds dissolve INTO the sky tone behind
    // them, so the cloud reads as receding through real atmosphere instead of a
    // flat curtain of dim dots. Near birds (d2→1) keep their own colour entirely.
    sHaze[i] = (1 - d2) * (1 - d2) * 0.7;

    zOrder[visible++] = i;
  }

  // Painter's order far→near (additive, but lets near cores sit on top cleanly).
  // A generous depth window (camZ can drift just past NEAR/FAR when the flock
  // bulges past its soft bound); out-of-window birds clamp to the end bins.
  depthSort(zOrder, visible, sDepth, CAM_Z - WORLD * 1.6, CAM_Z + WORLD * 1.6);
  const vis = zOrder;

  // — Splat each bird as a crisp sub-pixel speck (optionally a tiny oriented
  //   dash for near, fast birds). Energy is deliberately LOW so density reads as
  //   count and tone, never as a saturated white cloud. —
  for (let n = 0; n < visible; n++) {
    const i = vis[n];
    const cx = sx[i],
      cyy = sy[i];
    const len = sLen[i];
    const bright = sBright[i];
    const size = sSize[i];
    birdColor(sWarm[i], colScratch);
    let cr = colScratch[0],
      cg = colScratch[1],
      cb = colScratch[2];
    // Aerial perspective: pull far birds toward the sky tone directly behind them
    // (sampled from the cached gradient at their screen row), so they recede into
    // atmosphere rather than reading as flat dim dots on a curtain.
    const hz = sHaze[i];
    if (hz > 0.001) {
      let syRow = cyy | 0;
      if (syRow < 0) syRow = 0;
      else if (syRow >= H) syRow = H - 1;
      const so = syRow * 3;
      cr += (skyRGB[so] - cr) * hz;
      cg += (skyRGB[so + 1] - cg) * hz;
      cb += (skyRGB[so + 2] - cb) * hz;
    }

    // Base per-bird energy — low, so a knot accumulates instead of clipping.
    const peak = 72 * bright;

    if (len < 0.35) {
      // A single soft speck (the common case — far + mid birds).
      speck(buf, W, H, cx, cyy, cr, cg, cb, peak, size);
    } else {
      // A tiny oriented dash: 2-3 sub-pixel specks along the heading, brightest
      // at the leading head. Aspect-corrected so the angle is true on tall grids.
      const hx = sDirX[i] * len * aspX;
      const hy = sDirY[i] * len * aspY;
      const steps = len > 1.0 ? 3 : 2;
      for (let sIdx = 0; sIdx < steps; sIdx++) {
        const tt = sIdx / (steps - 1); // 0=tail … 1=head
        const ax = cx + (tt - 0.5) * hx;
        const ay = cyy + (tt - 0.5) * hy;
        const e = ((0.4 + 0.6 * tt) / steps) * 1.7; // ramp toward the head
        speck(buf, W, H, ax, ay, cr, cg, cb, peak * e, size);
      }
    }
  }

  // — Soft radial vignette + gentle filmic shoulder (cheap, last) —
  finish(buf, W, H);
}

// A crisp anti-aliased speck. The bird's energy is bilinearly distributed across
// the (up to) four pixels its sub-pixel centre straddles, so a point stays sharp
// and round and an off-grid bird never snaps to a chunky single pixel — this is
// the whole reason the murmuration reads as fine grain instead of a fluffy mass.
// `size` >1 spills a small soft fraction to the 4-neighbours (near birds only).
function speck(buf: Uint8Array, W: number, H: number, fx: number, fy: number, r: number, g: number, b: number, a: number, size: number): void {
  const x0 = Math.floor(fx),
    y0 = Math.floor(fy);
  const tx = fx - x0,
    ty = fy - y0;
  // Core: 2×2 bilinear coverage of the exact centre.
  addPx(buf, W, H, x0, y0, r, g, b, a * (1 - tx) * (1 - ty));
  addPx(buf, W, H, x0 + 1, y0, r, g, b, a * tx * (1 - ty));
  addPx(buf, W, H, x0, y0 + 1, r, g, b, a * (1 - tx) * ty);
  addPx(buf, W, H, x0 + 1, y0 + 1, r, g, b, a * tx * ty);
  // Near birds get a faint cross-halo so dense cores bloom gently (still small).
  if (size > 1.05) {
    const ha = a * (size - 1.0) * 0.5;
    addPx(buf, W, H, x0 + 1, y0, r, g, b, ha);
    addPx(buf, W, H, x0 - 1, y0, r, g, b, ha);
    addPx(buf, W, H, x0, y0 + 1, r, g, b, ha);
    addPx(buf, W, H, x0, y0 - 1, r, g, b, ha);
  }
}
function addPx(buf: Uint8Array, W: number, H: number, x: number, y: number, r: number, g: number, b: number, a: number): void {
  if (a <= 0 || x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  const s = a * (1 / 255);
  let nr = buf[o] + r * s,
    ng = buf[o + 1] + g * s,
    nb = buf[o + 2] + b * s;
  // A faint, slightly-warm white core where accumulated energy is very high → the
  // very densest knots bloom to pale gold rather than flat white, keeping the
  // dusk warmth visible even at saturation.
  const wb = (nr - 232) * 0.34;
  if (wb > 0) {
    ng += wb * 0.82;
    nb += wb * 0.6;
  }
  buf[o] = nr > 255 ? 255 : nr;
  buf[o + 1] = ng > 255 ? 255 : ng;
  buf[o + 2] = nb > 255 ? 255 : nb;
}

// O(n) counting sort of the visible index list by depth DESCENDING (far → near).
// The old insertion sort claimed near-sortedness but in practice the depth order
// churns every frame as the flock folds, so it degraded toward O(n²) and ate ~45%
// of the whole frame. Depth (camZ) lives in a bounded interval, so we quantise it
// into DEPTH_BUCKETS bins (high camZ = far = drawn first) and scatter in one pass.
// With 4096 bins across the ~2.6·WORLD depth span the ordering is sub-0.05-world
// precise — visually identical to an exact sort for additive specks, at O(n).
const DEPTH_BUCKETS = 4096;
let bucketCount!: Int32Array; // histogram (+1 slot for the running prefix)
let bucketKey!: Int32Array; // per-visible-bird bucket, parallel to the input idx
// Counting sort `idx[0..len)` so that, on return, idx is ordered by depth desc.
// `zMin`/`zMax` bound the live depth range for this frame's projection.
function depthSort(idx: Int32Array, len: number, depth: Float32Array, zMin: number, zMax: number): void {
  if (len < 2) return;
  const B = DEPTH_BUCKETS;
  const cnt = bucketCount;
  const key = bucketKey;
  cnt.fill(0, 0, B + 1);
  const span = zMax - zMin;
  const scale = span > 1e-6 ? (B - 1) / span : 0;
  // Bin each bird. Far (large camZ) must come first → invert the bin so bin 0 is
  // the farthest. Clamp out-of-range depths into the end bins.
  for (let n = 0; n < len; n++) {
    const i = idx[n];
    let b = ((zMax - depth[i]) * scale) | 0;
    if (b < 0) b = 0;
    else if (b >= B) b = B - 1;
    key[n] = b;
    cnt[b]++;
  }
  // Prefix sum → bucket start offsets (write cnt[b] as the running base).
  let acc = 0;
  for (let b = 0; b < B; b++) {
    const c = cnt[b];
    cnt[b] = acc;
    acc += c;
  }
  // Scatter into the scratch output, then copy back. Stable within a bucket.
  const out = sortScratch;
  for (let n = 0; n < len; n++) {
    const b = key[n];
    out[cnt[b]++] = idx[n];
  }
  idx.set(out.subarray(0, len), 0);
}
let sortScratch!: Int32Array;

// Filmic shoulder LUT — rolls bright additive cores off to white softly.
const TONE = (() => {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) lut[i] = (aces((i / 255) * 1.02) * 255) | 0;
  return lut;
})();

// Final pass: a soft radial vignette (multiplicative) + the filmic shoulder, in
// one sweep over the buffer. The vignette factor is precomputed per-resize would
// be ideal, but at this resolution a per-pixel cheap form is plenty fast.
function finish(buf: Uint8Array, W: number, H: number): void {
  const cx = W * 0.5,
    cy = H * 0.5;
  const invMax = 1 / (cx * cx + cy * cy);
  let o = 0;
  for (let y = 0; y < H; y++) {
    const dy = y - cy;
    const dy2 = dy * dy;
    for (let x = 0; x < W; x++) {
      const dx = x - cx;
      const rr = (dx * dx + dy2) * invMax; // 0 centre → 1 corner
      const vig = 1 - 0.44 * rr * rr; // gentle darkening to the edges
      let r = buf[o] * vig,
        g = buf[o + 1] * vig,
        b = buf[o + 2] * vig;
      buf[o] = TONE[r > 255 ? 255 : r | 0];
      buf[o + 1] = TONE[g > 255 ? 255 : g | 0];
      buf[o + 2] = TONE[b > 255 ? 255 : b | 0];
      o += 3;
    }
  }
}

run({
  title: 'Murmuration',
  hud: 'REYNOLDS BOIDS - CURL-WIND SHEAR - DUSK GRADE',
  captureT: 6,
  init,
  frame,
});
