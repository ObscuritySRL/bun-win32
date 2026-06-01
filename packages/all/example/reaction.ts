/**
 * Reaction — Gray-Scott reaction-diffusion, a living Turing organism under glass.
 *
 * Two virtual chemicals, U and V, share a fixed internal grid. Each step they
 * DIFFUSE at different rates (V slower than U) and REACT by the autocatalytic
 * Gray-Scott rule U + 2V -> 3V: every V cell consumes a U and converts it into
 * more V, while a steady FEED replenishes U everywhere and a KILL rate removes V.
 * The discrete update per cell is
 *     U += Du·∇²U - U·V² + F·(1 - U)
 *     V += Dv·∇²V + U·V² - (F + K)·V
 * with a 9-point Laplacian (the classic [0.05 / 0.2 / 0.05] stencil) on a toroidal
 * grid, integrated with several sub-steps per displayed frame for stability.
 *
 * The crucial move here is that (F, K) is NOT uniform: it is a slowly drifting
 * SPATIAL FIELD. A pair of low-frequency value-noise layers warps the feed/kill
 * pair across the grid, so at any instant different regions sit in different parts
 * of the Gray-Scott phase diagram — spots here, worms there, coral over there, and
 * QUIET DEAD ZONES where the catalyst can't sustain itself and the field stays
 * dark. The whole noise field also rotates and breathes over time, so each region
 * migrates through regimes (spots -> worms -> coral -> holes) on its own schedule.
 * The result reads as one continuous organism with depth and negative space, not a
 * uniform wallpaper maze.
 *
 * The coarse V field is bilinearly UPSAMPLED to the full pixel buffer and shaded
 * like microscopy, not a flat heatmap: a 4-tap height gradient drives a soft
 * Lambert + Blinn specular sheen (wet membranes catch a slowly-orbiting lamp),
 * cavity occlusion darkens the troughs for depth, the value drives a cohesive
 * abyss-indigo -> teal -> warm-bone color ramp biased so the field stays mostly
 * inky with luminous ridges, a depth haze sinks the calm regions back, and a
 * two-radius bloom + vignette finish it. Everything is mulberry32-seeded and
 * time-derived, so a deterministic capture reproduces exactly.
 *
 * Decoupled resolution: the sim runs on a FIXED internal grid (sampled to t.W/t.H
 * each frame), so the piece reflows and fills any terminal size on live-resize.
 *
 * Technique: Gray-Scott reaction-diffusion · 9-point Laplacian · toroidal grid ·
 * multi-substep Euler · SPATIALLY-VARYING animated (F,K) noise field · bilinear
 * upsample · 4-tap Lambert/specular · cavity occlusion · depth haze · bloom + vignette.
 *
 * Run: bun run packages/all/example/reaction.ts
 */
import { runDemo, Term, clamp01, lerp, smoothstep, aces, mulberry32, TAU } from './_term';

// ── Internal simulation grid ───────────────────────────────────────────────────
// Fixed, display-independent. Chosen wide-ish to match terminal aspect and keep a
// Turing pattern scale that reads as "microscopy". The render pass bilinearly
// upsamples this to t.W/t.H every frame, so the sim cost is constant at any size.
const GW = 224;
const GH = 128;
const N = GW * GH;

// Several Euler sub-steps per displayed frame. The Gray-Scott update is only
// conditionally stable, so we take fixed-size steps (independent of dt) and just
// do a constant number per frame for a steady, deterministic evolution speed.
const SUBSTEPS = 14;

// Diffusion rates. V (the visible catalyst) diffuses slower than U — the ratio is
// what makes Turing patterns instead of a smooth blur.
const DU = 0.16;
const DV = 0.08;

// ── Chemical fields (ping-pong) ────────────────────────────────────────────────
let U = new Float32Array(N);
let V = new Float32Array(N);
let U2 = new Float32Array(N);
let V2 = new Float32Array(N);

// Per-cell feed / kill fields. These are the SPATIALLY-VARYING (F,K) — recomputed
// a few times per second from drifting low-frequency noise, not every substep, so
// the cost stays negligible. The step uses them directly, giving every region its
// own regime and letting some regions go quiet (negative space).
const FF = new Float32Array(N);
const KF = new Float32Array(N);

// ── Value-noise field (for the spatial F/K modulation) ─────────────────────────
// A small lattice of random values, bilinearly interpolated and summed over a few
// octaves, gives smooth large-scale blobs that warp the phase diagram across the
// grid. mulberry32-seeded so it's deterministic; sampled in a rotating/translating
// frame so the regimes migrate over time.
const LAT = 10; // lattice resolution per octave (coarse → big soft blobs)
const noiseSeed = (rng: () => number, n: number): Float32Array => {
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = rng();
  return a;
};
let latA: Float32Array = new Float32Array(0);
let latB: Float32Array = new Float32Array(0);
const initNoise = (): void => {
  const rng = mulberry32(0x13577531);
  latA = noiseSeed(rng, (LAT + 1) * (LAT + 1));
  latB = noiseSeed(rng, (LAT + 1) * (LAT + 1));
};
// Smooth bilinear sample of a lattice in [0,1)² (wrapping), with smoothstep fade
// so the blobs are rounded, not diamond-shaped.
const sampleLat = (lat: Float32Array, u: number, v: number): number => {
  u = u - Math.floor(u);
  v = v - Math.floor(v);
  const fx = u * LAT, fy = v * LAT;
  let x0 = fx | 0, y0 = fy | 0;
  const tx = fx - x0, ty = fy - y0;
  const x1 = x0 + 1, y1 = y0 + 1;
  const s = LAT + 1;
  const a = lat[y0 * s + x0], b = lat[y0 * s + x1];
  const c = lat[y1 * s + x0], d = lat[y1 * s + x1];
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const top = a + (b - a) * sx;
  const bot = c + (d - c) * sx;
  return top + (bot - top) * sy;
};

// ── (F,K) phase regimes ────────────────────────────────────────────────────────
// Instead of a single point migrating through the phase diagram, we BLEND between a
// handful of named GROWTH regimes per cell, choosing the blend from a noise field.
// These are all inside the living band so wherever a cell sits it builds structure —
// just a DIFFERENT structure (spots vs worms vs coral vs holes). A slow temporal
// drift slides the whole field along the list so every region morphs over time.
// Negative space is handled SEPARATELY (a dead-zone mask), not by a dead regime in
// this list — that keeps the active organism rich while still leaving calm voids.
//                feed     kill    name (Pearson-class region)
const REGIMES: [number, number][] = [
  [0.0540, 0.0615], // moving spots (κ)
  [0.0580, 0.0608], // mitosis — dividing cells
  [0.0400, 0.0600], // dense worms
  [0.0370, 0.0610], // worms + loops (θ)
  [0.0300, 0.0560], // coral / branching growth
  [0.0340, 0.0570], // coral, denser
  [0.0390, 0.0580], // mazes / labyrinth (λ)
  [0.0460, 0.0655], // pulsing holes / chaos (μ)
  [0.0250, 0.0590], // unstable worms / mitosis-like division
];
// The dead-zone anchor: a high feed at this kill cannot sustain catalyst, so cells
// pushed here decay to bare field — this is what carves the negative space.
const DEAD_F = 0.0980, DEAD_K = 0.0610;

// ── Deterministic seed ─────────────────────────────────────────────────────────
// U starts at 1 everywhere (full of reactant), V at 0 (no catalyst). A spread of
// soft seed spots of V ignite the reaction; the front then spreads to fill the
// active regions of the grid. mulberry32 makes everything reproducible.
const seed = (): void => {
  U.fill(1);
  V.fill(0);
  const rng = mulberry32(0x5eed1234);
  const blobs = 16;
  for (let b = 0; b < blobs; b++) {
    const cx = (0.08 + rng() * 0.84) * GW;
    const cy = (0.08 + rng() * 0.84) * GH;
    const r = 4 + rng() * 5;
    const r2 = r * r;
    const x0 = Math.max(0, (cx - r) | 0), x1 = Math.min(GW - 1, (cx + r) | 0);
    const y0 = Math.max(0, (cy - r) | 0), y1 = Math.min(GH - 1, (cy + r) | 0);
    for (let y = y0; y <= y1; y++) {
      const dy = y - cy;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const g = Math.exp(-d2 / (r2 * 0.4));
        const i = y * GW + x;
        V[i] = Math.max(V[i], 0.5 * g);
        U[i] = Math.min(U[i], 1 - 0.5 * g);
      }
    }
  }
  // A whisper of deterministic noise everywhere breaks the symmetry so the front
  // doesn't form a perfect ring — Turing structure needs a seed of disorder.
  for (let i = 0; i < N; i++) V[i] += (rng() - 0.5) * 0.0025;
};

// ── Build the spatial F/K field ────────────────────────────────────────────────
// Two drifting noise layers: one selects WHICH regime a cell sits in (across the
// REGIMES list), the other adds a finer warp so regime boundaries are organic.
// The whole sampling frame rotates + translates over time so the regimes migrate.
// Recomputed only a few times per second (the fields change slowly), which keeps
// it far off the hot path.
const buildFK = (time: number): void => {
  const nR = REGIMES.length;
  // Slow drift of the noise sampling frame.
  const ang = time * 0.012;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const ox = time * 0.013, oy = time * 0.009;
  // The temporal "regime cursor" slides the whole organism through the list so
  // every region morphs over the long term, layered on top of the spatial choice.
  const tShift = time * 0.025;
  // A second, slower drift drives the dead-zone mask so the voids wander and
  // open/close over time — negative space that breathes.
  const dAng = time * 0.018 + 1.7;
  const dca = Math.cos(dAng), dsa = Math.sin(dAng);
  const dox = time * 0.008, doy = -time * 0.011;
  // Frequencies (in lattice-tiles across the grid). Low = big soft regions.
  // The void frequency fd is kept low so negative space reads as a few large,
  // confident calm regions rather than scattered pinholes.
  const f1 = 1.9, f2 = 3.6, fd = 1.15;
  const invGW = 1 / GW, invGH = 1 / GH;
  for (let y = 0; y < GH; y++) {
    // Normalized, centered coords so rotation is about the middle.
    const ny = y * invGH - 0.5;
    for (let x = 0; x < GW; x++) {
      const nx = x * invGW - 0.5;
      // Rotated sample coords for the regime-selection noise.
      const rx = nx * ca - ny * sa;
      const ry = nx * sa + ny * ca;
      // Octave A: which regime (large blobs); octave B: finer organic warp.
      let sel = sampleLat(latA, rx * f1 + ox, ry * f1 + oy);
      sel = sel * 0.70 + sampleLat(latB, rx * f2 - oy * 1.3, ry * f2 + ox * 1.1) * 0.30;
      // Map noise → a position along the regime list, drifting with the cursor.
      let pos = sel * nR + tShift * nR;
      pos = pos - Math.floor(pos / nR) * nR;        // wrap into [0, nR)
      const i0 = pos | 0;
      const fr = pos - i0;
      const a = REGIMES[i0 % nR], b = REGIMES[(i0 + 1) % nR];
      const w = fr * fr * (3 - 2 * fr);             // smooth regime plateaus
      let Fv = a[0] + (b[0] - a[0]) * w;
      let Kv = a[1] + (b[1] - a[1]) * w;

      // Dead-zone mask: an independent slow noise carves calm voids. Where the mask
      // is low, blend the cell toward the dead anchor so the catalyst can't survive
      // — genuine negative space. The void CORE goes fully dead (decisive dark),
      // with a soft shoreline band so the edges aren't hard cuts. Two octaves give
      // the voids organic, non-circular outlines.
      const drx = nx * dca - ny * dsa;
      const dry = nx * dsa + ny * dca;
      let dn = sampleLat(latA, drx * fd + dox + 4.0, dry * fd + doy + 2.0);
      dn = dn * 0.74 + sampleLat(latB, drx * (fd * 2.1) - doy + 7.0, dry * (fd * 2.1) + dox + 3.0) * 0.26;
      // Below DEAD_HI the cell starts dying; below DEAD_LO it's fully dead. This
      // makes void cores decisively dark while keeping a soft membrane shoreline.
      const DEAD_HI = 0.56, DEAD_LO = 0.33;
      const dm = clamp01((DEAD_HI - dn) / (DEAD_HI - DEAD_LO)); // 0 at HI → 1 at/below LO
      const dead = dm * dm * (3 - 2 * dm);
      Fv = Fv + (DEAD_F - Fv) * dead;
      Kv = Kv + (DEAD_K - Kv) * dead;

      const i = y * GW + x;
      FF[i] = Fv;
      KF[i] = Kv;
    }
  }
};

// ── One Gray-Scott step (toroidal 9-point Laplacian, spatial F/K) ──────────────
// The interior (every cell not touching an edge) needs no wrap arithmetic, so it
// runs as a tight branch-free kernel with row pointers hoisted out of the x loop;
// the four edges and four corners are handled separately with the toroidal wrap.
// This removes two ternaries per cell from the dominant inner loop (14×/frame).
const stepCell = (
  u: Float32Array, v: Float32Array, un: Float32Array, vn: Float32Array,
  f: Float32Array, k: Float32Array,
  i: number, il: number, ir: number, iu: number, id: number,
  iul: number, iur: number, idl: number, idr: number,
): void => {
  const uc = u[i];
  const vc = v[i];
  const lu =
    (u[il] + u[ir] + u[iu] + u[id]) * 0.2 +
    (u[iul] + u[iur] + u[idl] + u[idr]) * 0.05 - uc;
  const lv =
    (v[il] + v[ir] + v[iu] + v[id]) * 0.2 +
    (v[iul] + v[iur] + v[idl] + v[idr]) * 0.05 - vc;
  const F = f[i], K = k[i];
  const uvv = uc * vc * vc;
  const nu = uc + DU * lu - uvv + F * (1 - uc);
  const nv = vc + DV * lv + uvv - (F + K) * vc;
  un[i] = nu < 0 ? 0 : nu > 1 ? 1 : nu;
  vn[i] = nv < 0 ? 0 : nv > 1 ? 1 : nv;
};
const step = (): void => {
  const u = U, v = V, un = U2, vn = V2;
  const f = FF, k = KF;
  // Interior rows/cols: no wrap, fully hoisted neighbour-row offsets.
  for (let y = 1; y < GH - 1; y++) {
    const y0 = y * GW;
    const ym = y0 - GW;
    const yp = y0 + GW;
    // March i along the row; neighbour indices are constant offsets from i.
    for (let x = 1; x < GW - 1; x++) {
      const i = y0 + x;
      const uc = u[i];
      const vc = v[i];
      const iu = ym + x, id = yp + x;
      const lu =
        (u[i - 1] + u[i + 1] + u[iu] + u[id]) * 0.2 +
        (u[iu - 1] + u[iu + 1] + u[id - 1] + u[id + 1]) * 0.05 - uc;
      const lv =
        (v[i - 1] + v[i + 1] + v[iu] + v[id]) * 0.2 +
        (v[iu - 1] + v[iu + 1] + v[id - 1] + v[id + 1]) * 0.05 - vc;
      const F = f[i], K = k[i];
      const uvv = uc * vc * vc;
      const nu = uc + DU * lu - uvv + F * (1 - uc);
      const nv = vc + DV * lv + uvv - (F + K) * vc;
      un[i] = nu < 0 ? 0 : nu > 1 ? 1 : nu;
      vn[i] = nv < 0 ? 0 : nv > 1 ? 1 : nv;
    }
  }
  // Top & bottom rows (toroidal in y).
  for (let pass = 0; pass < 2; pass++) {
    const y = pass === 0 ? 0 : GH - 1;
    const y0 = y * GW;
    const ym = (y === 0 ? GH - 1 : y - 1) * GW;
    const yp = (y === GH - 1 ? 0 : y + 1) * GW;
    for (let x = 0; x < GW; x++) {
      const xm = x === 0 ? GW - 1 : x - 1;
      const xp = x === GW - 1 ? 0 : x + 1;
      stepCell(u, v, un, vn, f, k, y0 + x, y0 + xm, y0 + xp, ym + x, yp + x, ym + xm, ym + xp, yp + xm, yp + xp);
    }
  }
  // Left & right columns (toroidal in x), excluding corners already done above.
  for (let pass = 0; pass < 2; pass++) {
    const x = pass === 0 ? 0 : GW - 1;
    const xm = x === 0 ? GW - 1 : x - 1;
    const xp = x === GW - 1 ? 0 : x + 1;
    for (let y = 1; y < GH - 1; y++) {
      const y0 = y * GW, ym = y0 - GW, yp = y0 + GW;
      stepCell(u, v, un, vn, f, k, y0 + x, y0 + xm, y0 + xp, ym + x, yp + x, ym + xm, ym + xp, yp + xm, yp + xp);
    }
  }
  U = un; V = vn; U2 = u; V2 = v;
};

// ── Color ramp: abyss indigo -> teal -> warm bone ──────────────────────────────
// Biased so the bulk of a membrane reads deep, with teal reserved for active body
// and bone only for ridge crests — keeps the field inky and the structure luminous
// rather than a flat sheet of teal. Values are LINEAR; tonemapped at the end.
const RAMP: [number, number, number][] = [
  [0.006, 0.008, 0.022], // abyss (dead field / negative space)
  [0.014, 0.024, 0.070], // deep indigo
  [0.028, 0.080, 0.170], // indigo-teal
  [0.040, 0.230, 0.320], // ocean teal
  [0.110, 0.470, 0.470], // bright teal
  [0.420, 0.700, 0.580], // jade
  [0.840, 0.880, 0.740], // warm bone
  [1.000, 0.975, 0.890], // hot bone-white
];
const rampCol = (t: number, out: [number, number, number]): void => {
  t = clamp01(t) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, t | 0);
  const f = t - i;
  const a = RAMP[i], b = RAMP[i + 1];
  out[0] = a[0] + (b[0] - a[0]) * f;
  out[1] = a[1] + (b[1] - a[1]) * f;
  out[2] = a[2] + (b[2] - a[2]) * f;
};

// ── Base-colour LUT indexed by V (the field value, always in [0,1]) ─────────────
// The membrane's *unshaded* colour is a pure function of val: a value window
// (smoothstep), a gentle gamma lift, and the abyss→bone ramp. None of that depends
// on lighting, so we bake the whole chain into a flat r,g,b table at 4096 steps —
// finer than the eye can resolve in this ramp — and replace a smoothstep + a
// function call + nested array indexing per pixel with one interleaved table read.
const RAMPLUT_N = 4096;
const rampLut = new Float32Array((RAMPLUT_N + 1) * 3);
{
  const tmp: [number, number, number] = [0, 0, 0];
  const e0 = 0.045, e1 = 0.46, inv = 1 / (e1 - e0);
  for (let i = 0; i <= RAMPLUT_N; i++) {
    const val = i / RAMPLUT_N;
    let tv = (val - e0) * inv;
    tv = tv < 0 ? 0 : tv > 1 ? 1 : tv;
    tv = tv * tv * (3 - 2 * tv);
    rampCol(tv * tv * (3 - 2 * tv) * 0.94 + tv * 0.06, tmp);
    rampLut[i * 3] = tmp[0];
    rampLut[i * 3 + 1] = tmp[1];
    rampLut[i * 3 + 2] = tmp[2];
  }
}

// ── ACES tonemap LUT (linear channel → 0..255 byte) ────────────────────────────
// aces() is called three times per pixel and carries a divide. It maps a linear
// channel to 0..1; we bake input∈[0, ACES_MAX] → final 0..255 byte at a step finer
// than 8-bit output quantization, so the result is visually identical but is a
// single array read + |0 in the hot loop. Inputs are clamped to the table top
// (aces saturates near 1 well before ACES_MAX, so the cap is invisible).
const ACES_MAX = 8;
const ACES_N = 8192;
const ACES_SCALE = ACES_N / ACES_MAX;
const acesLut = new Float32Array(ACES_N + 1);
for (let i = 0; i <= ACES_N; i++) acesLut[i] = aces(i / ACES_SCALE) * 255;
const acesByte = (x: number): number => {
  if (x <= 0) return 0;
  let idx = (x * ACES_SCALE) | 0;
  if (idx >= ACES_N) idx = ACES_N;
  return acesLut[idx] | 0;
};

// ── Per-axis sample tables (precomputed once per frame, reused) ─────────────────
// The bilinear/4-tap sample indices and the fractional weight along each axis
// depend ONLY on the pixel coordinate and the grid size — not on the inner loop.
// Precomputing them per axis turns the per-pixel Math.floor + four modulos into a
// pair of table lookups, the single biggest cost in the old inner loop.
let xCx0 = new Int32Array(0), xCx1 = new Int32Array(0), xCxm = new Int32Array(0), xCxp = new Int32Array(0);
let xFx = new Float32Array(0);
let lastSampW = -1;
const buildXTable = (W: number): void => {
  if (xCx0.length !== W) {
    xCx0 = new Int32Array(W); xCx1 = new Int32Array(W);
    xCxm = new Int32Array(W); xCxp = new Int32Array(W);
    xFx = new Float32Array(W);
  }
  const sx = GW / W;
  for (let px = 0; px < W; px++) {
    const gxf = (px + 0.5) * sx - 0.5;
    const gx0 = Math.floor(gxf);
    xFx[px] = gxf - gx0;
    const cx0 = ((gx0 % GW) + GW) % GW;
    const cx1 = (cx0 + 1) % GW;
    xCx0[px] = cx0; xCx1[px] = cx1;
    xCxm[px] = ((gx0 - 1) % GW + GW) % GW;
    xCxp[px] = (cx1 + 1) % GW;
  }
};

// ── Render: bilinear-upsample V to pixels, shade like microscopy ───────────────
const render = (t: Term, time: number): void => {
  const buf = t.buf;
  const W = t.W, H = t.H;
  const v = V;
  const sy = GH / H;
  if (W !== lastSampW) { buildXTable(W); lastSampW = W; }
  const cx0a = xCx0, cx1a = xCx1, cxma = xCxm, cxpa = xCxp, fxa = xFx;

  // Slowly orbiting lamp for the membrane sheen (deterministic, time-derived).
  const la = time * 0.16;
  const lx = Math.cos(la) * 0.62;
  const ly = Math.sin(la) * 0.62;
  const lz = 0.70;
  const lInv = 1 / Math.hypot(lx, ly, lz);
  const Lx = lx * lInv, Ly = ly * lInv, Lz = lz * lInv;

  for (let py = 0; py < H; py++) {
    const gyf = (py + 0.5) * sy - 0.5;
    const gy0 = Math.floor(gyf);
    const fy = gyf - gy0;
    const ry0 = ((gy0 % GH) + GH) % GH;
    const ry1 = (ry0 + 1) % GH;
    const rym = ((gy0 - 1) % GH + GH) % GH; // for 4-tap gradient
    const ryp = (ry1 + 1) % GH;
    const row0 = ry0 * GW;
    const row1 = ry1 * GW;
    const rowM = rym * GW;
    const rowP = ryp * GW;
    let o = py * W * 3;
    for (let px = 0; px < W; px++) {
      const fx = fxa[px];
      const cx0 = cx0a[px];
      const cx1 = cx1a[px];
      const cxm = cxma[px];
      const cxp = cxpa[px];

      // Bilinear sample of V (the height/value).
      const v00 = v[row0 + cx0], v10 = v[row0 + cx1];
      const v01 = v[row1 + cx0], v11 = v[row1 + cx1];
      const top = v00 + (v10 - v00) * fx;
      const bot = v01 + (v11 - v01) * fx;
      const val = top + (bot - top) * fy;

      // 4-tap height gradient (one cell apart on each axis) for a cleaner normal
      // than the 1-tap estimate — reads as a real wet surface, not noise.
      const hl = v[row0 + cxm], hr = v[row0 + cxp];
      const hu = v[rowM + cx0], hd = v[rowP + cx0];
      const gx = hr - hl;
      const gyv = hd - hu;
      const nScale = 3.2;
      let nx = -gx * nScale, ny = -gyv * nScale, nz = 1;
      const nInv = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx *= nInv; ny *= nInv; nz *= nInv;
      const diff = Lx * nx + Ly * ny + Lz * nz;
      const lam = diff < 0 ? 0 : diff;
      // Blinn-ish specular about the normal toward viewer (0,0,1).
      const rz = 2 * diff * nz - Lz;
      const spec = rz > 0 ? rz * rz * rz * rz : 0; // pow ~16 via squaring chain below
      const spec2 = spec * spec;                   // ~pow 8 of rz; tightens highlight

      // Cavity occlusion: troughs (where the local field is below the body) read
      // darker, giving the organism real depth in its folds. Cheap: compare the
      // sample to its neighbourhood mean via the gradient magnitude is not enough,
      // so use a curvature proxy — the Laplacian sign from the 4 taps.
      const neigh = (hl + hr + hu + hd) * 0.25;
      const cav = clamp01((val - neigh) * 6 + 0.5); // <0.5 = concave trough → darker

      // Map value through a window biased so the wide membrane body stays deep and
      // only ridges climb to bone — baked into rampLut, indexed by val∈[0,1].
      const li = (val * RAMPLUT_N) | 0; // val already clamped to [0,1] by the solver
      const lo3 = li * 3;
      let r = rampLut[lo3], g = rampLut[lo3 + 1], bl = rampLut[lo3 + 2];

      // Lambert relight + cavity occlusion → 3D wet surface with shadowed folds.
      const shade = (0.30 + 0.78 * lam) * (0.55 + 0.45 * cav);
      r *= shade; g *= shade; bl *= shade;

      // Specular sheen: cool-white glint, only where there's real catalyst so the
      // dead field stays inky. Tinted faintly cyan. (smoothstep(0.10,0.30,val) inlined)
      let sw = (val - 0.10) * 5; // 1/(0.30-0.10) = 5
      sw = sw < 0 ? 0 : sw > 1 ? 1 : sw;
      const sh = spec2 * (sw * sw * (3 - 2 * sw));
      r += sh * 0.50; g += sh * 0.74; bl += sh * 0.92;

      // Self-emissive crest glow — the densest catalyst lights up warm bone-white.
      const core = val - 0.40;
      if (core > 0) {
        const e = core * core * 6.0;
        r += e * 1.00; g += e * 0.93; bl += e * 0.72;
      }

      buf[o] = acesByte(r);
      buf[o + 1] = acesByte(g);
      buf[o + 2] = acesByte(bl);
      o += 3;
    }
  }

  bloomVignette(t, time);
};

// Two-radius bloom + depth haze + vignette in one O(W·H) post pass. Bloom bleeds
// light from bright structure into the dark gaps; a slow depth haze lifts a faint
// cool ambient in the calm regions so negative space recedes instead of going to
// dead black; vignette sinks the corners so it reads as a lit slide.
let lumaScratch = new Float32Array(0);
// Resize-stable geometry tables: the per-pixel vignette factor and the per-pixel
// haze ripple PHASE depend only on (x,y,W,H), so we bake them on resize and avoid
// a Math.hypot + smoothstep per pixel every frame. The blur's clamped tap columns
// are also precomputed once per width.
let vigTab = new Float32Array(0);
let phaseTab = new Float32Array(0);
let bvW = -1, bvH = -1;
let bXm1 = new Int32Array(0), bXp1 = new Int32Array(0), bXm2 = new Int32Array(0), bXp2 = new Int32Array(0);
const buildBloomTables = (W: number, H: number): void => {
  vigTab = new Float32Array(W * H);
  phaseTab = new Float32Array(W * H);
  const cxp = (W - 1) * 0.5, cyp = (H - 1) * 0.5;
  const maxr = Math.hypot(cxp, cyp);
  for (let y = 0; y < H; y++) {
    const vy = (y - cyp) / maxr;
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const dx = x - cxp, dy = y - cyp;
      const vr = Math.sqrt(dx * dx + dy * dy) / maxr;
      vigTab[row + x] = lerp(1.06, 0.58, smoothstep(0.42, 1.05, vr));
      const vx = (x - cxp) / maxr;
      phaseTab[row + x] = vx * 3.0 + vy * 2.0;
    }
  }
  const r1 = 2, r2 = 5;
  bXm1 = new Int32Array(W); bXp1 = new Int32Array(W);
  bXm2 = new Int32Array(W); bXp2 = new Int32Array(W);
  for (let x = 0; x < W; x++) {
    bXm1[x] = x - r1 < 0 ? 0 : x - r1; bXp1[x] = x + r1 >= W ? W - 1 : x + r1;
    bXm2[x] = x - r2 < 0 ? 0 : x - r2; bXp2[x] = x + r2 >= W ? W - 1 : x + r2;
  }
};
// Sin LUT for the slow haze ripple (only sampled in dark regions). 0..255 maps to
// 0..2π; a 256-entry table at this amplitude is far below 8-bit visible banding.
const SIN_N = 1024;
const sinLut = new Float32Array(SIN_N);
for (let i = 0; i < SIN_N; i++) sinLut[i] = Math.sin((i / SIN_N) * TAU);
const SIN_K = SIN_N / TAU;
const fastSin = (x: number): number => {
  // x*SIN_K|0 then mask: JS & is 32-bit two's-complement, so negatives wrap
  // correctly into [0, SIN_N) for the power-of-two table size.
  return sinLut[((x * SIN_K) | 0) & (SIN_N - 1)];
};
const bloomVignette = (t: Term, time: number): void => {
  const buf = t.buf;
  const W = t.W, H = t.H;
  if (lumaScratch.length !== W * H) lumaScratch = new Float32Array(W * H);
  if (bvW !== W || bvH !== H) { buildBloomTables(W, H); bvW = W; bvH = H; }
  const L = lumaScratch;
  for (let i = 0, p = 0; i < W * H; i++, p += 3) {
    L[i] = (buf[p] * 0.299 + buf[p + 1] * 0.587 + buf[p + 2] * 0.114) / 255;
  }
  const r1 = 2, r2 = 5;
  // Faint, very slowly drifting cool haze so the dark negative space has depth and
  // a hint of atmosphere rather than flat black. Time-derived (deterministic).
  const hazeDrift = time * 0.05;
  const vig = vigTab, phase = phaseTab;
  const xm1a = bXm1, xp1a = bXp1, xm2a = bXm2, xp2a = bXp2;
  for (let y = 0; y < H; y++) {
    const ym1 = (y - r1 < 0 ? 0 : y - r1) * W, yp1 = (y + r1 >= H ? H - 1 : y + r1) * W;
    const ym2 = (y - r2 < 0 ? 0 : y - r2) * W, yp2 = (y + r2 >= H ? H - 1 : y + r2) * W;
    const row = y * W;
    let o = row * 3;
    for (let x = 0; x < W; x++) {
      const li = row + x;
      const near = (L[ym1 + x] + L[yp1 + x] + L[row + xm1a[x]] + L[row + xp1a[x]]) * 0.25;
      const far = (L[ym2 + x] + L[yp2 + x] + L[row + xm2a[x]] + L[row + xp2a[x]]) * 0.25;
      const bN = near > 0.18 ? (near - 0.18) * 0.55 : 0;
      const bF = far > 0.12 ? (far - 0.12) * 0.30 : 0;
      const addR = (bN * 0.20 + bF * 0.10) * 255;
      const addG = (bN * 0.42 + bF * 0.22) * 255;
      const addB = (bN * 0.55 + bF * 0.30) * 255;

      // Depth haze: a faint cool wash only in genuinely dark regions, gently
      // modulated by a slow large-scale ripple so negative space breathes. The
      // ripple sin is only evaluated where the pixel is actually dark.
      const lum = L[li];
      let hzR = 0, hzG = 0, hzB = 0;
      if (lum < 0.10) {
        const dark = (0.10 - lum) * 10; // 0..1
        const ripple = 0.5 + 0.5 * fastSin(phase[li] + hazeDrift);
        const haze = dark * (0.5 + 0.5 * ripple);
        hzR = haze * 4.0; hzG = haze * 7.0; hzB = haze * 12.0;
      }

      const vg = vig[li];
      const r = buf[o] * vg + addR + hzR;
      const g = buf[o + 1] * vg + addG + hzG;
      const b = buf[o + 2] * vg + addB + hzB;
      buf[o] = r > 255 ? 255 : r;
      buf[o + 1] = g > 255 ? 255 : g;
      buf[o + 2] = b > 255 ? 255 : b;
      o += 3;
    }
  }
};

// ── Demo wiring ────────────────────────────────────────────────────────────────
let seeded = false;
let fkTimer = 1e9; // force a rebuild on the first frame

runDemo({
  title: 'Reaction',
  hud: 'GRAY-SCOTT REACTION-DIFFUSION - SPATIAL PHASE FIELD - LIVING TURING ORGANISM',
  captureT: 8,
  init: () => {
    if (latA.length === 0) initNoise();
    if (!seeded) { seed(); seeded = true; }
    fkTimer = 1e9;
  },
  frame: (t, time, dt) => {
    if (latA.length === 0) initNoise();
    if (!seeded) { seed(); seeded = true; }
    // Rebuild the spatial (F,K) field a few times per second — it drifts slowly,
    // so this is plenty smooth and keeps the per-substep loop lean.
    fkTimer += dt;
    if (fkTimer > 0.15) { buildFK(time); fkTimer = 0; }
    for (let i = 0; i < SUBSTEPS; i++) step();
    render(t, time);
  },
});
