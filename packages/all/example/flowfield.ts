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
 * A FOCAL FLOW, not turbulence. ψ is DOMINATED by a smooth diagonal ramp — the
 * streamfunction of a uniform wind — so its curl is one clear sweeping current the eye
 * can follow. Noise octaves (a big gesture, a medium shape, a whisper of filigree) are
 * layered ON TOP to bend that wind into a few large, legible streamlines with finer
 * detail braided inside. A separate low-frequency COMPOSITION field lays a SMALL number
 * of broad RIBBONS by phasing one warped coordinate that runs across the flow, then a
 * slow envelope swells some stretches into a bright focal gesture while others recede —
 * so the frame reads as designed bands with wide NEGATIVE SPACE, never a busy barcode
 * or uniform knot. Particles in the void deposit almost nothing and respawn biased back
 * into a ribbon, so light concentrates into the bands and the surround stays near-black.
 *
 * Each particle deposits a thin ADDITIVE smear into a floating-point HDR accumulation
 * buffer; the whole buffer is MULTIPLIED DOWN a hair every frame, so trails persist as
 * silky ribbons that BLOOM where bands converge and fade where they thin. Color is
 * sampled from a hand-tuned cohesive gradient (deep indigo → teal-blue → violet →
 * magenta → warm coral → gold) indexed by where the particle sits ACROSS its ribbon —
 * a wide cool teal-blue BODY warming only at the bright SPINE — plus speed and a slow
 * drift, never garish. A COLORED separable bloom (each channel blurred) lets the warm
 * gold confluences glow warm and the cool bodies glow cool, an ACES filmic tonemap
 * grades the HDR to 8-bit, and a faint cold vignette keeps the void premium.
 *
 * Everything is in normalized/world space sampled analytically, so the whole field
 * reflows seamlessly on resize at any aspect ratio; the advected particle COUNT scales
 * with the pixel area so per-pixel glow (and cost) stays constant at any grid size — no
 * small-window blowout. All randomness is mulberry32-seeded → captures are
 * deterministic; motion is purely a function of time.
 *
 * Technique: directional-wind + noise streamfunction (one focal sweep, fine detail,
 * divergence-free advection) · phased-band composition field for negative space + a
 * focal swell envelope · across-ribbon cool→warm color ramp · HDR additive trail
 * accumulation with decay · COLORED separable bloom · ACES tonemap · resolution-scaled
 * particle subset for constant density + seamless resize.
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
//
// Crucially, ψ is dominated by a SMOOTH DIAGONAL RAMP (a linear streamfunction whose
// curl is a constant sweeping wind). Layering noise on top bends that wind into a few
// large, legible streamlines instead of a directionless turbulent knot — so the eye
// gets one clear focal flow with finer detail braided inside it.
const FLOW_DIRX = 0.92, FLOW_DIRY = -0.40; // the dominant sweep direction (normalized-ish)
const psi = (x: number, y: number, w: number): number => {
  // ψ of a uniform wind is the perpendicular linear ramp; curl(ψ)=constant wind.
  let f = (x * FLOW_DIRY - y * FLOW_DIRX) * 3.6;                        // dominant sweep
  f += vnoise(x, y, w) * 2.05;                                          // large gesture
  f += vnoise(x * 2.15 + 11.7, y * 2.15 - 4.1, w * 1.7 + 3.0) * 0.40;   // medium shape
  f += vnoise(x * 4.30 - 7.9, y * 4.30 + 2.6, w * 2.6 - 5.0) * 0.10;    // fine filigree
  return f;
};

// ── Composition field ───────────────────────────────────────────────────────────
// A slow, very-low-frequency scalar that defines WHERE the light lives, returning
// [0,1]: ~1 along the luminous SPINE of a ribbon, 0 in negative space.
//
// Instead of a high-frequency ridge (which fragments into many thin scattered strands
// and reads as busy turbulence), we lay down a SMALL number of broad bands by phasing
// a single low-frequency coordinate that runs ACROSS the focal flow. A gentle warp
// bends those bands into organic sweeping ribbons that fill the whole frame, and a
// soft profile keeps each ribbon WIDE with generous dark gaps between — designed
// negative space, not noise. The field drifts slowly so ribbons breathe and migrate.
const COMP_BANDS = 2.05; // ~2 ribbons across the frame → big, legible, balanced
// the banding coordinate runs PERPENDICULAR to the focal sweep so ribbons align with
// (and braid through) the dominant flow rather than cutting against it.
const BAND_NX = 0.40, BAND_NY = 0.92; // ⟂ to (FLOW_DIRX,FLOW_DIRY)
// Scratch outputs published by comp() so the deposit can colour ACROSS the ribbon
// independently of how bright the focal envelope makes that stretch. compBand is the
// raw across-ribbon position (0 at the edge/gap, 1 on the spine) — that's what should
// drive the cool-edge→warm-spine colour ramp, NOT the gated brightness.
let compBand = 0; // last comp() across-ribbon profile [0,1]
const comp = (x: number, y: number, w: number): number => {
  // coordinate across the ribbons, in [0,1]-ish; centered so warp is symmetric
  const across = x * BAND_NX + y * BAND_NY;
  const along = x * FLOW_DIRX + y * FLOW_DIRY;
  // organic warp: bend the bands with a slow low-freq noise that varies ALONG the
  // flow, so straight bands become sweeping, curving ribbons (not a barcode). A
  // second finer warp adds life without breaking the few-large-shapes read.
  const warp =
    vnoise(along * 1.05 + 8.0, across * 0.7 - 3.0, w * 0.5 + 50.0) * 0.52 +
    vnoise(along * 2.4 - 4.0, across * 1.5 + 9.0, w * 0.8 + 80.0) * 0.16;
  // phase the bands: a cosine of the warped across-coordinate gives smooth periodic
  // ribbons. (-cos+1)/2 in [0,1], peak=1 on the spine.
  const phase = (across + warp) * COMP_BANDS * TAU;
  const band = 0.5 - 0.5 * Math.cos(phase); // 1 at spine, 0 in the gap
  const profile = smoothstep(0.18, 0.92, band); // broad ribbon body, soft edges, dark gaps
  compBand = profile; // publish across-ribbon position for the colour ramp
  // BREAK the regular striping: a slow large-scale envelope makes some stretches of
  // ribbon swell into a bright FOCAL flow while others thin toward dark — so it reads
  // as a few designed gestures with negative space, not evenly-spaced parallel lines.
  const env =
    vnoise(along * 0.85 - 12.0, across * 0.95 + 4.0, w * 0.4 + 120.0) * 0.5 + 0.5; // [0,1]
  const focal = 0.55 + 0.45 * smoothstep(0.28, 0.82, env); // dim ribbons recede, focal ones bloom
  // brightness gate = ribbon profile × focal envelope: generous negative space, broad
  // smooth ribbon cores, a few intentional bands swelling into focal gestures.
  return profile * focal;
};

// ── Palette ────────────────────────────────────────────────────────────────────
// A cohesive designed gradient sampled by a normalized key in [0,1], reading from the
// cool EDGES of a ribbon to its luminous warm SPINE: deep indigo void → teal-touched
// blue → royal violet → soft magenta → warm amber → gold. The cool teal/blue range
// is wide (it carries most of the frame, keeping the piece restrained and premium),
// magenta is brief, and gold is RESERVED for the brightest confluence spines so it
// stays earned, not garish. Values are HDR-ish (>1 at the top) so the brightest stops
// bloom through the ACES tonemap. Stops are linear RGB.
type RGB = [number, number, number];
const STOPS: { t: number; c: RGB }[] = [
  { t: 0.00, c: [0.03, 0.05, 0.13] }, // near-black indigo void
  { t: 0.18, c: [0.04, 0.14, 0.36] }, // deep ocean blue
  { t: 0.38, c: [0.07, 0.30, 0.56] }, // luminous teal-blue (cool ribbon body)
  { t: 0.54, c: [0.24, 0.22, 0.62] }, // indigo-violet
  { t: 0.70, c: [0.62, 0.22, 0.64] }, // soft magenta
  { t: 0.85, c: [1.05, 0.45, 0.40] }, // warm coral
  { t: 1.00, c: [1.35, 0.92, 0.42] }, // gold spine (warm, low green/blue so it stays gold lit)
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
// COLORED bloom: blur each channel's bright excess so warm gold spines bloom warm and
// the cool ribbon bodies bloom cool — the glow reinforces the palette instead of
// washing confluences toward a flat white/blue. Three channels + one scratch row buffer.
let bloomR = new Float32Array(0);
let bloomG = new Float32Array(0);
let bloomB = new Float32Array(0);
let bloomTmp = new Float32Array(0);
let vigLUT = new Float32Array(0); // per-pixel vignette multiplier (position-only → cache)
let accW = 0, accH = 0;

const allocAccum = (W: number, H: number): void => {
  accW = W; accH = H;
  accR = new Float32Array(W * H);
  accG = new Float32Array(W * H);
  accB = new Float32Array(W * H);
  bloomR = new Float32Array(W * H);
  bloomG = new Float32Array(W * H);
  bloomB = new Float32Array(W * H);
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
const SPEED_REF = 1.9; // reference curl-speed (≈ field mean) used to normalize color
const EXPOSURE = 3.3; // HDR exposure before the ACES tonemap (tuned so ribbons keep colour, not blow to white)

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

  // RESOLUTION-NORMALIZED deposit: brightness must not depend on grid size. A fixed
  // particle count splatting into a SMALL grid packs many particles per pixel (→ white
  // blowout); into a LARGE grid, few per pixel (→ faint). Scale each deposit by
  // pixels-per-particle relative to a reference so the integrated glow is the same at
  // 110×68 and 300×180. Clamped so extreme sizes stay tasteful.
  // Keep particles-per-pixel roughly CONSTANT across grid sizes by advecting only an
  // active SUBSET scaled to the pixel count (the rest stay dormant). This is what kills
  // the small-window white blowout at its source — a 110×68 grid runs far fewer
  // particles than a 300×180 one — and it also saves work on small terminals.
  const REF_PPP = 0.075; // target particles per pixel
  let activeCount = Math.round(W * H * REF_PPP);
  if (activeCount < 700) activeCount = 700;        // floor: keep the field alive when tiny
  if (activeCount > PARTICLES) activeCount = PARTICLES;

  // — Decay the accumulation buffer (silky trail persistence) —
  const fadeMul = decayPow(0.915, dt);
  for (let i = 0; i < accR.length; i++) { accR[i] *= fadeMul; accG[i] *= fadeMul; accB[i] *= fadeMul; }

  // — Advect + deposit every particle —
  // We sample ψ in an aspect-corrected space so streamlines look round, but advance
  // positions in pure normalized [0,1] space so wrapping/respawn is trivial.
  const fs = FIELD_SCALE;
  const invEps2 = 1 / (2 * EPS);
  for (let i = 0; i < activeCount; i++) {
    let x = px[i], y = py[i];

    // world sample coords (aspect-corrected so the field isn't stretched)
    const sx = x * fs;
    const sy = y * fs / aspect;

    // curl of ψ:  v = ( ∂ψ/∂y , −∂ψ/∂x )
    const dpx = (psi(sx + EPS, sy, wSlice) - psi(sx - EPS, sy, wSlice)) * invEps2;
    const dpy = (psi(sx, sy + EPS, wSlice) - psi(sx, sy - EPS, wSlice)) * invEps2;
    const vx = dpy;
    const vy = -dpx;
    // No global rotational bias: the dominant directional wind baked into ψ already
    // gives one clear focal sweep, and a swirl on top of it just pools particles into
    // a corner (lopsided frame). Letting the wind carry them keeps the frame balanced.

    const sp = Math.sqrt(vx * vx + vy * vy) + 1e-6;
    // smoothed speed for stable coloring
    pspd[i] = pspd[i] * 0.86 + sp * 0.14;

    // membership in a luminous corridor (1) vs negative space (0). This gates how
    // much light the particle lays down. comp() also publishes compBand = the raw
    // across-ribbon position, which we read right after for the colour ramp.
    const cm = comp(x, y * aspect, compW);
    const bandPos = compBand; // 0 at ribbon edge, 1 on the spine

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
    // Colour ACROSS the ribbon, driven by bandPos (edge→spine), NOT by brightness —
    // so a dim ribbon and the focal one share the same cohesive cool-edge→warm-spine
    // gradient. The cool teal-blue body owns the broad mid-ribbon; only the very spine
    // (bandPos→1, helped by speed) tips into magenta→gold. bandPos^1.8 keeps the warm
    // end RESERVED, and the 0.28 base anchors the body in luminous teal-blue.
    const bWarm = bandPos * bandPos * bandPos * (1.3 - 0.3 * bandPos); // ≈ bandPos^2.6, warm reserved
    const key = clamp01(0.26 + bWarm * 0.56 + ns * 0.10 + pseed[i] + hueDrift * 0.05);
    const pi = (key * 255) | 0;
    let cr = paletteR[pi], cg = paletteG[pi], cb = paletteB[pi];

    // fade-in newly respawned particles so they don't pop, and fade them back OUT
    // as they age so no single ribbon ever accumulates to a solid white smear.
    const birth = smoothstep(0, 0.6, plife[i]) * (1 - smoothstep(6, 11, plife[i]));
    // corridor gate: deposit scales with membership so the negative space goes truly
    // dark (premium void) while ribbon bodies carry the energy. A gentle ~1.6 power
    // (cheap polynomial, no sqrt) keeps the void clean yet lets the cool teal ribbon
    // BODY (mid cm) read as light, not just the hot spine — so the cohesive cool→warm
    // gradient is actually visible across each ribbon.
    const corridor = cm * (1.3 - 0.3 * cm); // ≈ cm^1.2 — broad body reads, void stays clean
    // a touch brighter where flow is fast → energy reads as light, but kept low so the
    // HDR buffer settles well below white and the palette stays visible. (Per-pixel
    // density is held constant across grid sizes by the active-subset count above, so
    // no size-dependent blowout — this stays a fixed deposit weight.)
    const intensity = (0.013 + ns * 0.024) * birth * (0.02 + 0.98 * corridor);
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
    // colored bloom (warm where the gold spines confluence, cool along the bodies),
    // plus a faint cold ambient floor that keeps the void premium and slightly blue.
    let R = (accR[idx] * EXPOSURE + bloomR[idx] * 0.55) * vig + 0.006;
    let G = (accG[idx] * EXPOSURE + bloomG[idx] * 0.55) * vig + 0.010;
    let B = (accB[idx] * EXPOSURE + bloomB[idx] * 0.60) * vig + 0.024;

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

// Separable 5-tap blur of `dst` in place, via the shared `bloomTmp` scratch.
const blurChannel = (dst: Float32Array, W: number, H: number): void => {
  // horizontal: dst → bloomTmp
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const x0 = x > 1 ? x - 2 : 0;
      const x1 = x > 0 ? x - 1 : 0;
      const x3 = x < W - 1 ? x + 1 : W - 1;
      const x4 = x < W - 2 ? x + 2 : W - 1;
      bloomTmp[row + x] =
        dst[row + x0] * 0.12 + dst[row + x1] * 0.24 +
        dst[row + x] * 0.28 + dst[row + x3] * 0.24 + dst[row + x4] * 0.12;
    }
  }
  // vertical: bloomTmp → dst
  for (let y = 0; y < H; y++) {
    const y0 = y > 1 ? y - 2 : 0;
    const y1 = y > 0 ? y - 1 : 0;
    const y3 = y < H - 1 ? y + 1 : H - 1;
    const y4 = y < H - 2 ? y + 2 : H - 1;
    const r0 = y0 * W, r1 = y1 * W, r = y * W, r3 = y3 * W, r4 = y4 * W;
    for (let x = 0; x < W; x++) {
      dst[r + x] =
        bloomTmp[r0 + x] * 0.12 + bloomTmp[r1 + x] * 0.24 +
        bloomTmp[r + x] * 0.28 + bloomTmp[r3 + x] * 0.24 + bloomTmp[r4 + x] * 0.12;
    }
  }
};

// COLORED separable bloom: extract each channel's bright excess above a luminance
// knee, then blur the three channels. Because the bloom carries the local hue, warm
// gold spines bloom WARM and cool ribbon bodies bloom cool — the glow reinforces the
// palette at confluences instead of flattening them toward white. Cheap enough (we
// have huge perf headroom) and a real lift in how the light reads.
const buildBloom = (W: number, H: number): void => {
  const n = accR.length;
  for (let i = 0; i < n; i++) {
    const r = accR[i] * EXPOSURE, g = accG[i] * EXPOSURE, b = accB[i] * EXPOSURE;
    const l = r * 0.6 + g * 0.4 + b * 0.7;
    const e = l - 0.92; // high knee: only the brightest gold confluences bloom (keep it earned)
    if (e > 0) {
      // weight each channel by its share of the luminance so the bloom keeps the hue
      const inv = e / (l + 1e-5);
      bloomR[i] = r * inv;
      bloomG[i] = g * inv;
      bloomB[i] = b * inv;
    } else {
      bloomR[i] = 0; bloomG[i] = 0; bloomB[i] = 0;
    }
  }
  blurChannel(bloomR, W, H);
  blurChannel(bloomG, W, H);
  blurChannel(bloomB, W, H);
};

runDemo({
  title: 'Flow Field',
  hud: 'CURL-NOISE FOCAL FLOW - DESIGNED RIBBONS + NEGATIVE SPACE - HDR COLORED BLOOM',
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
