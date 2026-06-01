/**
 * Flow Field — a few designed ribbons of light sweeping through a divergence-free
 * curl-noise current, drawn by thousands of particles against a premium dark void.
 *
 * A gallery-grade generative-art piece, pure TypeScript, rendered as a TRUECOLOR
 * terminal framebuffer. Several thousand particles live in NORMALIZED [0,1] space
 * and are advected every frame through a CURL-NOISE velocity field: the field is
 * the 2D curl ( ∂ψ/∂y , −∂ψ/∂x ) of a scalar streamfunction ψ. Taking the curl makes
 * the flow exactly divergence-free, so particles neither pile up nor thin out — they
 * glide along smooth, incompressible streamlines that reorganize as ψ evolves.
 *
 * COMPOSITION over noise. ψ is built as a HIERARCHY of octaves: one big, slow gesture
 * that sets a few large sweeping bands, then a medium octave and a whisper of fine
 * filigree layered INSIDE the bands. A separate low-frequency COMPOSITION field carves
 * the frame into a handful of luminous RIBBON CORRIDORS and wide NEGATIVE SPACE: the
 * field morphs slowly so corridors breathe and migrate but never dissolve into uniform
 * busy-ness. Particles in the void deposit almost nothing and are pulled back toward a
 * corridor when they respawn, so light concentrates into intentional ribbons while the
 * surround stays a deep near-black — the piece reads as designed flow, not turbulence.
 *
 * Each particle deposits a thin ADDITIVE smear into a floating-point HDR accumulation
 * buffer; the whole buffer is MULTIPLIED DOWN a hair every frame, so trails persist as
 * silky ribbons that BLOOM where corridors converge and fade where they thin. Color is
 * sampled from a hand-tuned cohesive gradient (deep indigo → violet → magenta → warm
 * gold) indexed by where the particle sits ACROSS its corridor (cool edges, warm spine)
 * and by speed, with a slow global drift — never garish. A separable blur lifts a soft
 * BLOOM off the brightest confluences, an ACES filmic tonemap grades the HDR to 8-bit,
 * and a faint cold vignette keeps the void premium and the eye on the light.
 *
 * Everything is in normalized/world space sampled analytically, so the whole field
 * reflows seamlessly on resize at any aspect ratio. All randomness is mulberry32-seeded
 * → captures are deterministic; motion is purely a function of time.
 *
 * Technique: hierarchical curl-noise streamfunction (large gesture + fine detail,
 * divergence-free advection) · designed composition field for negative space + focal
 * corridors · cross-corridor color ramp · HDR additive trail accumulation with decay ·
 * separable bloom · ACES tonemap · normalized-space particles for seamless resize.
 *
 * Run: bun run packages/all/example/flowfield.ts
 */
import { runDemo, Term, clamp01, lerp, smoothstep, mulberry32, TAU } from './_term';

// ── Value-noise streamfunction ─────────────────────────────────────────────────
// A small lattice of pseudo-random gradients, smoothly interpolated. We evolve the
// field by blending TWO time-shifted lattice "slices" (a cheap 3rd dimension), which
// makes ψ morph continuously instead of cross-fading in steps. The curl of ψ is the
// velocity field the particles ride.
const LATTICE = 64; // streamfunction lattice resolution (period in lattice cells)

// Permutation/value tables — seeded once, deterministic.
const rng = mulberry32(0x5eed1a3f);
const PERM = new Uint8Array(512);
const GVAL = new Float32Array(256);
{
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  for (let i = 0; i < 256; i++) GVAL[i] = rng() * 2 - 1; // lattice values in [-1,1]
}

// Quintic smootherstep — C2 continuous, so the curl (a derivative) stays smooth.
// (inlined directly into vnoise below as t*t*t*(t*(t*6-15)+10) for speed.)

// 3D-ish value noise: 2D lattice value-noise on two integer "w" slices, lerped by
// the fractional w. Cheap, smooth, and morphs nicely along w (= time).
// Hot path: the inner "slice" is inlined twice (no per-call closure allocation) and
// the PERM[(Y+wb)] hash for each w-slice is hoisted out of the x-branches so the four
// corner lookups share work. Identical math to the original, just hand-fused.
const vnoise = (x: number, y: number, w: number): number => {
  const xi = Math.floor(x), yi = Math.floor(y), wi = Math.floor(w);
  const xf = x - xi, yf = y - yi, wf = w - wi;
  // inline quintic fade(t) = t*t*t*(t*(t*6-15)+10)
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const s = wf * wf * wf * (wf * (wf * 6 - 15) + 10);
  const X = xi & 255, Y = yi & 255;
  const X1 = (xi + 1) & 255, Y1 = (yi + 1) & 255;

  // slice 0
  const wb0 = wi & 255;
  const pY0 = PERM[(Y + wb0) & 255], pY10 = PERM[(Y1 + wb0) & 255];
  const aa0 = GVAL[PERM[(X + pY0) & 255]];
  const ba0 = GVAL[PERM[(X1 + pY0) & 255]];
  const ab0 = GVAL[PERM[(X + pY10) & 255]];
  const bb0 = GVAL[PERM[(X1 + pY10) & 255]];
  const top0 = aa0 + (ba0 - aa0) * u;
  const s0 = top0 + ((ab0 + (bb0 - ab0) * u) - top0) * v;

  // slice 1
  const wb1 = (wi + 1) & 255;
  const pY1 = PERM[(Y + wb1) & 255], pY11 = PERM[(Y1 + wb1) & 255];
  const aa1 = GVAL[PERM[(X + pY1) & 255]];
  const ba1 = GVAL[PERM[(X1 + pY1) & 255]];
  const ab1 = GVAL[PERM[(X + pY11) & 255]];
  const bb1 = GVAL[PERM[(X1 + pY11) & 255]];
  const top1 = aa1 + (ba1 - aa1) * u;
  const s1 = top1 + ((ab1 + (bb1 - ab1) * u) - top1) * v;

  return s0 + (s1 - s0) * s;
};

// Hierarchical streamfunction: a DOMINANT large-scale gesture (the big sweeping
// bands), a medium octave that gives those bands shape, and a whisper of fine
// filigree threaded inside. Weighting the big octave heavily is what turns the flow
// from uniform turbulence into a few legible ribbons with finer detail layered in.
// We finite-difference ψ for the curl, so keeping it smooth keeps the velocity smooth.
const psi = (x: number, y: number, w: number): number => {
  let f = 0;
  f += vnoise(x, y, w) * 1.00;                                          // large gesture
  f += vnoise(x * 2.15 + 11.7, y * 2.15 - 4.1, w * 1.7 + 3.0) * 0.34;   // medium shape
  f += vnoise(x * 4.30 - 7.9, y * 4.30 + 2.6, w * 2.6 - 5.0) * 0.11;    // fine filigree
  return f;
};

// ── Composition field ───────────────────────────────────────────────────────────
// A slow, very-low-frequency scalar that defines WHERE the light lives. We fold a
// smooth noise into a few ridged "corridors": values near 1 are the luminous spines
// of ribbons, values near 0 are negative space. The field morphs gently so corridors
// breathe and drift without ever flattening into uniform busy-ness. Returns [0,1].
const COMP_SCALE = 1.7;  // few cells across the frame → big, calm regions
// rotate the composition domain ~22° so corridors sweep DIAGONALLY across the frame
// instead of stacking into flat horizontal bands — more dynamic, more designed.
const COMP_COS = Math.cos(0.38), COMP_SIN = Math.sin(0.38);
const comp = (x: number, y: number, w: number): number => {
  const rx = x * COMP_COS - y * COMP_SIN;
  const ry = x * COMP_SIN + y * COMP_COS;
  // low-freq base in [-1,1]; a second softer slice adds organic asymmetry
  const n =
    vnoise(rx * COMP_SCALE + 30.0, ry * COMP_SCALE - 17.0, w * 0.6 + 50.0) * 0.80 +
    vnoise(rx * COMP_SCALE * 2.1 - 5.0, ry * COMP_SCALE * 2.1 + 9.0, w * 0.9 + 80.0) * 0.20;
  // ridge: |n| flipped so the zero-crossings (smooth corridors) become bright spines.
  const ridge = 1 - Math.abs(n);
  // shape the ridge into THIN corridors with wide dark gaps between (negative space).
  // A high knee keeps only the narrow spine of each ribbon, so the frame breathes.
  return smoothstep(0.62, 0.99, ridge);
};

// ── Palette ────────────────────────────────────────────────────────────────────
// A cohesive designed gradient sampled by a normalized key in [0,1]: deep indigo →
// royal violet → magenta → warm gold. Values are HDR-ish (allowed > 1) so the
// brightest stops bloom through the ACES tonemap. Stops are linear RGB.
type RGB = [number, number, number];
const STOPS: { t: number; c: RGB }[] = [
  { t: 0.00, c: [0.04, 0.05, 0.16] }, // near-black indigo
  { t: 0.22, c: [0.10, 0.10, 0.42] }, // deep blue
  { t: 0.44, c: [0.34, 0.13, 0.62] }, // royal violet
  { t: 0.64, c: [0.85, 0.20, 0.66] }, // magenta
  { t: 0.82, c: [1.05, 0.45, 0.42] }, // warm coral
  { t: 1.00, c: [1.15, 0.92, 0.50] }, // gold
];
const paletteR = new Float32Array(256);
const paletteG = new Float32Array(256);
const paletteB = new Float32Array(256);
{
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = STOPS[0], b = STOPS[STOPS.length - 1];
    for (let k = 0; k < STOPS.length - 1; k++) {
      if (t >= STOPS[k].t && t <= STOPS[k + 1].t) { a = STOPS[k]; b = STOPS[k + 1]; break; }
    }
    const f = smoothstep(a.t, b.t, t);
    paletteR[i] = lerp(a.c[0], b.c[0], f);
    paletteG[i] = lerp(a.c[1], b.c[1], f);
    paletteB[i] = lerp(a.c[2], b.c[2], f);
  }
}

// ── Particles (normalized world space) ──────────────────────────────────────────
// Stored in [0,1] x [0,1]; projected to pixels each frame. Independent of size, so
// the field reflows on resize without re-seeding.
const PARTICLES = 3800;
const px = new Float32Array(PARTICLES); // normalized x
const py = new Float32Array(PARTICLES); // normalized y
const pspd = new Float32Array(PARTICLES); // smoothed speed (for color)
const plife = new Float32Array(PARTICLES); // age, for respawn fade-in
const pseed = new Float32Array(PARTICLES); // per-particle palette offset
let respawnCursor = 0;
const prng = mulberry32(0xc0ffee01);

// Respawn INTO a corridor: rejection-sample a few candidate points against the
// composition field and keep the one most likely to sit on a luminous ribbon, so the
// negative space stays empty and the ribbons stay fed. `compW` is the current comp
// time-slice (and corridor aspect), threaded in from frame() so seeding stays
// deterministic and tracks the breathing composition.
let compW = 0;
let compAspect = 1;
const seedParticle = (i: number): void => {
  let bx = prng(), by = prng();
  let best = comp(bx, by * compAspect, compW);
  for (let k = 0; k < 7; k++) {
    const cx = prng(), cy = prng();
    const c = comp(cx, cy * compAspect, compW);
    // accept stronger corridor membership; keeps a little spread so edges read soft
    if (c > best) { best = c; bx = cx; by = cy; }
  }
  px[i] = bx;
  py[i] = by;
  pspd[i] = 0;
  plife[i] = prng() * 0.6; // stagger ages so trails fade in unevenly
  pseed[i] = prng() * 0.16 - 0.08; // small palette jitter for richness
};

let seeded = false;
const seedAll = (): void => {
  for (let i = 0; i < PARTICLES; i++) seedParticle(i);
  seeded = true;
};

// ── HDR accumulation buffer (display resolution) ────────────────────────────────
// Float RGB. Particles add into it; it decays every frame; we tonemap it to t.buf.
let accR = new Float32Array(0);
let accG = new Float32Array(0);
let accB = new Float32Array(0);
let bloom = new Float32Array(0); // scratch luminance for the separable bloom
let bloomTmp = new Float32Array(0);
let vigLUT = new Float32Array(0); // per-pixel vignette multiplier (position-only → cache)
let accW = 0, accH = 0;

const allocAccum = (W: number, H: number): void => {
  accW = W; accH = H;
  accR = new Float32Array(W * H);
  accG = new Float32Array(W * H);
  accB = new Float32Array(W * H);
  bloom = new Float32Array(W * H);
  bloomTmp = new Float32Array(W * H);
  // Precompute the cold vignette: it depends only on pixel position, so bake it once
  // per size instead of recomputing hypot+smoothstep for every pixel every frame.
  vigLUT = new Float32Array(W * H);
  const halfW = (W - 1) * 0.5, halfH = (H - 1) * 0.5;
  const invDiag = 1 / Math.hypot(halfW, halfH);
  let p = 0;
  for (let yy = 0; yy < H; yy++) {
    const dy = yy - halfH, dy2 = dy * dy;
    for (let xx = 0; xx < W; xx++) {
      const dx = xx - halfW;
      const vr = Math.sqrt(dx * dx + dy2) * invDiag;
      vigLUT[p++] = 1 - 0.62 * smoothstep(0.48, 1.12, vr);
    }
  }
};

// ── Field sampling ──────────────────────────────────────────────────────────────
// Velocity = curl of ψ at a world point, in normalized units/sec. We finite-
// difference ψ on the lattice. The lattice is sized so a handful of cells span the
// screen → broad, sweeping streamlines rather than fine turbulence.
const FIELD_SCALE = 2.3; // how many lattice cells span [0,1] → broad sweeping bands
const EPS = 0.0016; // finite-difference step (world units)
const FLOW_SPEED = 0.082; // base advection speed (normalized units/sec)
const SPEED_REF = 1.5; // reference curl-speed (≈ field mean) used to normalize color
const EXPOSURE = 4.4; // HDR exposure before the ACES tonemap

// ── Per-frame ───────────────────────────────────────────────────────────────────
const decayPow = (base: number, dt: number): number => Math.pow(base, dt * 60);

const frame = (t: Term, time: number, dt: number): void => {
  const W = t.W, H = t.H;
  if (accW !== W || accH !== H) allocAccum(W, H);
  if (!seeded) seedAll();

  const aspect = t.aspect; // W/H ; used to keep the flow isotropic on screen

  // The streamfunction's slow morph: a third-dimension drift makes ψ evolve.
  const wSlice = time * 0.10;
  // The composition (corridor) field drifts even slower so the negative space and
  // focal ribbons are stable enough to read as design, not flicker. Publish the
  // current slice/aspect so respawns this frame seed into the live corridors.
  compW = time * 0.035;
  compAspect = aspect;
  // A gentle global hue/light drift so the palette breathes over time.
  const hueDrift = 0.5 + 0.5 * Math.sin(time * 0.07);

  // Stabilize the advection step (don't let a long frame fling particles).
  const sdt = Math.min(dt, 1 / 30);

  // — Decay the accumulation buffer (silky trail persistence) —
  const fadeMul = decayPow(0.915, dt);
  for (let i = 0; i < accR.length; i++) { accR[i] *= fadeMul; accG[i] *= fadeMul; accB[i] *= fadeMul; }

  // — Advect + deposit every particle —
  // We sample ψ in an aspect-corrected space so streamlines look round, but advance
  // positions in pure normalized [0,1] space so wrapping/respawn is trivial.
  const fs = FIELD_SCALE;
  const invEps2 = 1 / (2 * EPS);
  for (let i = 0; i < PARTICLES; i++) {
    let x = px[i], y = py[i];

    // world sample coords (aspect-corrected so the field isn't stretched)
    const sx = x * fs;
    const sy = y * fs / aspect;

    // curl of ψ:  v = ( ∂ψ/∂y , −∂ψ/∂x )
    const dpx = (psi(sx + EPS, sy, wSlice) - psi(sx - EPS, sy, wSlice)) * invEps2;
    const dpy = (psi(sx, sy + EPS, wSlice) - psi(sx, sy - EPS, wSlice)) * invEps2;
    let vx = dpy;
    let vy = -dpx;

    // a faint large-scale rotational bias gives the whole piece a slow global swirl
    const cx = x - 0.5, cy = y - 0.5;
    vx += -cy * 0.10;
    vy += cx * 0.10;

    const sp = Math.sqrt(vx * vx + vy * vy) + 1e-6;
    // smoothed speed for stable coloring
    pspd[i] = pspd[i] * 0.86 + sp * 0.14;

    // membership in a luminous corridor (1) vs negative space (0). This gates how
    // much light the particle lays down and where it sits in the palette ramp.
    const cm = comp(x, y * aspect, compW);

    // advance along the streamline. We move at a roughly constant arc-length speed
    // (normalize then scale) so ribbons stay evenly drawn, but let local speed still
    // colour the trail. y is scaled by aspect so screen motion stays isotropic.
    const step = (FLOW_SPEED / sp) * sdt;
    x += vx * step;
    y += vy * step * aspect;

    plife[i] += dt;

    // respawn if it left the domain, stalled in a dead zone, drifted deep into the
    // negative space, or aged out — so particles never linger over-painting one spot
    // OR fogging up the void. Respawn (corridor-biased) keeps the ribbons fed.
    if (x < -0.02 || x > 1.02 || y < -0.02 || y > 1.02 || sp < 0.012 ||
        plife[i] > 12 || (cm < 0.04 && plife[i] > 1.2)) {
      seedParticle(i);
      x = px[i]; y = py[i];
    }

    px[i] = x; py[i] = y;

    // — deposit into the HDR buffer —
    const fx = x * (W - 1);
    const fy = y * (H - 1);
    const ix = fx | 0, iy = fy | 0;
    if (ix < 0 || iy < 0 || ix >= W - 1 || iy >= H - 1) continue;

    // normalized speed (≈0..1 for the bulk of the field; SPEED_REF ≈ field mean)
    const ns = pspd[i] / SPEED_REF;
    // palette key drives COLOR ACROSS the corridor: the cool indigo/violet base sits
    // at corridor EDGES (low cm), warming through magenta toward a gold SPINE (high
    // cm) where the light concentrates. Speed nudges it warmer at confluences and a
    // slow global drift + tiny per-particle jitter keep it alive — gold stays earned.
    const key = clamp01(0.12 + cm * 0.44 + ns * 0.20 + pseed[i] + hueDrift * 0.08);
    const pi = (key * 255) | 0;
    let cr = paletteR[pi], cg = paletteG[pi], cb = paletteB[pi];

    // fade-in newly respawned particles so they don't pop, and fade them back OUT
    // as they age so no single ribbon ever accumulates to a solid white smear.
    const birth = smoothstep(0, 0.6, plife[i]) * (1 - smoothstep(6, 11, plife[i]));
    // corridor gate: deposit scales with membership SQUARED so the negative space
    // goes truly dark (premium void) while ribbon spines carry the energy. This is
    // what turns a uniform busy field into a few intentional ribbons of light.
    const corridor = cm * cm;
    // a touch brighter where flow is fast → energy reads as light, but kept low so
    // the HDR buffer settles well below white and the palette stays visible.
    const intensity = (0.013 + ns * 0.030) * birth * (0.03 + 0.97 * corridor);
    cr *= intensity; cg *= intensity; cb *= intensity;

    // bilinear splat for sub-pixel-smooth ribbons
    const tx = fx - ix, ty = fy - iy;
    const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty, w11 = tx * ty;
    const o00 = iy * W + ix, o10 = o00 + 1, o01 = o00 + W, o11 = o01 + 1;
    accR[o00] += cr * w00; accG[o00] += cg * w00; accB[o00] += cb * w00;
    accR[o10] += cr * w10; accG[o10] += cg * w10; accB[o10] += cb * w10;
    accR[o01] += cr * w01; accG[o01] += cg * w01; accB[o01] += cb * w01;
    accR[o11] += cr * w11; accG[o11] += cg * w11; accB[o11] += cb * w11;
  }

  // — Bloom: build a luminance map of the bright confluences, blur it separably,
  //   and add it back. Cheap 5-tap horizontal+vertical box-ish blur. —
  buildBloom(W, H);

  // — Tonemap the HDR buffer to the 8-bit framebuffer —
  // Vignette is a precomputed per-pixel LUT; ACES inlined; writes go straight into
  // t.buf (aces() returns 0..1 so *255|0 can never exceed 255 — no clamp needed).
  const buf = t.buf;
  const N = W * H;
  let o = 0;
  for (let idx = 0; idx < N; idx++) {
    const vig = vigLUT[idx];
    const bl = bloom[idx];
    let R = (accR[idx] * EXPOSURE + bl * 0.70) * vig + 0.006;
    let G = (accG[idx] * EXPOSURE + bl * 0.62) * vig + 0.009;
    let B = (accB[idx] * EXPOSURE + bl * 0.95) * vig + 0.020;

    // ACES filmic, inlined (a=2.51 b=0.03 c=2.43 d=0.59 e=0.14), clamped to 0..1
    R = (R * (2.51 * R + 0.03)) / (R * (2.43 * R + 0.59) + 0.14);
    G = (G * (2.51 * G + 0.03)) / (G * (2.43 * G + 0.59) + 0.14);
    B = (B * (2.51 * B + 0.03)) / (B * (2.43 * B + 0.59) + 0.14);
    R = R < 0 ? 0 : R > 1 ? 1 : R;
    G = G < 0 ? 0 : G > 1 ? 1 : G;
    B = B < 0 ? 0 : B > 1 ? 1 : B;

    buf[o] = (R * 255) | 0;
    buf[o + 1] = (G * 255) | 0;
    buf[o + 2] = (B * 255) | 0;
    o += 3;
  }
};

// Separable bloom: threshold the accumulation luminance, blur it, store in `bloom`.
const buildBloom = (W: number, H: number): void => {
  // extract bright confluences into bloomTmp
  for (let i = 0; i < accR.length; i++) {
    const l = (accR[i] * 0.6 + accG[i] * 0.4 + accB[i] * 0.7) * EXPOSURE;
    const e = l - 0.85; // knee: only the brightest confluences bloom
    bloomTmp[i] = e > 0 ? e : 0;
  }
  // horizontal blur (5-tap) → bloom
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const x0 = x > 1 ? x - 2 : 0;
      const x1 = x > 0 ? x - 1 : 0;
      const x3 = x < W - 1 ? x + 1 : W - 1;
      const x4 = x < W - 2 ? x + 2 : W - 1;
      bloom[row + x] =
        bloomTmp[row + x0] * 0.12 + bloomTmp[row + x1] * 0.24 +
        bloomTmp[row + x] * 0.28 + bloomTmp[row + x3] * 0.24 + bloomTmp[row + x4] * 0.12;
    }
  }
  // vertical blur (5-tap) → bloomTmp → copy back to bloom
  for (let y = 0; y < H; y++) {
    const y0 = y > 1 ? y - 2 : 0;
    const y1 = y > 0 ? y - 1 : 0;
    const y3 = y < H - 1 ? y + 1 : H - 1;
    const y4 = y < H - 2 ? y + 2 : H - 1;
    const r0 = y0 * W, r1 = y1 * W, r = y * W, r3 = y3 * W, r4 = y4 * W;
    for (let x = 0; x < W; x++) {
      bloomTmp[r + x] =
        bloom[r0 + x] * 0.12 + bloom[r1 + x] * 0.24 +
        bloom[r + x] * 0.28 + bloom[r3 + x] * 0.24 + bloom[r4 + x] * 0.12;
    }
  }
  bloom.set(bloomTmp);
};

runDemo({
  title: 'Flow Field',
  hud: 'HIERARCHICAL CURL-NOISE - DESIGNED CORRIDORS + NEGATIVE SPACE - HDR TRAIL BLOOM',
  captureT: 7,
  init: (t) => {
    allocAccum(t.W, t.H);
    // Seed already aware of the t≈0 composition so the initial scatter lands in the
    // corridors, not the void (warmup at negative time refines it toward exactly t=0).
    compAspect = t.aspect;
    compW = -1.5 * 0.035;
    seedAll();
    // Pre-warm: develop ~1.5s of trails BEFORE t=0 so the very first displayed/
    // captured frame is already a living field, not a sparse scatter of seeds. We
    // run the real frame() with times in [-1.5, 0) so it ends exactly at the t=0
    // field state and the timeline stays continuous and deterministic.
    const warmDt = 1 / 60;
    for (let k = 90; k >= 1; k--) frame(t, -k * warmDt, warmDt);
  },
  frame,
});
