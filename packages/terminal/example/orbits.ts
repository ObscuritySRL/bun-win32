/**
 * Orbits — build galaxies with gravity, in your terminal.
 *
 * A direct N-body gravitational sandbox rendered into a half-block TRUECOLOR
 * framebuffer with an HDR additive motion-blur trail buffer and an ACES filmic
 * tonemap. A dense SPIRAL MINI-GALAXY of hundreds of bodies attracts under
 * Newtonian gravity with a HIERARCHICAL split — a handful of heavy suns attract one
 * another fully (O(M²)) while the swarm of light disk stars are cheap test particles
 * that feel only the suns (O(N·M)) — all with
 * PLUMMER SOFTENING (a = −G·m·d / (|d|²+ε²)^{3/2}) so close passes stay finite and
 * orbits integrate cleanly, advanced with a symplectic LEAPFROG (kick-drift-kick)
 * step that conserves energy far better than Euler — so seeded systems settle into
 * stable, visibly CURVED orbits instead of spiralling out or collapsing to noise.
 *
 * When two bodies approach within their merged radius they MERGE: the survivor takes
 * the summed mass and the momentum-conserving mass-weighted velocity & position, so
 * the system ACCRETES — small bodies fall together into ever brighter, heavier suns.
 * Each body is a hot HDR point whose colour is driven by mass AND speed (heavy/fast →
 * blue-white, light/slow → warm amber) splatted with a soft Gaussian footprint into a
 * persistent float buffer that is faded a hair each frame; the trails it leaves bloom
 * along the curved paths and an ACES grade keeps the bright suns from clipping the
 * velvet-black void. A separable bloom lifts a soft halo off the brightest bodies.
 *
 * Everything is normalized world space → it reflows on resize. All randomness is
 * mulberry32-seeded and all motion is a pure function of the sim clock, so captures
 * are deterministic.
 *
 * INTERACTION (live):
 *   • CLICK places a star.  CLICK-DRAG-RELEASE flings it (slingshot — velocity ∝ the
 *     drag vector), showing an aiming line + a ghost prediction trail while you hold.
 *   • WHEEL changes the mass of the next star you place (shown by the cursor ring).
 *   • 'g' toggles a heavy central attractor that pins the system into orbits.
 *   • SPACE pauses, 'q'/ESC quits.
 * ATTRACT (no input / idle): a pre-built multi-body system — a heavy primary with a
 *   retinue of planets on near-circular orbits plus a captured binary and a few
 *   eccentric comets — is seeded and left to evolve into legible orbits and accretion.
 *
 * Technique: hierarchical N-body gravity (O(M²) suns + O(N·M) test-particle disk) ·
 *   Plummer softening · symplectic leapfrog
 *   (kick-drift-kick) · momentum-conserving mass-weighted merge/accretion · HDR
 *   additive trail buffer with per-frame decay · mass/speed temperature colour ·
 *   separable bloom · ACES tonemap · normalized-space bodies for seamless resize.
 *
 * Run: bun run packages/all/example/orbits.ts
 */
import { run, Term } from '@bun-win32/terminal';

import { clamp, clamp01, lerp, smoothstep, mulberry32, TAU } from './_kit';

// ── Simulation constants (normalized world units; the frame spans ~[-1,1]) ──────
const MAX_BODIES = 360; // a dense disk of glowing stars — a real mini-galaxy
const G = 0.0011; // gravitational constant (tuned for graceful orbits)
const SIM_RATE = 2.35; // wall→sim time scale (more visible revolutions per second)
const SOFT = 0.012; // Plummer softening length ε
const SOFT2 = SOFT * SOFT;
const MERGE_K = 0.48; // merge when separation < MERGE_K·(rA+rB) (visual radii)
const WORLD = 1.18; // half-extent of the visible world (x in [-WORLD,WORLD])
const ESCAPE = WORLD * 3.4; // beyond this a body is gone (culled)
const MASS_MIN = 0.004; // mass of the lightest placeable body
const MASS_STEPS = [0.01, 0.03, 0.08, 0.22, 0.55, 1.3]; // wheel-cycled placement masses
const ATTRACT_MASS = 3.2; // mass of the central 'g' attractor
// Hierarchical N-body: bodies at/above this mass are MASSIVE (mutually attract,
// full O(M²)); lighter disk stars are TEST PARTICLES that only feel the massive
// bodies (O(N·M)). The disk is overwhelmingly dominated by the central mass, so
// this is physically faithful AND lets us run HUNDREDS of glowing orbits cheaply.
const MASS_TEST = 0.05; // < this ⇒ treated as a (near-)massless disk star

// ── Body state (struct-of-arrays; allocated once) ───────────────────────────────
const bx = new Float64Array(MAX_BODIES); // position x (world)
const by = new Float64Array(MAX_BODIES); // position y (world)
const bvx = new Float64Array(MAX_BODIES); // velocity x
const bvy = new Float64Array(MAX_BODIES); // velocity y
const bm = new Float64Array(MAX_BODIES); // mass
const bax = new Float64Array(MAX_BODIES); // accel x (kept between half-kicks)
const bay = new Float64Array(MAX_BODIES); // accel y
const bspd = new Float32Array(MAX_BODIES); // smoothed speed (for colour)
const bage = new Float32Array(MAX_BODIES); // age in seconds (spawn fade-in)
const bpinned = new Uint8Array(MAX_BODIES); // 1 = central attractor (held fixed-ish)
const bpx = new Float32Array(MAX_BODIES); // previous splat screen x (px); <0 = none yet
const bpy = new Float32Array(MAX_BODIES); // previous splat screen y (px)
let nBodies = 0;

// Compact index list of the MASSIVE bodies (rebuilt each accel pass). Bounded by
// the small number of suns/heavy bodies — the disk stars never enter it.
const massiveIdx = new Int32Array(MAX_BODIES);
let nMassive = 0;

// Visual + collision radius from mass (∝ m^{1/3}, like a constant-density sphere).
// Tightened so disk stars read as CRISP points and even the primary keeps a small
// hot core rather than a fat blob — many interleaving filaments, not few fireballs.
const radiusOf = (m: number): number => 0.01 + 0.04 * Math.cbrt(m);

const clearBodies = (): void => {
  nBodies = 0;
};

const addBody = (x: number, y: number, vx: number, vy: number, m: number, pinned = false): number => {
  if (nBodies >= MAX_BODIES) {
    // Replace the lightest unpinned body so new placements always register.
    let li = -1,
      lm = Infinity;
    for (let i = 0; i < nBodies; i++) {
      if (bpinned[i]) continue;
      if (bm[i] < lm) {
        lm = bm[i];
        li = i;
      }
    }
    if (li < 0) return -1;
    bx[li] = x;
    by[li] = y;
    bvx[li] = vx;
    bvy[li] = vy;
    bm[li] = m;
    bax[li] = 0;
    bay[li] = 0;
    bspd[li] = 0;
    bage[li] = 0;
    bpinned[li] = pinned ? 1 : 0;
    bpx[li] = -1;
    bpy[li] = -1;
    return li;
  }
  const i = nBodies++;
  bx[i] = x;
  by[i] = y;
  bvx[i] = vx;
  bvy[i] = vy;
  bm[i] = m;
  bax[i] = 0;
  bay[i] = 0;
  bspd[i] = 0;
  bage[i] = 0;
  bpinned[i] = pinned ? 1 : 0;
  bpx[i] = -1;
  bpy[i] = -1;
  return i;
};

const removeBody = (i: number): void => {
  const last = --nBodies;
  if (i !== last) {
    bx[i] = bx[last];
    by[i] = by[last];
    bvx[i] = bvx[last];
    bvy[i] = bvy[last];
    bm[i] = bm[last];
    bax[i] = bax[last];
    bay[i] = bay[last];
    bspd[i] = bspd[last];
    bage[i] = bage[last];
    bpinned[i] = bpinned[last];
    bpx[i] = bpx[last];
    bpy[i] = bpy[last];
  }
};

// ── Temperature LUT: 0 = warm amber (light/slow) → 1 = blue-white (heavy/fast) ──
const TEMP_R = new Float32Array(256);
const TEMP_G = new Float32Array(256);
const TEMP_B = new Float32Array(256);
{
  for (let i = 0; i < 256; i++) {
    const tc = i / 255;
    let r: number, g: number, b: number;
    // Stellar blackbody-like ramp pushed for tonal RANGE: deep ember → gold → white →
    // electric blue-white → cold cyan-ice. The cool half is given more of the LUT and
    // pulled bluer so fast/heavy bodies read unmistakably BLUE against the warm orbits.
    if (tc > 0.78) {
      const k = (tc - 0.78) / 0.22;
      r = lerp(0.62, 0.42, k);
      g = lerp(0.84, 0.74, k);
      b = lerp(1.0, 1.0, k); // blue-white → cold cyan ice
    } else if (tc > 0.5) {
      const k = (tc - 0.5) / 0.28;
      r = lerp(0.98, 0.62, k);
      g = lerp(0.97, 0.84, k);
      b = lerp(0.92, 1.0, k); // white → electric blue-white
    } else if (tc > 0.22) {
      const k = (tc - 0.22) / 0.28;
      r = lerp(1.0, 0.98, k);
      g = lerp(0.64, 0.97, k);
      b = lerp(0.24, 0.92, k); // gold → cool white
    } else {
      const k = tc / 0.22;
      r = lerp(1.0, 1.0, k);
      g = lerp(0.34, 0.64, k);
      b = lerp(0.07, 0.24, k); // deep ember → gold
    }
    TEMP_R[i] = r;
    TEMP_G[i] = g;
    TEMP_B[i] = b;
  }
}

// ── HDR trail buffer + bloom scratch (per size) ──────────────────────────────────
let accR = new Float32Array(0);
let accG = new Float32Array(0);
let accB = new Float32Array(0);
let bloomA = new Float32Array(0); // half-res bright pass, RGB
let bloomB = new Float32Array(0);
let starBuf = new Float32Array(0); // baked deep-space starfield + faint halo
let vigBuf = new Float32Array(0); // baked vignette
let accW = 0,
  accH = 0,
  bw = 0,
  bh = 0;

const allocForSize = (W: number, H: number, aspect: number): void => {
  accW = W;
  accH = H;
  accR = new Float32Array(W * H);
  accG = new Float32Array(W * H);
  accB = new Float32Array(W * H);
  bw = W >> 1 || 1;
  bh = H >> 1 || 1;
  bloomA = new Float32Array(bw * bh * 3);
  bloomB = new Float32Array(bw * bh * 3);

  const cx = W * 0.5,
    cy = H * 0.5;
  const maxR = Math.hypot(cx, cy);
  starBuf = new Float32Array(W * H * 3);
  const srng = mulberry32(0x9e3779b1);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 3;
      const d = Math.hypot(x - cx, y - cy) / maxR;
      // broad cool ambient halo (deep indigo so the void stays velvet, not muddy)
      const g = clamp01(1 - d * 1.6);
      const g3 = g * g * g;
      // tight core haze (dusty galactic-core glow framing the system). TIGHTENED:
      // a steeper falloff (d·4.0) shrinks the central nebula to a compact luminous
      // bulge so it frames the disk instead of swallowing it — the many crisp orbits
      // and blue-hot suns carry the colour, not a fat warm wash around one fireball.
      const core = clamp01(1 - d * 4.0);
      const c2 = core * core * core;
      // The tight central bulge is pushed BLUER (less red, more blue) so the nucleus
      // anchors as a cool blue-hot core rather than a warm haze — sharpening the
      // blue-centre vs amber-arm range. The broad ambient halo stays deep indigo.
      starBuf[o] = 0.0005 + 0.0009 * g3 + 0.0018 * c2;
      starBuf[o + 1] = 0.001 + 0.0017 * g3 + 0.0034 * c2;
      starBuf[o + 2] = 0.0024 + 0.0048 * g3 + 0.0078 * c2;
    }
  }
  const addStar = (b: number): void => {
    const x = (srng() * W) | 0;
    const y = (srng() * H) | 0;
    const o = (y * W + x) * 3;
    const tint = srng();
    const warm = clamp01(1 - tint * 1.6);
    const cool = clamp01(tint * 1.6 - 0.6);
    starBuf[o] += b * (0.88 + 0.12 * warm);
    starBuf[o + 1] += b * (0.86 + 0.08 * warm + 0.06 * cool);
    starBuf[o + 2] += b * (0.82 + 0.18 * cool);
  };
  const nDim = Math.floor(W * H * 0.01);
  for (let s = 0; s < nDim; s++) {
    const u = srng();
    addStar(0.02 + u * u * 0.16);
  }
  const nBright = Math.floor(W * H * 0.0012);
  for (let s = 0; s < nBright; s++) {
    const u = srng();
    addStar(0.22 + u * u * 0.42);
  }

  vigBuf = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / aspect,
        dy = y - cy;
      const d = Math.hypot(dx, dy) / Math.hypot(cx / aspect, cy);
      vigBuf[y * W + x] = 1 - 0.46 * Math.pow(clamp01(d), 2.2);
    }
  }
};

// ── World ↔ screen projection (world x in [-WORLD,WORLD], y aspect-corrected) ────
// scaleX/scaleY/cx/cy refreshed each frame from t; stored so input mapping matches.
let projCx = 0,
  projCy = 0,
  projSx = 1,
  projSy = 1;
const worldToScreenX = (wx: number): number => projCx + wx * projSx;
const worldToScreenY = (wy: number): number => projCy + wy * projSy;
const screenToWorldX = (px: number): number => (px - projCx) / projSx;
const screenToWorldY = (py: number): number => (py - projCy) / projSy;

// ── Deterministic attract system seeded once (or on respawn / 'c') ───────────────
// A dense spiral mini-galaxy: a dominant primary, a few medium anchor-suns that
// pull stragglers, and a SWARM of ~200 disk stars on near-circular prograde orbits
// laid along two log-spiral arms — many interleaving glowing filaments, not a few
// fat blobs. Disk stars are test particles (cheap) so the count can be large.
const SPIRAL_ARMS = 2;
const SPIRAL_PITCH = 4.1; // radians of wind per unit radius (arm tightness)
const seedAttractSystem = (): void => {
  clearBodies();
  const rng = mulberry32(0x0b175ee5 >>> 0);
  // Circular-orbit speed about a point mass M at radius r (softened).
  const vCirc = (r: number, M: number): number => Math.sqrt((G * M * r * r) / Math.pow(r * r + SOFT2, 1.5));

  // Heavy primary at centre — dominant but not gigantic, so the disk reads.
  const primM = 2.2;
  addBody(0, 0, 0, 0, primM, false);

  // A few medium ANCHOR suns on wide prograde orbits: extra gravitational centres
  // that warp the disk and give the eye bright secondary nuclei. These are massive
  // (mutually attract) so they accrete dust and slowly migrate — visible structure.
  const nAnchors = 3;
  for (let k = 0; k < nAnchors; k++) {
    const r = 0.46 + k * 0.22 + rng() * 0.05;
    const ang = (k / nAnchors) * TAU + rng() * 0.4;
    const ca = Math.cos(ang),
      sa = Math.sin(ang);
    const v = vCirc(r, primM) * (0.95 + rng() * 0.06);
    const m = 0.12 + rng() * 0.1;
    addBody(r * ca, r * sa, -sa * v, ca * v, m, false);
  }

  // The DISK: a dense swarm of light stars on prograde orbits, biased onto
  // SPIRAL_ARMS log-spiral arms so the swarm reads as spiral structure. Each star
  // gets a small velocity-dispersion kick so the arms have eccentric, crossing
  // orbits (the legible curved filaments) rather than a flat featureless annulus.
  const nDisk = 224;
  for (let k = 0; k < nDisk; k++) {
    // radius: concentrated toward the core (∝ u²) but reaching the rim
    const u = rng();
    const r = 0.07 + (0.86 - 0.07) * (u * u * 0.55 + u * 0.45);
    // pick an arm, place the star near its log-spiral angle θ = arm + pitch·ln(r)
    const arm = (((rng() * SPIRAL_ARMS) | 0) / SPIRAL_ARMS) * TAU;
    const spiralAng = arm + SPIRAL_PITCH * Math.log(r / 0.07);
    // scatter around the arm centreline (tighter near core where arms are crisp)
    const scatter = (rng() - 0.5) * (0.55 + 0.9 * r);
    const ang = spiralAng + scatter;
    const ca = Math.cos(ang),
      sa = Math.sin(ang);
    const v = vCirc(r, primM) * (0.93 + rng() * 0.1);
    // tangential (prograde) + a little radial dispersion for eccentric orbits
    const disp = (rng() - 0.5) * v * 0.18;
    const vx = -sa * v + ca * disp,
      vy = ca * v + sa * disp;
    const m = MASS_MIN + rng() * rng() * 0.02; // all light → test particles
    addBody(r * ca, r * sa, vx, vy, m, false);
  }

  // A captured binary pair out on the rim, orbiting each other while they fall in.
  {
    const r = 0.7,
      ang = 2.1;
    const ca = Math.cos(ang),
      sa = Math.sin(ang);
    const cxp = r * ca,
      cyp = r * sa;
    const vorb = vCirc(r, primM) * 0.92;
    const ovx = -sa * vorb,
      ovy = ca * vorb;
    const sep = 0.045;
    const pm = 0.13;
    const vrel = Math.sqrt((G * pm) / (sep + SOFT)) * 0.7;
    addBody(cxp - sa * sep, cyp + ca * sep, ovx + ca * vrel, ovy + sa * vrel, pm, false);
    addBody(cxp + sa * sep, cyp - ca * sep, ovx - ca * vrel, ovy - sa * vrel, pm, false);
  }
  // A few eccentric comets diving past the primary on plunging ellipses.
  for (let k = 0; k < 6; k++) {
    const r = 0.8 + rng() * 0.3;
    const ang = rng() * TAU;
    const ca = Math.cos(ang),
      sa = Math.sin(ang);
    const v = vCirc(r, primM) * (0.4 + rng() * 0.2); // sub-circular → plunging ellipse
    addBody(r * ca, r * sa, -sa * v, ca * v, MASS_MIN + rng() * 0.015, false);
  }
};

// ── Sim state / interaction ──────────────────────────────────────────────────────
let initialized = false;
let lastUserT = -1e9; // sim time of last user interaction
let attractActive = true; // currently running the scripted attract performance
let attractGToggled = false; // has attract already added its central attractor

let nextMassIdx = 2; // index into MASS_STEPS for the next placed body
let gAttractor = false; // is the user-controlled central attractor present
let gAttractorIdx = -1;

// drag/slingshot state
let dragging = false;
let dragStartX = 0,
  dragStartY = 0; // world coords where the press began
let dragCurX = 0,
  dragCurY = 0; // current cursor (world)
let lastMouseSeq = -1;
let lastDown = false;

const findPinned = (): number => {
  for (let i = 0; i < nBodies; i++) if (bpinned[i]) return i;
  return -1;
};

// ── Physics: leapfrog kick-drift-kick, hierarchical gravity + Plummer softening ──
// Massive↔massive is full O(M²); the dense disk are test particles → O(N·M) total.
const SUBSTEP_MAX = 1 / 240; // physics substep cap (stability for fast close passes)

const computeAccel = (): void => {
  // Build the compact MASSIVE list once for this pass.
  let nm = 0;
  for (let i = 0; i < nBodies; i++) {
    bax[i] = 0;
    bay[i] = 0;
    if (bm[i] >= MASS_TEST) massiveIdx[nm++] = i;
  }
  nMassive = nm;
  // Massive↔massive: full mutual O(M²) gravity (the suns/heavy bodies steer the show).
  for (let a = 0; a < nm; a++) {
    const i = massiveIdx[a];
    const xi = bx[i],
      yi = by[i],
      mi = bm[i];
    for (let b = a + 1; b < nm; b++) {
      const j = massiveIdx[b];
      const dx = bx[j] - xi;
      const dy = by[j] - yi;
      const r2 = dx * dx + dy * dy + SOFT2;
      const invR = 1 / Math.sqrt(r2);
      const invR3 = invR * invR * invR;
      const f = G * invR3;
      const fmj = f * bm[j];
      const fmi = f * mi;
      bax[i] += fmj * dx;
      bay[i] += fmj * dy;
      bax[j] -= fmi * dx;
      bay[j] -= fmi * dy;
    }
  }
  // Test particles: feel only the massive bodies (their own self-gravity is
  // negligible against the central mass), so disk stars cost O(N·M), not O(N²).
  for (let p = 0; p < nBodies; p++) {
    if (bm[p] >= MASS_TEST) continue;
    const xp = bx[p],
      yp = by[p];
    let ax = 0,
      ay = 0;
    for (let a = 0; a < nm; a++) {
      const j = massiveIdx[a];
      const dx = bx[j] - xp;
      const dy = by[j] - yp;
      const r2 = dx * dx + dy * dy + SOFT2;
      const invR = 1 / Math.sqrt(r2);
      const f = G * bm[j] * invR * invR * invR;
      ax += f * dx;
      ay += f * dy;
    }
    bax[p] = ax;
    bay[p] = ay;
  }
};

// Fuse body j INTO body i (i survives): summed mass + momentum-conserving
// (mass-weighted) velocity & position → accretion. j is then removed.
const fuseInto = (i: number, j: number): void => {
  const mi = bm[i],
    mj = bm[j],
    inv = 1 / (mi + mj);
  bvx[i] = (bvx[i] * mi + bvx[j] * mj) * inv;
  bvy[i] = (bvy[i] * mi + bvy[j] * mj) * inv;
  bx[i] = (bx[i] * mi + bx[j] * mj) * inv;
  by[i] = (by[i] * mi + by[j] * mj) * inv;
  bm[i] = mi + mj;
  bpinned[i] = bpinned[i] || bpinned[j] ? 1 : 0;
  bspd[i] = Math.max(bspd[i], bspd[j]);
  bage[i] = Math.min(bage[i], bage[j]);
};

// Merge close pairs (survivor gets the accreted mass). To keep a DENSE disk and
// O(N·M) cost we only test against the few MASSIVE bodies: massive↔massive (the
// suns coalesce) and test→massive (disk stars accrete onto a sun). Disk stars do
// NOT merge with each other — that both preserves the swarm and avoids O(N²).
const resolveMerges = (): void => {
  // Massive ↔ massive (small list).
  for (let a = 0; a < nMassive; a++) {
    let i = massiveIdx[a];
    if (bm[i] < MASS_TEST) continue; // already absorbed this pass
    const ri = radiusOf(bm[i]);
    for (let b = a + 1; b < nMassive; b++) {
      const j = massiveIdx[b];
      if (bm[j] < MASS_TEST) continue;
      const dx = bx[j] - bx[i],
        dy = by[j] - by[i];
      const rr = MERGE_K * (ri + radiusOf(bm[j]));
      if (dx * dx + dy * dy < rr * rr) {
        // keep the pinned one if either is pinned; else keep the heavier index.
        const keepJ = (bpinned[j] && !bpinned[i]) || (!bpinned[i] && bm[j] > bm[i]);
        const k = keepJ ? j : i,
          d = keepJ ? i : j;
        if (keepJ) {
          bpx[j] = bpx[i];
          bpy[j] = bpy[i];
        }
        fuseInto(k, d);
        bm[d] = 0; // tombstone so the inner/outer loops skip it before removal
      }
    }
  }
  // Sweep test particles: accrete any that fell inside a massive body's radius.
  // Iterate downward so removeBody's swap-with-last never skips an entry.
  for (let p = nBodies - 1; p >= 0; p--) {
    if (bm[p] >= MASS_TEST) continue;
    const xp = bx[p],
      yp = by[p],
      rp = radiusOf(bm[p]);
    for (let a = 0; a < nMassive; a++) {
      const j = massiveIdx[a];
      if (bm[j] < MASS_TEST) continue; // tombstoned this pass
      const dx = bx[j] - xp,
        dy = by[j] - yp;
      const rr = MERGE_K * (radiusOf(bm[j]) + rp);
      if (dx * dx + dy * dy < rr * rr) {
        fuseInto(j, p);
        bm[p] = 0;
        break;
      }
    }
  }
  // Compact out every tombstoned (mass 0) body in one downward pass.
  for (let i = nBodies - 1; i >= 0; i--) if (bm[i] === 0) removeBody(i);
};

const stepPhysics = (dt: number): void => {
  if (nBodies === 0) return;
  // subdivide dt for stability during fast close passes
  let remaining = dt;
  // recompute accel at the start (state may have changed via input/merges)
  computeAccel();
  while (remaining > 1e-7) {
    const h = remaining > SUBSTEP_MAX ? SUBSTEP_MAX : remaining;
    remaining -= h;
    const hh = h * 0.5;
    // kick (half): v += a·h/2  using accel from previous step
    for (let i = 0; i < nBodies; i++) {
      if (bpinned[i]) continue;
      bvx[i] += bax[i] * hh;
      bvy[i] += bay[i] * hh;
    }
    // drift: x += v·h
    for (let i = 0; i < nBodies; i++) {
      if (bpinned[i]) continue;
      bx[i] += bvx[i] * h;
      by[i] += bvy[i] * h;
    }
    // recompute accel at new positions
    computeAccel();
    // kick (half): v += a·h/2 with the new accel
    for (let i = 0; i < nBodies; i++) {
      if (bpinned[i]) continue;
      bvx[i] += bax[i] * hh;
      bvy[i] += bay[i] * hh;
    }
    resolveMerges();
  }
  // smoothed speed for colour + cull escapers
  for (let i = nBodies - 1; i >= 0; i--) {
    const sp = Math.sqrt(bvx[i] * bvx[i] + bvy[i] * bvy[i]);
    bspd[i] = bspd[i] * 0.8 + sp * 0.2;
    bage[i] += dt;
    if (!bpinned[i] && (Math.abs(bx[i]) > ESCAPE || Math.abs(by[i]) > ESCAPE)) removeBody(i);
  }
};

// ── Trail buffer fade (exponential, frame-rate independent) ──────────────────────
const decayPow = (base: number, dt: number): number => Math.pow(base, dt * 60);

// ── Soft additive Gaussian dot into the HDR trail buffer ─────────────────────────
// Drawn at a given footprint radius `fr` (px). The squared-exp falloff `inv` is
// passed in so streak segments share one precompute. Bright crisp core; the trail
// length comes from the persistent buffer + the streak interpolation below.
// HDR accumulation ceiling (per channel). Tuned so the dense core saturates to a
// hot blue-white that still tonemaps with visible structure rather than a flat clip.
const ACC_MAX = 1.9;
const splatDot = (W: number, H: number, sxp: number, syp: number, fr: number, inv: number, cr: number, cg: number, cb: number, peak: number): void => {
  const fr2 = fr * fr;
  const x0 = Math.max(0, (sxp - fr) | 0),
    x1 = Math.min(W - 1, (sxp + fr + 1) | 0);
  const y0 = Math.max(0, (syp - fr) | 0),
    y1 = Math.min(H - 1, (syp + fr + 1) | 0);
  for (let yy = y0; yy <= y1; yy++) {
    const dy = yy - syp;
    const row = yy * W;
    for (let xx = x0; xx <= x1; xx++) {
      const dx = xx - sxp;
      const d2 = dx * dx + dy * dy;
      if (d2 > fr2) continue;
      const g = Math.exp(-d2 * inv) * peak;
      const o = row + xx;
      // Per-channel HDR ceiling: the dense core piles many bright trails into a few
      // pixels — without a cap they run away to flat 255 white. Clamping each channel
      // to ACC_MAX lets the nucleus stay LUMINOUS but keep its hot blue-white TINT
      // (b ≥ g ≥ r in the core colour), so it reads as a real central body, not a
      // featureless white disc. The arms sit far below the cap, untouched.
      let nr = accR[o] + cr * g;
      accR[o] = nr > ACC_MAX ? ACC_MAX : nr;
      let ng = accG[o] + cg * g;
      accG[o] = ng > ACC_MAX ? ACC_MAX : ng;
      let nb = accB[o] + cb * g;
      accB[o] = nb > ACC_MAX ? ACC_MAX : nb;
    }
  }
};

// ── A body's contribution: a connected motion-blur STREAK from its previous splat
// point to its current one, plus a brighter crisp HEAD core. Interpolating between
// frames turns the per-frame fade into legible CURVED trails (the marquee look)
// instead of disconnected blobs when a body crosses several pixels per frame. ────
const splatBodyTrail = (W: number, H: number, px: number, py: number, sxp: number, syp: number, rad: number, cr: number, cg: number, cb: number, corona: number): void => {
  // head footprint (clamped so a giant sun doesn't paint the whole frame).
  // Tight Gaussian (low variance) → a crisp bright point with a hard-ish edge so
  // even a slow planet reads as a star, not a soft fat blob. Capped tighter than
  // before so the primary stays a COMPACT hot disc — its glow comes from the
  // separate corona + bloom below, not from one fat blown-out Gaussian.
  const headFr = clamp(rad * projSx * 1.05, 1.0, 5.2);
  const headInv = 1 / (headFr * headFr * 0.16);
  // thinner core for the connecting streak so paths read as crisp filaments
  const tailFr = clamp(headFr * 0.52, 0.8, 4.0);
  const tailInv = 1 / (tailFr * tailFr * 0.2);

  if (px >= 0) {
    const ddx = sxp - px,
      ddy = syp - py;
    const seg = Math.hypot(ddx, ddy);
    if (seg > 1.1) {
      // step ~1px so the trail is continuous; cap to bound cost on a fast comet
      const steps = Math.min(48, Math.max(1, Math.round(seg)));
      const invS = 1 / steps;
      // taper brightness toward the tail so the streak fades into the old buffer
      for (let s = 1; s < steps; s++) {
        const f = s * invS;
        const tx = px + ddx * f,
          ty = py + ddy * f;
        const taper = 0.3 + 0.45 * f; // dim at tail → near-head brightness
        splatDot(W, H, tx, ty, tailFr, tailInv, cr * taper, cg * taper, cb * taper, 1.0);
      }
    }
  }
  // CORONA: massive bodies get a soft wide halo ring laid UNDER the crisp head so
  // the nucleus reads as a luminous BODY with a glowing atmosphere — a legible
  // central sun — instead of a flat white clip. Low peak + wide soft Gaussian, so
  // it never blows out; it just bathes the surrounding space in cohesive light.
  if (corona > 0) {
    const coFr = headFr * (1.7 + 1.1 * corona);
    const coInv = 1 / (coFr * coFr * 0.5);
    // Cool, faint atmosphere: mostly BLUE so it tints the surround instead of adding
    // to the white core fill — the hot head stays the bright disc, the corona is just
    // a breath of cyan light around it.
    splatDot(W, H, sxp, syp, coFr, coInv, cr * 0.1, cg * 0.16, cb * 0.3, 0.2 * corona);
  }
  // bright crisp head (a touch lower peak than before so the hot core keeps a
  // little tonal structure under the bloom rather than slamming to flat white)
  splatDot(W, H, sxp, syp, headFr, headInv, cr, cg, cb, 1.1);
};

// ── Frame ─────────────────────────────────────────────────────────────────────
const frame = (t: Term, time: number, dt: number, _frameNo: number): void => {
  const W = t.width,
    H = t.height,
    aspect = t.aspect;
  if (accW !== W || accH !== H) allocForSize(W, H, aspect);

  if (!initialized) {
    seedAttractSystem();
    initialized = true;
    lastUserT = -1e9;
    attractActive = true;
    attractGToggled = false;
  }

  // ── refresh projection (fit world to screen, isotropic) ──
  projCx = W * 0.5;
  projCy = H * 0.5;
  const fit = Math.min(W / aspect, H) * 0.5;
  const sc = fit / WORLD;
  projSx = sc * aspect;
  projSy = sc;

  // ── interaction (live only; mouse fields stay quiet in capture/bench) ──
  const seqChanged = t.mouse.sequence !== lastMouseSeq;
  lastMouseSeq = t.mouse.sequence;
  if (t.mouse.active && (seqChanged || t.mouse.down !== lastDown || t.mouse.wheel !== 0)) {
    lastUserT = time;
    attractActive = false;
  }
  // wheel → cycle next placement mass
  if (t.mouse.wheel !== 0) {
    nextMassIdx = clamp(nextMassIdx + (t.mouse.wheel > 0 ? 1 : -1), 0, MASS_STEPS.length - 1) | 0;
    t.mouse.wheel = 0;
  }
  // press / drag / release slingshot
  const mwx = screenToWorldX(t.mouse.x);
  const mwy = screenToWorldY(t.mouse.y);
  if (t.mouse.active) {
    if (t.mouse.down && !lastDown) {
      dragging = true;
      dragStartX = mwx;
      dragStartY = mwy;
      dragCurX = mwx;
      dragCurY = mwy;
    } else if (t.mouse.down && dragging) {
      dragCurX = mwx;
      dragCurY = mwy;
    } else if (!t.mouse.down && lastDown && dragging) {
      // release → fling: velocity ∝ (start − release) so you pull BACK to launch
      dragging = false;
      const FLING = 0.9;
      const vx = (dragStartX - dragCurX) * FLING;
      const vy = (dragStartY - dragCurY) * FLING;
      addBody(dragStartX, dragStartY, vx, vy, MASS_STEPS[nextMassIdx], false);
    }
  }
  lastDown = t.mouse.down;

  // resume attract after ~3s idle (live), and always in capture/bench (no input)
  if (!attractActive && time - lastUserT > 3.0) attractActive = true;

  // ── attract performance: scripted gravity story driven purely by time ──
  if (attractActive) {
    // Toggle in the central attractor once, partway through, to pull stragglers in
    // and tighten the orbits — a visible "the system organizes" beat.
    if (!attractGToggled && time > 20.0) {
      attractGToggled = true;
      // gently anchor a heavy mass at the barycentre if none is pinned
      if (findPinned() < 0) addBody(0, 0, 0, 0, ATTRACT_MASS, true);
    }
    // Re-seed once accretion has thinned the disk so the mini-galaxy stays DENSE.
    if (nBodies <= 24) {
      seedAttractSystem();
      attractGToggled = false;
    }
  }

  // ── physics (scaled clock → more visible orbital revolutions per second) ──
  stepPhysics(dt * SIM_RATE);

  // ── fade the HDR trail buffer (motion blur persistence; tuned for silky trails) ──
  // A touch more retention than before so the connected streaks read as long, silky
  // CURVED filaments along each orbit rather than dying within a few frames.
  const fade = decayPow(0.963, dt);
  for (let i = 0; i < accR.length; i++) {
    accR[i] *= fade;
    accG[i] *= fade;
    accB[i] *= fade;
  }

  // ── splat every body as a hot HDR streak coloured by mass & speed ──
  // colour key: heavy and/or fast → blue-white; light and slow → warm amber.
  for (let i = 0; i < nBodies; i++) {
    const sxp = worldToScreenX(bx[i]);
    const syp = worldToScreenY(by[i]);
    if (sxp < -16 || syp < -16 || sxp > W + 16 || syp > H + 16) {
      bpx[i] = -1;
      bpy[i] = -1; // off-screen: drop the trail anchor so it can't jump back
      continue;
    }
    const m = bm[i];
    const rad = radiusOf(m);
    // Calibrated to the system's ACTUAL dynamic range: orbital speeds run ~0.05 (rim)
    // to ~0.15+ (fast inner stars / close passes); masses run ~0.004 (motes) to a
    // ~2.2 primary. Bands chosen so inner fast bodies cross into electric blue while the
    // slow rim stays ember — the full stellar ramp is actually USED, not clamped warm.
    const massKey = smoothstep(0.02, 0.9, m); // 0 light → 1 heavy
    const spdKey = smoothstep(0.04, 0.15, bspd[i]); // 0 slow → 1 fast
    // RADIUS key: the inner disk is intrinsically hotter (blue) and the rim cooler
    // (ember). This gives a reliable blue-core → amber-rim TEMPERATURE GRADIENT across
    // the whole spiral even when a star's instantaneous speed momentarily dips. It is
    // the DOMINANT term so the galaxy reads unmistakably blue-cored and ember-rimmed.
    const rw = Math.sqrt(bx[i] * bx[i] + by[i] * by[i]);
    const radKey = smoothstep(0.58, 0.03, rw); // near centre → 1 (tighter core)
    // An extra blue-hot CORE term: the innermost stars (rw < ~0.18) get a hard push
    // into the electric-blue end so the very nucleus reads unmistakably blue against
    // the amber arms — strengthening the blue-hot vs amber tonal range the eye sees.
    const coreKey = smoothstep(0.2, 0.0, rw); // deep core → 1
    // Temperature key: RADIUS + SPEED push inner/fast bodies blue-hot; the slow ember
    // rim stays warm; mass is a secondary lift so heavy suns burn white-blue too; the
    // coreKey biases the nucleus the bluest of all.
    const tk = clamp01(0.04 + 0.3 * massKey + 0.32 * spdKey + 0.52 * radKey + 0.22 * coreKey);
    const li = (tk * 255) | 0;
    const cr = TEMP_R[li],
      cg = TEMP_G[li],
      cb = TEMP_B[li];
    // brightness grows with mass (more luminous suns) but is kept HDR-modest so the
    // ACES grade keeps a legible coloured core rather than a clipped white blob. A
    // SOFT KNEE compresses the very heaviest suns (cbrt(m) past ~0.8) so the primary
    // no longer races off into a flat white disc as it accretes — it stays a legible
    // hot body whose luminosity reads through the corona + bloom, not raw clip.
    const birth = smoothstep(0, 0.35, bage[i]);
    let lum = Math.cbrt(m);
    if (lum > 0.8) lum = 0.8 + (lum - 0.8) * 0.45; // knee on the brightest suns
    const bright = (0.55 + 1.75 * lum) * birth * (bpinned[i] ? 1.15 : 1);
    // Heavy bodies earn a soft corona (a glowing atmosphere); disk motes get none so
    // the arms stay crisp filaments. Ramps in only for genuine suns (m ≳ 0.1).
    const corona = smoothstep(0.1, 0.9, m);
    splatBodyTrail(W, H, bpx[i], bpy[i], sxp, syp, rad, cr * bright, cg * bright, cb * bright, corona);
    bpx[i] = sxp;
    bpy[i] = syp;
  }

  // ── slingshot aiming overlay (live, while dragging): aim line + ghost trajectory ──
  if (dragging) {
    const FLING = 0.9;
    const vx0 = (dragStartX - dragCurX) * FLING;
    const vy0 = (dragStartY - dragCurY) * FLING;
    drawAimLine(W, H);
    drawGhostTrajectory(W, H, time, vx0, vy0);
  }

  // ── BLOOM: threshold + downsample + separable blur ──
  buildBloom(W, H);

  // ── COMPOSITE: trails + starfield + bloom + vignette + ACES → t.buf ──
  const out = t.pixels;
  const EXPOSURE = 1.1;
  // Bloom carries a gentle COOL diffraction skew (less red, more blue) so bright suns
  // radiate an astronomical halo instead of an amber fireball — the cores read as stars.
  // R/G trimmed a touch so the halo stays cool and never washes the disc warm-white.
  const BLOOM_R = 0.26,
    BLOOM_G = 0.31,
    BLOOM_B = 0.46;
  const Aa = 2.51,
    Ab = 0.03,
    Ac = 2.43,
    Ad = 0.59,
    Ae = 0.14;
  for (let yy = 0; yy < H; yy++) {
    const rowB = yy * W;
    const bRow = (yy >> 1) * bw;
    for (let xx = 0; xx < W; xx++) {
      const o = rowB + xx;
      const o3 = o * 3;
      let rl = accR[o],
        gl = accG[o],
        bl = accB[o];
      const bo = (bRow + (xx >> 1)) * 3;
      rl += bloomA[bo] * BLOOM_R + starBuf[o3];
      gl += bloomA[bo + 1] * BLOOM_G + starBuf[o3 + 1];
      bl += bloomA[bo + 2] * BLOOM_B + starBuf[o3 + 2];
      const vig = vigBuf[o] * EXPOSURE;
      rl *= vig;
      gl *= vig;
      bl *= vig;
      let tr = (rl * (Aa * rl + Ab)) / (rl * (Ac * rl + Ad) + Ae);
      tr = tr < 0 ? 0 : tr > 1 ? 1 : tr;
      let tg = (gl * (Aa * gl + Ab)) / (gl * (Ac * gl + Ad) + Ae);
      tg = tg < 0 ? 0 : tg > 1 ? 1 : tg;
      let tb = (bl * (Aa * bl + Ab)) / (bl * (Ac * bl + Ad) + Ae);
      tb = tb < 0 ? 0 : tb > 1 ? 1 : tb;
      out[o3] = (tr * 255) | 0;
      out[o3 + 1] = (tg * 255) | 0;
      out[o3 + 2] = (tb * 255) | 0;
    }
  }

  // ── cursor ring (live, not dragging): shows where + what mass you'll place ──
  if (t.mouse.active && t.mouse.inside && !dragging) {
    drawCursorRing(t);
  }
};

// Dashed aiming line from the launch point to the cursor, drawn directly to t.buf
// AFTER tonemap so it stays crisp UI chrome (it isn't part of the HDR trail).
const drawAimLine = (W: number, H: number): void => {
  const x0 = worldToScreenX(dragStartX),
    y0 = worldToScreenY(dragStartY);
  const x1 = worldToScreenX(dragCurX),
    y1 = worldToScreenY(dragCurY);
  // also paint a faint marker at the launch point into the trail buffer so it reads
  const dx = x1 - x0,
    dy = y1 - y0;
  const len = Math.hypot(dx, dy) + 1e-6;
  const ux = dx / len,
    uy = dy / len;
  const steps = Math.min(220, len | 0);
  for (let s = 0; s <= steps; s++) {
    if (((s >> 1) & 1) === 0) continue; // dash
    const px = (x0 + ux * s) | 0,
      py = (y0 + uy * s) | 0;
    if (px < 0 || py < 0 || px >= W || py >= H) continue;
    const o = (py * W + px) * 3;
    accR[o] = Math.min(2, accR[o] + 0.5);
    accG[o] = Math.min(2, accG[o] + 0.55);
    accB[o] = Math.min(2, accB[o] + 0.7);
  }
};

// Forward-integrate a ghost copy of the would-be body (gravity from the REAL bodies,
// fixed during the preview) and lay a faint dotted prediction trail into accum.
const drawGhostTrajectory = (W: number, H: number, _time: number, vx0: number, vy0: number): void => {
  let gx = dragStartX,
    gy = dragStartY;
  let gvx = vx0,
    gvy = vy0;
  const h = 1 / 120;
  const N = 180;
  for (let s = 0; s < N; s++) {
    // accel from real bodies (Plummer-softened)
    let ax = 0,
      ay = 0;
    for (let i = 0; i < nBodies; i++) {
      const ddx = bx[i] - gx,
        ddy = by[i] - gy;
      const r2 = ddx * ddx + ddy * ddy + SOFT2;
      const invR = 1 / Math.sqrt(r2);
      const f = G * bm[i] * invR * invR * invR;
      ax += f * ddx;
      ay += f * ddy;
    }
    gvx += ax * h;
    gvy += ay * h;
    gx += gvx * h;
    gy += gvy * h;
    if (Math.abs(gx) > ESCAPE || Math.abs(gy) > ESCAPE) break;
    if ((s & 3) !== 0) continue; // dotted
    const px = worldToScreenX(gx) | 0,
      py = worldToScreenY(gy) | 0;
    if (px < 0 || py < 0 || px >= W || py >= H) continue;
    const fadeT = 1 - s / N;
    const o = (py * W + px) * 3;
    accR[o] = Math.min(2, accR[o] + 0.22 * fadeT);
    accG[o] = Math.min(2, accG[o] + 0.3 * fadeT);
    accB[o] = Math.min(2, accB[o] + 0.42 * fadeT);
  }
};

// A thin ring at the cursor sized to the next placement mass (post-tonemap chrome).
const drawCursorRing = (t: Term): void => {
  const W = t.width,
    H = t.height;
  const cxp = t.mouse.x,
    cyp = t.mouse.y;
  const m = MASS_STEPS[nextMassIdx];
  const rad = Math.max(2.5, radiusOf(m) * projSx * 1.5);
  const massKey = smoothstep(0.01, 1.2, m);
  const li = (clamp01(0.22 + 0.6 * massKey) * 255) | 0;
  const cr = (TEMP_R[li] * 220) | 0,
    cg = (TEMP_G[li] * 220) | 0,
    cb = (TEMP_B[li] * 240) | 0;
  const segs = 40;
  for (let s = 0; s < segs; s++) {
    const a = (s / segs) * TAU;
    const px = (cxp + Math.cos(a) * rad) | 0;
    const py = (cyp + Math.sin(a) * rad) | 0;
    if (px < 0 || py < 0 || px >= W || py >= H) continue;
    t.blendPixel(px, py, cr, cg, cb, 0.85);
  }
};

// Separable bloom: threshold the trail buffer at half-res, blur it, leave in bloomA.
const buildBloom = (W: number, H: number): void => {
  // Higher threshold than before: only genuine HIGHLIGHTS (the bright trail spines
  // and hot cores) bloom, so the broad mid-bright wash around the nucleus no longer
  // floods a fat white halo over the disc. The arms' crisp spines still clear it, so
  // they keep their silky glow while the central body reads as a defined sun.
  const thr = 0.95;
  for (let y = 0; y < bh; y++) {
    const sy0 = y * 2;
    for (let x = 0; x < bw; x++) {
      const sx0 = x * 2;
      let rr = 0,
        gg = 0,
        bb = 0;
      for (let j = 0; j < 2; j++) {
        const yy = sy0 + j < H ? sy0 + j : H - 1;
        const rowo = yy * W;
        for (let k = 0; k < 2; k++) {
          const xx = sx0 + k < W ? sx0 + k : W - 1;
          const oo = rowo + xx;
          const a0 = accR[oo] - thr,
            a1 = accG[oo] - thr,
            a2 = accB[oo] - thr;
          if (a0 > 0) rr += a0;
          if (a1 > 0) gg += a1;
          if (a2 > 0) bb += a2;
        }
      }
      const oo = (y * bw + x) * 3;
      bloomA[oo] = rr * 0.25;
      bloomA[oo + 1] = gg * 0.25;
      bloomA[oo + 2] = bb * 0.25;
    }
  }
  const k0 = 0.4,
    k1 = 0.25,
    k2 = 0.05;
  for (let y = 0; y < bh; y++) {
    const rb = y * bw;
    for (let x = 0; x < bw; x++) {
      const oo = (rb + x) * 3;
      const xm2 = (rb + (x - 2 > 0 ? x - 2 : 0)) * 3,
        xm1 = (rb + (x - 1 > 0 ? x - 1 : 0)) * 3;
      const xp1 = (rb + (x + 1 < bw ? x + 1 : bw - 1)) * 3,
        xp2 = (rb + (x + 2 < bw ? x + 2 : bw - 1)) * 3;
      bloomB[oo] = k0 * bloomA[oo] + k1 * (bloomA[xm1] + bloomA[xp1]) + k2 * (bloomA[xm2] + bloomA[xp2]);
      bloomB[oo + 1] = k0 * bloomA[oo + 1] + k1 * (bloomA[xm1 + 1] + bloomA[xp1 + 1]) + k2 * (bloomA[xm2 + 1] + bloomA[xp2 + 1]);
      bloomB[oo + 2] = k0 * bloomA[oo + 2] + k1 * (bloomA[xm1 + 2] + bloomA[xp1 + 2]) + k2 * (bloomA[xm2 + 2] + bloomA[xp2 + 2]);
    }
  }
  for (let y = 0; y < bh; y++) {
    const ym2 = (y - 2 > 0 ? y - 2 : 0) * bw,
      ym1 = (y - 1 > 0 ? y - 1 : 0) * bw;
    const yp1 = (y + 1 < bh ? y + 1 : bh - 1) * bw,
      yp2 = (y + 2 < bh ? y + 2 : bh - 1) * bw;
    const rb = y * bw;
    for (let x = 0; x < bw; x++) {
      const oo = (rb + x) * 3;
      const om2 = (ym2 + x) * 3,
        om1 = (ym1 + x) * 3,
        op1 = (yp1 + x) * 3,
        op2 = (yp2 + x) * 3;
      bloomA[oo] = k0 * bloomB[oo] + k1 * (bloomB[om1] + bloomB[op1]) + k2 * (bloomB[om2] + bloomB[op2]);
      bloomA[oo + 1] = k0 * bloomB[oo + 1] + k1 * (bloomB[om1 + 1] + bloomB[op1 + 1]) + k2 * (bloomB[om2 + 1] + bloomB[op2 + 1]);
      bloomA[oo + 2] = k0 * bloomB[oo + 2] + k1 * (bloomB[om1 + 2] + bloomB[op1 + 2]) + k2 * (bloomB[om2 + 2] + bloomB[op2 + 2]);
    }
  }
};

const onKey = (key: string, _t: Term): void => {
  lastUserT = 1e9; // any key counts as interaction (will be clamped by time compare)
  attractActive = false;
  if (key === 'g') {
    if (!gAttractor) {
      gAttractorIdx = addBody(0, 0, 0, 0, ATTRACT_MASS, true);
      gAttractor = gAttractorIdx >= 0;
    } else {
      // remove the pinned attractor
      const pi = findPinned();
      if (pi >= 0) removeBody(pi);
      gAttractor = false;
      gAttractorIdx = -1;
    }
  } else if (key === 'c') {
    clearBodies();
    if (accR.length) {
      accR.fill(0);
      accG.fill(0);
      accB.fill(0);
    }
    gAttractor = false;
    gAttractorIdx = -1;
  } else if (key === 'r') {
    seedAttractSystem();
    if (accR.length) {
      accR.fill(0);
      accG.fill(0);
      accB.fill(0);
    }
    gAttractor = false;
    gAttractorIdx = -1;
    attractActive = true;
    attractGToggled = false;
  }
};

run({
  title: 'Orbits',
  hud: 'DRAG TO FLING A STAR - WHEEL MASS - G ATTRACTOR - C CLEAR - R RESEED',
  captureT: 6,
  mouse: true,
  targetFps: Infinity,
  init: (t) => {
    allocForSize(t.width, t.height, t.aspect);
    initialized = false;
    // Pre-warm: seed the system and develop ~3s of orbital trails before t=0 so the
    // very first displayed/captured frame already shows curved paths, not dots.
    projCx = t.width * 0.5;
    projCy = t.height * 0.5;
    const fit = Math.min(t.width / t.aspect, t.height) * 0.5;
    const sc = fit / WORLD;
    projSx = sc * t.aspect;
    projSy = sc;
    seedAttractSystem();
    initialized = true;
    const warmDt = 1 / 120;
    for (let k = 200; k >= 1; k--) frame(t, -k * warmDt, warmDt, 0);
  },
  frame,
  onKey,
});
