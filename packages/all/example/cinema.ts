/**
 * cinema — a self-playing cinematic title reel, rendered entirely in truecolor
 * half-block text. A true 2.39:1 letterbox frames four self-contained procedural
 * SCENES that cross-dissolve through black on a ~12s timeline and then loop:
 *
 *   I.   NEBULA   — a drifting deep-space starfield over a slowly-resolving
 *        value-noise nebula sampled bilinearly from a fixed internal grid, with
 *        three parallax depth planes of twinkling stars and a few hero stars.
 *   II.  GALAXY   — a logarithmic-spiral disc with two arms, dust-lane gaps, a
 *        warm-gold → cool-blue radial palette and a soft HDR (ACES) nucleus that
 *        glows without blowing out; differential rotation winds the arms.
 *   III. OCEAN    — a sunrise over a summed-Gerstner-wave sea: a dawn sky with a
 *        warm-to-teal vertical gradient, a rising sun with atmospheric bloom, a
 *        perspective-projected wave field shaded by a sun term, and stochastic
 *        specular glitter riding the crests of the reflection road.
 *   IV.  AURORA   — an abstract flowing light-form: stacked curtains of vertical
 *        light driven by layered sines, drifting hue between emerald and violet,
 *        with a faint star bed behind. One restrained title fades in here, then
 *        out, before the reel loops.
 *
 * Cinematic craft: an eased drifting "camera", real fade-to-black dissolves, a
 * cohesive warm-highlight / teal-shadow colour GRADE, a soft VIGNETTE and subtle
 * deterministic film GRAIN, all applied as one final full-frame pass so the reel
 * reads as a single graded image.
 *
 * Everything is procedural and DETERMINISTIC: no assets, no wall clock — all
 * motion is a pure function of sim-time, all randomness seeded with mulberry32,
 * so captures reproduce exactly. Sim resolution (the nebula grid, the star
 * tables in normalized space) is decoupled from display resolution and sampled
 * to t.W/t.H every frame, so the reel reflows seamlessly on terminal resize.
 *
 * Technique: parallax point sprites, bilinear field sampling, log-spiral galaxy
 * synthesis, summed Gerstner waves with analytic slope normals, ACES tonemapped
 * HDR cores, and a per-pixel colour-grade pass (vignette + split-tone + grain).
 *
 * Comfortably >120fps at 160x50 by keeping every scene light and touching pixels
 * at most a couple of times per frame.
 *
 * Run: bun run packages/all/example/cinema.ts
 */
import { runDemo, Term, clamp01, lerp, smoothstep, fract, aces, mulberry32, hash2, TAU } from './_term';

const SQRT = Math.sqrt;
const SIN = Math.sin;
const COS = Math.cos;
const EXP = Math.exp;

// ── Timeline ────────────────────────────────────────────────────────────────
// Four scenes, each owning a slice of the loop. A short fade at the head and
// tail of every slice drives a 0..1 reveal envelope so scenes dissolve through
// black into one another.
const SCENES = [
  { name: 'nebula', dur: 3.2 },
  { name: 'galaxy', dur: 3.2 },
  { name: 'ocean', dur: 3.2 },
  { name: 'aurora', dur: 3.4 },
] as const;
const FADE = 0.85; // seconds of fade at each scene boundary
const LOOP = SCENES.reduce((s, x) => s + x.dur, 0);

/** Local time within the active scene + a 0..1 fade envelope (0 = black). */
function timeline(time: number): { idx: number; local: number; reveal: number; dur: number } {
  let tt = fract(time / LOOP) * LOOP;
  let idx = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (tt < SCENES[i].dur) {
      idx = i;
      break;
    }
    tt -= SCENES[i].dur;
  }
  const dur = SCENES[idx].dur;
  const fin = smoothstep(0, FADE, tt);
  const fout = smoothstep(0, FADE, dur - tt);
  return { idx, local: tt, reveal: fin * fout, dur };
}

// ── Sim-resolution data (allocated in init, normalized / fixed-grid) ──────────
interface Star {
  x: number; // normalized 0..1
  y: number;
  z: number; // depth 0..1 (1 = near)
  seed: number;
}
let bgStars: Star[] = []; // parallax field for nebula + aurora bed

// Galaxy: packed [r, ang0, bri, hue] × N in normalized polar.
let galaxy: Float32Array = new Float32Array(0);
let GAL_N = 0;

// Fixed internal nebula field (value noise), sampled bilinearly to the screen.
const NEB_W = 64;
const NEB_H = 64;
let neb: Float32Array = new Float32Array(NEB_W * NEB_H);

/** Sample the nebula field with bilinear interpolation at normalized (u,v). */
function nebAt(u: number, v: number): number {
  u = u - Math.floor(u);
  v = v - Math.floor(v);
  const fx = u * (NEB_W - 1);
  const fy = v * (NEB_H - 1);
  const x0 = fx | 0;
  const y0 = fy | 0;
  const x1 = x0 + 1 < NEB_W ? x0 + 1 : x0;
  const y1 = y0 + 1 < NEB_H ? y0 + 1 : y0;
  const tx = fx - x0;
  const ty = fy - y0;
  const a = neb[y0 * NEB_W + x0];
  const b = neb[y0 * NEB_W + x1];
  const c = neb[y1 * NEB_W + x0];
  const d = neb[y1 * NEB_W + x1];
  const top = a + (b - a) * tx;
  const bot = c + (d - c) * tx;
  return top + (bot - top) * ty;
}

// ── small drawing helpers ─────────────────────────────────────────────────────
/** Soft additive radial dab (stars, suns, nuclei). */
function dab(t: Term, cx: number, cy: number, rad: number, r: number, g: number, b: number): void {
  const r2 = rad * rad;
  const x0 = Math.max(0, (cx - rad) | 0);
  const x1 = Math.min(t.W - 1, (cx + rad) | 0);
  const y0 = Math.max(0, (cy - rad) | 0);
  const y1 = Math.min(t.H - 1, (cy + rad) | 0);
  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const a = 1 - d2 / r2;
      const a2 = a * a;
      t.addPixel(x, y, r * a2, g * a2, b * a2);
    }
  }
}

function centeredText(t: Term, cy: number, str: string, r: number, g: number, b: number, scale: number, a: number): void {
  const w = Term.textWidth(str, scale);
  const x = ((t.W - w) / 2) | 0;
  t.text(x, cy, str, r * a, g * a, b * a, scale, false);
}

// ── SCENE I: nebula + drifting parallax starfield ─────────────────────────────
function sceneNebula(t: Term, local: number, reveal: number, time: number): void {
  const W = t.W;
  const H = t.H;
  // The nebula "resolves" — contrast and saturation rise over the scene.
  const resolve = smoothstep(0, SCENES[0].dur * 0.7, local);
  // Slow camera drift across the field (very subtle, dreamlike).
  const cu = time * 0.011;
  const cv = time * 0.005;
  const asp = t.aspect;
  // A hero emission core the clouds glow around — anchors the composition off-centre.
  const heroU = 0.40;
  const heroV = 0.44;
  // Octave constants (build-time): scale + offset for u,v per octave.
  const NW1 = NEB_W - 1;
  const NH1 = NEB_H - 1;
  const invW = 1 / W;
  // Resolve-driven scalars hoisted out of the pixel loop.
  const cScale = 0.30 + 0.70 * resolve;
  const haloScale = 10 + 26 * resolve;
  // Skip the letterbox bar rows — they get blacked out after the grade.
  const bar = letterboxBar(t);
  const yBot = H - bar;
  // Paint the nebula as a base layer. Sampling 64×64 bilinearly is cheap.
  for (let y = bar; y < yBot; y++) {
    const ny = y / H;
    const v = ny + cv;
    const dvh = ny - heroV;
    const dvh2 = dvh * dvh;
    const rowBase = y * W * 3;
    // Per-row v-side of each octave's bilinear sample (loop-invariant in x).
    // octave 0: v*1.15 ; octave 1: v*2.7-1.7 ; octave 2: v*5.9+3.4
    let vv = v * 1.15; vv = vv - Math.floor(vv);
    let fy0 = vv * NH1; const y0a = fy0 | 0; const y0b = y0a + 1 < NEB_W ? y0a + 1 : y0a; const ty0 = fy0 - y0a;
    const r0a = y0a * NEB_W, r0b = y0b * NEB_W;
    vv = v * 2.7 - 1.7; vv = vv - Math.floor(vv);
    let fy1 = vv * NH1; const y1a = fy1 | 0; const y1b = y1a + 1 < NEB_W ? y1a + 1 : y1a; const ty1 = fy1 - y1a;
    const r1a = y1a * NEB_W, r1b = y1b * NEB_W;
    vv = v * 5.9 + 3.4; vv = vv - Math.floor(vv);
    let fy2 = vv * NH1; const y2a = fy2 | 0; const y2b = y2a + 1 < NEB_W ? y2a + 1 : y2a; const ty2 = fy2 - y2a;
    const r2a = y2a * NEB_W, r2b = y2b * NEB_W;
    for (let x = 0; x < W; x++) {
      const nx = x * invW;
      const u = nx * asp + cu;
      // Three octaves of value noise (nebAt inlined, v-side precomputed).
      // octave 0
      let uu = u * 1.15; uu = uu - Math.floor(uu);
      let fx = uu * NW1; let x0 = fx | 0; let x1 = x0 + 1 < NEB_W ? x0 + 1 : x0; let tx = fx - x0;
      let a = neb[r0a + x0], bb0 = neb[r0a + x1], cc = neb[r0b + x0], dd = neb[r0b + x1];
      let top = a + (bb0 - a) * tx, bot = cc + (dd - cc) * tx;
      let n = (top + (bot - top) * ty0) * 0.62;
      // octave 1
      uu = u * 2.7 + 5.2; uu = uu - Math.floor(uu);
      fx = uu * NW1; x0 = fx | 0; x1 = x0 + 1 < NEB_W ? x0 + 1 : x0; tx = fx - x0;
      a = neb[r1a + x0]; bb0 = neb[r1a + x1]; cc = neb[r1b + x0]; dd = neb[r1b + x1];
      top = a + (bb0 - a) * tx; bot = cc + (dd - cc) * tx;
      n += (top + (bot - top) * ty1) * 0.26;
      // octave 2
      uu = u * 5.9 - 2.1; uu = uu - Math.floor(uu);
      fx = uu * NW1; x0 = fx | 0; x1 = x0 + 1 < NEB_W ? x0 + 1 : x0; tx = fx - x0;
      a = neb[r2a + x0]; bb0 = neb[r2a + x1]; cc = neb[r2b + x0]; dd = neb[r2b + x1];
      top = a + (bb0 - a) * tx; bot = cc + (dd - cc) * tx;
      n += (top + (bot - top) * ty2) * 0.12;
      // shape into wispy clouds; raise to power so dark voids dominate
      const cloud = clamp01((n - 0.40) / 0.60);
      const dens = cloud * cloud;
      // Distance to the hero core drives an emission glow that lights the gas.
      const dxh = (nx - heroU) * asp;
      const glow = EXP(-(dxh * dxh + dvh2) * 5.5);
      const c = dens * cScale;
      // Emission palette: warm magenta-rose lit core, teal-blue shadowed gas.
      // Mix between a cool nebula tint and a hot emission tint by glow + density.
      const heat = clamp01(glow * 1.6 + dens * 0.35);
      const r = c * (24 + 60 * n) + c * heat * (130 + 90 * glow);
      const g = c * (16 + 32 * n) + c * heat * (44 + 60 * glow);
      const b = c * (52 + 96 * n) + c * heat * (70 + 30 * glow);
      // Faint ambient core bloom even where the gas is thin.
      const halo = glow * glow * haloScale;
      const rr = (r + halo) * reveal;
      const gg = (g + halo * 0.55) * reveal;
      const bb = (b + halo * 0.8) * reveal;
      const i = rowBase + x * 3;
      t.buf[i] = rr > 255 ? 255 : rr | 0;
      t.buf[i + 1] = gg > 255 ? 255 : gg | 0;
      t.buf[i + 2] = bb > 255 ? 255 : bb | 0;
    }
  }
  // Parallax stars on three depth planes drifting with the camera.
  const ox = time * 4.0;
  const oy = time * 1.5;
  for (let i = 0; i < bgStars.length; i++) {
    const s = bgStars[i];
    const par = 0.25 + s.z * 0.75;
    let x = s.x * W + ox * par * 0.25;
    let y = s.y * H + oy * par * 0.25;
    x = ((x % W) + W) % W;
    y = ((y % H) + H) % H;
    const tw = 0.5 + 0.5 * SIN(time * (0.7 + s.seed * 1.6) + s.seed * 40);
    const br = (0.18 + s.z * s.z * 0.82) * tw * reveal;
    const warm = 0.65 + 0.35 * hash2(i, 7);
    t.addPixel(x | 0, y | 0, 200 * br * warm, 215 * br, 255 * br * (1.15 - warm * 0.35));
    if (s.z > 0.9) dab(t, x, y, 2.2, 60 * br * warm, 64 * br, 92 * br);
  }
  // A few hero stars with cross-glints near the core for scale and sparkle.
  for (let k = 0; k < 5; k++) {
    const hx = (0.20 + 0.62 * hash2(k, 91)) * W;
    const hy = (0.22 + 0.58 * hash2(k, 53)) * H;
    const tw = 0.6 + 0.4 * SIN(time * (1.1 + k * 0.3) + k * 12);
    const hb = tw * reveal * resolve;
    dab(t, hx, hy, 2.6, 200 * hb, 210 * hb, 255 * hb);
    const gl = 70 * hb;
    for (let d = -3; d <= 3; d++) {
      t.addPixel((hx + d) | 0, hy | 0, gl, gl, gl);
      t.addPixel(hx | 0, (hy + d) | 0, gl, gl, gl);
    }
  }
}

// ── SCENE II: logarithmic-spiral galaxy ───────────────────────────────────────
function sceneGalaxy(t: Term, local: number, reveal: number, time: number): void {
  const W = t.W;
  const H = t.H;
  const asp = t.aspect;
  // Gentle camera sway + slow majestic spin-up.
  const cx = W * 0.5 + SIN(time * 0.05) * W * 0.025;
  const cy = H * 0.5 + COS(time * 0.043) * H * 0.02;
  const spin = local * 0.16 + time * 0.015;
  const scale = Math.min(W * 0.32, H) * (0.52 + 0.05 * smoothstep(0, 2.4, local));
  const grow = smoothstep(0, 1.5, local) * reveal;
  // The disc squashes to an ellipse for a 3/4 view; x stretched by aspect.
  const ex = asp * 1.55;

  for (let i = 0; i < galaxy.length; i += 4) {
    const r = galaxy[i];
    const ang0 = galaxy[i + 1];
    const bri = galaxy[i + 2];
    const hue = galaxy[i + 3];
    // Differential rotation: inner stars sweep faster.
    const w = spin * (0.5 + 0.85 / (0.22 + r));
    const a = ang0 + w;
    const rr = r * scale;
    const px = cx + COS(a) * rr * ex;
    const py = cy + SIN(a) * rr;
    const tw = 0.65 + 0.35 * SIN(time * 1.1 + ang0 * 17);
    const b = bri * tw * grow;
    if (b < 0.012) continue;
    // Palette: hot blue-white core → warm gold arms → faint rose tips.
    const inner = clamp01(1 - r * 1.25);
    const rr8 = (255 * (0.45 + 0.55 * (1 - inner * 0.6))) * b;
    const gg8 = (210 * (0.5 + 0.5 * hue)) * b;
    const bb8 = (255 * (0.35 + 0.65 * inner)) * b;
    t.addPixel(px | 0, py | 0, rr8, gg8, bb8);
  }

  // Luminous nucleus: HDR Gaussian, ACES-tonemapped so it glows but never clips.
  // A wider, softer outer halo plus a tight warm-white core: gold rather than a
  // clipped white blob.
  const nucR = scale * 0.42;
  const core = (1.3 + 0.16 * SIN(time * 1.7)) * grow;
  const ry = nucR;
  const rx = nucR * ex;
  const y0 = Math.max(0, (cy - ry) | 0);
  const y1 = Math.min(H - 1, (cy + ry) | 0);
  const x0 = Math.max(0, (cx - rx) | 0);
  const x1 = Math.min(W - 1, (cx + rx) | 0);
  for (let y = y0; y <= y1; y++) {
    const ndy = (y - cy) / ry;
    for (let x = x0; x <= x1; x++) {
      const ndx = (x - cx) / rx;
      const d2 = ndx * ndx + ndy * ndy;
      if (d2 > 1) continue;
      // Two-lobe falloff: broad warm halo + tight bright core.
      const halo = EXP(-d2 * 3.0);
      const tight = EXP(-d2 * 10.0);
      const v = (halo * 0.42 + tight * 0.95) * core;
      // Warm gold bias in the highlights keeps it from reading as flat white.
      t.addPixel(x, y, aces(v * 2.2) * 255, aces(v * 1.7) * 255, aces(v * 1.2) * 255);
    }
  }
}

// ── SCENE III: Gerstner-wave ocean sunrise ────────────────────────────────────
const WAVES = [
  { dir: 0.2, amp: 0.85, len: 11, spd: 1.0 },
  { dir: -0.5, amp: 0.5, len: 6, spd: 1.4 },
  { dir: 1.1, amp: 0.32, len: 3.5, spd: 1.9 },
  { dir: -1.4, amp: 0.17, len: 2.0, spd: 2.4 },
] as const;
// Pre-resolved direction unit vectors / wavenumbers (constant per build).
const WDX = WAVES.map((w) => COS(w.dir));
const WDZ = WAVES.map((w) => SIN(w.dir));
const WK = WAVES.map((w) => TAU / w.len);
// Per-wave packed scalars used by the unrolled inline ocean (4 waves).
const W0_DX = WDX[0], W0_DZ = WDZ[0], W0_K = WK[0], W0_A = WAVES[0].amp, W0_AK = WAVES[0].amp * WK[0], W0_S = WAVES[0].spd;
const W1_DX = WDX[1], W1_DZ = WDZ[1], W1_K = WK[1], W1_A = WAVES[1].amp, W1_AK = WAVES[1].amp * WK[1], W1_S = WAVES[1].spd;
const W2_DX = WDX[2], W2_DZ = WDZ[2], W2_K = WK[2], W2_A = WAVES[2].amp, W2_AK = WAVES[2].amp * WK[2], W2_S = WAVES[2].spd;
const W3_DX = WDX[3], W3_DZ = WDZ[3], W3_K = WK[3], W3_A = WAVES[3].amp, W3_AK = WAVES[3].amp * WK[3], W3_S = WAVES[3].spd;

function sceneOcean(t: Term, local: number, reveal: number, time: number): void {
  const W = t.W;
  const H = t.H;
  const horizon = (H * 0.46) | 0;
  // Skip the letterbox bar rows — they get blacked out after the grade.
  const bar = letterboxBar(t);
  const yBot = H - bar;
  // The sun rises across the scene.
  const sunRise = smoothstep(0, SCENES[2].dur, local);
  const sunY = lerp(horizon + 1, horizon - H * 0.16, sunRise);
  const sunX = W * 0.5 + SIN(time * 0.04) * W * 0.025;

  // Atmospheric haze colour at the horizon (warm dawn band). Both the sky's
  // bottom row and the sea's top rows resolve to exactly this so there is NO
  // seam — the water simply emerges from the same atmosphere the sky melts into.
  const hazeR = 235;
  const hazeG = 150;
  const hazeB = 120;

  // Dawn sky: deep teal/indigo high → warm haze at the horizon, plus sun glow.
  // Gradient is driven on a perceptual curve and lands exactly on the haze at f=1.
  for (let y = bar; y < horizon; y++) {
    const f = y / horizon; // 0 top .. 1 horizon
    const fz = f * f;
    const glow = clamp01(1 - Math.abs(y - sunY) / (H * 0.5));
    const g2 = glow * glow * glow;
    // High sky: deep indigo-teal. Low sky: blends into warm haze.
    const sky = smoothstep(0.55, 1, f); // 0 high → 1 at horizon
    let r = lerp(22, hazeR, fz) + 92 * g2;
    let g = lerp(34, hazeG, f) + 56 * g2;
    let b = lerp(86, hazeB, sky) + lerp(86, 0, fz) * 0.0 + 30 * g2;
    // A soft warm zenith-side rose just above the haze for atmosphere depth.
    const rose = smoothstep(0.4, 0.85, f) * (1 - sky) * 26;
    r += rose;
    g += rose * 0.4;
    // Mirror the ocean's haze-melt: the bottom band of sky converges exactly
    // onto the haze colour the water emerges from → continuous, seamless join.
    const skyHaze = smoothstep(0.86, 1, f);
    r = lerp(r, hazeR, skyHaze);
    g = lerp(g, hazeG, skyHaze);
    b = lerp(b, hazeB, skyHaze);
    const rr = r * reveal;
    const gg = g * reveal;
    const bb = b * reveal;
    const rowBase = y * W * 3;
    for (let x = 0; x < W; x++) {
      const hz = 0.96 + 0.04 * hash2((x * 0.3) | 0, y);
      const i = rowBase + x * 3;
      const cr = rr * hz;
      const cg = gg * hz;
      const cb = bb * hz;
      t.buf[i] = cr > 255 ? 255 : cr;
      t.buf[i + 1] = cg > 255 ? 255 : cg;
      t.buf[i + 2] = cb > 255 ? 255 : cb;
    }
  }

  // Sun disc + atmospheric bloom.
  const sunRad = H * 0.07;
  dab(t, sunX, sunY, sunRad * 3.6, 78 * reveal, 44 * reveal, 20 * reveal);
  const sr0 = Math.max(0, (sunY - sunRad) | 0);
  const sr1 = Math.min(H - 1, (sunY + sunRad) | 0);
  const sc0 = Math.max(0, (sunX - sunRad) | 0);
  const sc1 = Math.min(W - 1, (sunX + sunRad) | 0);
  for (let y = sr0; y <= sr1; y++) {
    const dy = (y - sunY) / sunRad;
    for (let x = sc0; x <= sc1; x++) {
      const dx = (x - sunX) / sunRad;
      const d = SQRT(dx * dx + dy * dy);
      if (d > 1) continue;
      const v = smoothstep(1, 0.55, d);
      t.addPixel(x, y, 255 * v * reveal, (205 + 45 * (1 - v)) * v * reveal, 150 * v * reveal);
    }
  }

  // Ocean: march each screen row in perspective-projected world space.
  const halfW = W * 0.5;
  const sparkGp = (time * 9) | 0;
  const RESYNC = 32; // re-seed sin/cos recurrence to bound floating drift
  for (let y = horizon; y < yBot; y++) {
    const sy = (y - horizon) / (H - horizon); // 0 at horizon .. 1 near camera
    const depth = 1.0 - sy * 0.97;
    const wz = 1.6 / (depth + 0.02);
    const persp = 1 / (wz * 0.18 + 1);
    const dpt = smoothstep(0, 1, sy);
    const baseR = lerp(7, 26, dpt);
    const baseG = lerp(32, 66, dpt);
    const baseB = lerp(56, 92, dpt);
    const roadW = 6 + sy * 30;
    const invRoadW = 1 / roadW;
    const roadEnv = smoothstep(0.02, 0.42, sy);
    // far water fades into the haze; the first rows are pure haze so the
    // sky↔sea boundary is a continuous gradient with no line.
    const haze = smoothstep(0.0, 0.38, sy); // 0 at horizon → 1 just below
    const rowBase = y * W * 3;
    const yh13 = (y * 1.3) | 0;
    // Per-row Gerstner phase decomposition: phase_i(x) = p0_i + coef_i*x.
    // wx = (x - halfW) * dwx ; dwx = persp*0.5.
    const dwx = persp * 0.5;
    const wx0 = -halfW * dwx;
    // base phase (x=0) and per-step delta for each of the 4 waves
    let p0_0 = W0_K * (W0_DX * wx0 + W0_DZ * wz) - W0_S * time * W0_K;
    let p0_1 = W1_K * (W1_DX * wx0 + W1_DZ * wz) - W1_S * time * W1_K;
    let p0_2 = W2_K * (W2_DX * wx0 + W2_DZ * wz) - W2_S * time * W2_K;
    let p0_3 = W3_K * (W3_DX * wx0 + W3_DZ * wz) - W3_S * time * W3_K;
    const dp_0 = W0_K * W0_DX * dwx, dp_1 = W1_K * W1_DX * dwx, dp_2 = W2_K * W2_DX * dwx, dp_3 = W3_K * W3_DX * dwx;
    // recurrence rotators (cos/sin of the per-step delta)
    const cd0 = COS(dp_0), sd0 = SIN(dp_0), cd1 = COS(dp_1), sd1 = SIN(dp_1);
    const cd2 = COS(dp_2), sd2 = SIN(dp_2), cd3 = COS(dp_3), sd3 = SIN(dp_3);
    // running sin/cos of each wave's phase (seeded at x=0)
    let s0 = SIN(p0_0), c0 = COS(p0_0), s1 = SIN(p0_1), c1 = COS(p0_1);
    let s2 = SIN(p0_2), c2 = COS(p0_2), s3 = SIN(p0_3), c3 = COS(p0_3);
    let resync = RESYNC;
    for (let x = 0; x < W; x++) {
      // height + slope from the running sin/cos (Gerstner sum, unrolled)
      const h = W0_A * s0 + W1_A * s1 + W2_A * s2 + W3_A * s3;
      const sl0 = W0_AK * c0, sl1 = W1_AK * c1, sl2 = W2_AK * c2, sl3 = W3_AK * c3;
      const nx = -(W0_DX * sl0 + W1_DX * sl1 + W2_DX * sl2 + W3_DX * sl3);
      const nz = -(W0_DZ * sl0 + W1_DZ * sl1 + W2_DZ * sl2 + W3_DZ * sl3);
      // Surface normal (y up) → simple sun diffuse term.
      const nl = 1 / SQRT(nx * nx + 1 + nz * nz);
      const ndl = clamp01(nl * 0.55 + 0.45);
      let r = baseR + ndl * 32 + h * 12;
      let g = baseG + ndl * 42 + h * 14;
      let b = baseB + ndl * 38 + h * 10;
      // melt the far rows into the warm horizon haze
      r = lerp(hazeR, r, haze);
      g = lerp(hazeG, g, haze);
      b = lerp(hazeB, b, haze);
      // Sun reflection road: a vertical band that widens with distance.
      const dxr = (x - sunX) * invRoadW;
      const road = EXP(-dxr * dxr) * roadEnv;
      r += 185 * road;
      g += 132 * road;
      b += 72 * road;
      // Stochastic specular glitter on up-facing crests within the road.
      if (road > 0.05 && h > 0.24) {
        const spark = hash2((x * 1.7 + sparkGp) | 0, yh13);
        if (spark > 0.82) {
          const s = (spark - 0.82) * 5.5 * road;
          r += 255 * s;
          g += 220 * s;
          b += 150 * s;
        }
      }
      r *= reveal;
      g *= reveal;
      b *= reveal;
      const i = rowBase + x * 3;
      t.buf[i] = r > 255 ? 255 : r;
      t.buf[i + 1] = g > 255 ? 255 : g;
      t.buf[i + 2] = b > 255 ? 255 : b;
      // advance the sin/cos recurrence one x-step; resync periodically.
      if (--resync === 0) {
        resync = RESYNC;
        p0_0 += dp_0 * RESYNC; s0 = SIN(p0_0); c0 = COS(p0_0);
        p0_1 += dp_1 * RESYNC; s1 = SIN(p0_1); c1 = COS(p0_1);
        p0_2 += dp_2 * RESYNC; s2 = SIN(p0_2); c2 = COS(p0_2);
        p0_3 += dp_3 * RESYNC; s3 = SIN(p0_3); c3 = COS(p0_3);
      } else {
        let ns = s0 * cd0 + c0 * sd0; c0 = c0 * cd0 - s0 * sd0; s0 = ns;
        ns = s1 * cd1 + c1 * sd1; c1 = c1 * cd1 - s1 * sd1; s1 = ns;
        ns = s2 * cd2 + c2 * sd2; c2 = c2 * cd2 - s2 * sd2; s2 = ns;
        ns = s3 * cd3 + c3 * sd3; c3 = c3 * cd3 - s3 * sd3; s3 = ns;
      }
    }
  }
}

// ── SCENE IV: aurora light-form (+ the one restrained title) ──────────────────
function sceneAurora(t: Term, local: number, reveal: number, time: number): void {
  const W = t.W;
  const H = t.H;
  // Faint star bed behind the curtains.
  for (let i = 0; i < bgStars.length; i += 2) {
    const s = bgStars[i];
    const x = (s.x * W) | 0;
    const y = (s.y * H * 0.7) | 0;
    const tw = 0.4 + 0.6 * SIN(time * 0.8 + s.seed * 30);
    const br = s.z * s.z * tw * 0.5 * reveal;
    t.addPixel(x, y, 120 * br, 140 * br, 180 * br);
  }
  // Curtains of light: for each column, a softly-moving vertical band whose
  // centre and width breathe; colour drifts emerald → teal → violet. Fine
  // vertical ribbon striations break the wash into distinct light pleats.
  // Skip the letterbox bar rows — they get blacked out after the grade.
  const bar = letterboxBar(t);
  const yTopClip = bar;
  const yBotClip = H - 1 - bar;
  const baseY = H * 0.56;
  for (let x = 0; x < W; x++) {
    const u = x / W;
    // band centre wanders with layered sines (the "flow")
    const cYa = SIN(u * 6.0 + time * 0.6) * H * 0.12;
    const cYb = SIN(u * 13.0 - time * 0.9) * H * 0.06;
    const cY = baseY + cYa + cYb;
    // intensity envelope along x — curtains brighten and dim in patches
    const env = clamp01(0.35 + 0.65 * (0.5 + 0.5 * SIN(u * 9.0 + time * 0.4)));
    // ribbon striations: high-frequency pleats that drift, like folded silk
    const ribbon = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * SIN(u * 70.0 + SIN(u * 7.0) * 4.0 - time * 1.1), 1.6);
    const widthTop = H * (0.20 + 0.12 * (0.5 + 0.5 * SIN(u * 4.0 - time * 0.5)));
    const widthBot = H * 0.045;
    // hue drifts along x and slowly in time: emerald → teal → violet
    const hue = 0.30 + 0.40 * (0.5 + 0.5 * SIN(u * 2.2 + time * 0.25));
    const toViolet = smoothstep(0.46, 0.74, hue);
    const toTeal = smoothstep(0.30, 0.52, hue);
    // hand-tuned emerald/teal/violet ramp (no full HSV rainbow)
    const cr = 30 + 28 * toTeal + 150 * toViolet;
    const cg = 195 - 50 * toTeal - 90 * toViolet;
    const cb = 90 + 80 * toTeal + 90 * toViolet;
    // Bound the vertical band that can clear the a>=0.02 cut so we never iterate
    // the (mostly empty) full column, then let the per-pixel cut keep it exact.
    // Conservative superset: fall <= 1.35*EXP(-dy²*1.6) (above), ==EXP(-dy²*1.6)
    // (below); a drawn pixel needs EXP(-dy²*1.6) >= thr → dy² <= -ln(thr)/1.6.
    // The above span ends at floor(cY) (last y<cY); below starts at floor(cY)+1.
    const er = env * reveal;
    // above = y < cY (ends at belowStart-1); below = y >= cY (starts at ceil cY).
    const belowStart = Math.ceil(cY);
    const aboveEnd = belowStart - 1;
    let yLo: number, yHi: number;
    if (er > 1e-6) {
      const argAbove = 0.02 / (1.35 * er);
      const argBelow = 0.02 / er;
      // above qualifying span [aboveLo, aboveEnd]
      let aboveLo = belowStart; // empty by default (start > aboveEnd)
      if (argAbove <= 1) {
        const la = -Math.log(argAbove);
        const dyMax = SQRT((la > 0 ? la : 0) / 1.6) * widthTop;
        const lo = Math.floor(cY - dyMax);
        aboveLo = lo > 0 ? lo : 0;
      }
      // below qualifying span [belowStart, belowHi]
      let belowHi = aboveEnd; // empty by default (end < belowStart)
      if (argBelow <= 1) {
        const lb = -Math.log(argBelow);
        const dyMax = SQRT((lb > 0 ? lb : 0) / 1.6) * widthBot;
        const hi = (cY + dyMax) | 0;
        belowHi = hi < H - 1 ? hi : H - 1;
      }
      const aboveOK = aboveLo <= aboveEnd;
      const belowOK = belowHi >= belowStart;
      if (!aboveOK && !belowOK) continue; // nothing in this column
      yLo = aboveOK ? aboveLo : belowStart;
      yHi = belowOK ? belowHi : aboveEnd;
    } else {
      continue; // column contributes nothing
    }
    if (yLo < yTopClip) yLo = yTopClip;
    if (yHi > yBotClip) yHi = yBotClip;
    for (let y = yLo; y <= yHi; y++) {
      const above = y < cY;
      // Keep the exact original arithmetic (division, not reciprocal-multiply,
      // and the original product association) so output stays bit-identical.
      const wdt = above ? widthTop : widthBot;
      const dy = (y - cY) / wdt;
      const dy2 = dy * dy;
      let fall = EXP(-dy2 * 1.6);
      // vertical streaks: brighter near the top "ribbons", lit by the striations
      if (above) {
        const top = 1 - (cY - y) / (cY + 1);
        fall *= (0.45 + 0.55 * top) * ribbon;
        // a crisp luminous crest right at the upper edge of each pleat
        fall += EXP(-dy2 * 9.0) * 0.35 * ribbon * top;
      }
      const a = fall * env * reveal;
      if (a < 0.02) continue;
      t.addPixel(x, y, cr * a, cg * a, cb * a);
    }
  }
  // One restrained title — fades up late, then out before the loop.
  const fade = smoothstep(0.5, 1.4, local) * smoothstep(0, FADE, SCENES[3].dur - local);
  const a = fade * reveal;
  if (a > 0.02) {
    const cy = (H * 0.5) | 0;
    centeredText(t, cy - 8, 'CINEMA', 250, 240, 225, 2, a);
    const rw = (Term.textWidth('CINEMA', 2) * (0.5 + 0.5 * fade)) | 0;
    const rx = ((W - rw) / 2) | 0;
    for (let i = 0; i < rw; i++) t.addPixel(rx + i, cy + 7, 110 * a, 95 * a, 70 * a);
    centeredText(t, cy + 11, 'RENDERED IN A TERMINAL', 170, 165, 150, 1, a * 0.85);
  }
}

// ── final full-frame grade: vignette + split-tone + grain ─────────────────────
// Reused scratch for the per-column horizontal vignette term (dx*dx). Sized lazily.
let gradeColSq = new Float64Array(0);
// `yStart`/`yEnd` restrict grading to the visible interior; the letterbox bar
// rows are about to be blacked out so grading them is pure waste.
function grade(t: Term, time: number, yStart: number, yEnd: number): void {
  const W = t.W;
  const H = t.H;
  const buf = t.buf;
  const cx = W * 0.5;
  const cy = H * 0.5;
  const invMaxd = 1 / (cx * cx + cy * cy);
  const gp = (time * 60) | 0; // grain advances deterministically per frame
  // Per-column dx*dx is loop-invariant in y → precompute once per frame.
  if (gradeColSq.length < W) gradeColSq = new Float64Array(W);
  const colSq = gradeColSq;
  for (let x = 0; x < W; x++) {
    const dx = x - cx;
    colSq[x] = dx * dx;
  }
  for (let y = yStart; y < yEnd; y++) {
    const dy = y - cy;
    const dySq = dy * dy;
    const rowBase = y * W * 3;
    // Inline grain hash: hash2(x+gp, y-gp). The y-term is loop-invariant in x.
    const yh = Math.imul((y - gp) | 0, 668265263);
    let i = rowBase;
    for (let x = 0; x < W; x++) {
      let r = buf[i];
      let g = buf[i + 1];
      let b = buf[i + 2];
      // vignette (squared for a soft, filmic falloff)
      const d = (colSq[x] + dySq) * invMaxd;
      const vig = 1 - 0.5 * d * d;
      // split-tone: warm highlights, teal shadows (smoothstep inlined)
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) * (1 / 255);
      // warm = smoothstep(0.4, 1, lum) → range 0.6
      let tw = (lum - 0.4) * (1 / 0.6);
      tw = tw < 0 ? 0 : tw > 1 ? 1 : tw;
      const warm = tw * tw * (3 - 2 * tw);
      // teal = 1 - smoothstep(0, 0.45, lum) → range 0.45
      let tt = lum * (1 / 0.45);
      tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
      const teal = 1 - tt * tt * (3 - 2 * tt);
      r = r + warm * 13 - teal * 7;
      g = g + warm * 5 + teal * 3;
      b = b - warm * 9 + teal * 15;
      // subtle additive film grain (inlined hash2)
      let h = (Math.imul((x + gp) | 0, 374761393) ^ yh) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      const rnd = ((h ^ (h >>> 16)) >>> 0) * (1 / 4294967296);
      const n = (rnd - 0.5) * 16;
      r = (r + n) * vig;
      g = (g + n) * vig;
      b = (b + n) * vig;
      buf[i] = r < 0 ? 0 : r > 255 ? 255 : r;
      buf[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      buf[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      i += 3;
    }
  }
}

// ── 2.39:1 letterbox (pure-black bars, drawn after the grade) ─────────────────
function letterboxBar(t: Term): number {
  const targetH = t.W / 2.39;
  return Math.max(2, Math.round((t.H - targetH) / 2));
}
function letterbox(t: Term, bar: number): number {
  for (let y = 0; y < bar; y++) {
    const top = y * t.W * 3;
    const bot = (t.H - 1 - y) * t.W * 3;
    for (let x = 0; x < t.W; x++) {
      t.buf[top + x * 3] = 0;
      t.buf[top + x * 3 + 1] = 0;
      t.buf[top + x * 3 + 2] = 0;
      t.buf[bot + x * 3] = 0;
      t.buf[bot + x * 3 + 1] = 0;
      t.buf[bot + x * 3 + 2] = 0;
    }
  }
  return bar;
}

// ── main ──────────────────────────────────────────────────────────────────────
runDemo({
  title: 'CINEMA',
  hud: 'A SELF-PLAYING REEL - 4 SCENES - 2.39:1 - PURE TYPESCRIPT',
  captureT: 12,
  init: (t) => {
    const rng = mulberry32(20260601);
    // Parallax starfield in normalized space (used by nebula + aurora bed).
    bgStars = [];
    const NB = Math.max(220, ((t.W * t.H) / 80) | 0);
    for (let i = 0; i < NB; i++) bgStars.push({ x: rng(), y: rng(), z: rng(), seed: rng() });

    // Value-noise nebula field: smooth a white-noise grid a few times.
    const tmp = new Float32Array(NEB_W * NEB_H);
    for (let i = 0; i < neb.length; i++) neb[i] = rng();
    for (let pass = 0; pass < 4; pass++) {
      for (let y = 0; y < NEB_H; y++) {
        for (let x = 0; x < NEB_W; x++) {
          const xm = (x - 1 + NEB_W) % NEB_W;
          const xp = (x + 1) % NEB_W;
          const ym = (y - 1 + NEB_H) % NEB_H;
          const yp = (y + 1) % NEB_H;
          tmp[y * NEB_W + x] =
            (neb[y * NEB_W + x] * 4 +
              neb[y * NEB_W + xm] +
              neb[y * NEB_W + xp] +
              neb[ym * NEB_W + x] +
              neb[yp * NEB_W + x]) /
            8;
        }
      }
      neb.set(tmp);
    }
    // normalize to 0..1
    let mn = Infinity;
    let mx = -Infinity;
    for (let i = 0; i < neb.length; i++) {
      if (neb[i] < mn) mn = neb[i];
      if (neb[i] > mx) mx = neb[i];
    }
    const span = mx - mn || 1;
    for (let i = 0; i < neb.length; i++) neb[i] = (neb[i] - mn) / span;

    // Galaxy: a logarithmic-spiral disc with two arms.
    GAL_N = 1500;
    galaxy = new Float32Array(GAL_N * 4);
    for (let i = 0; i < GAL_N; i++) {
      const u = rng();
      const r = Math.pow(u, 0.6); // radius biased toward the core
      const arm = (i % 2) * Math.PI;
      const wind = 3.2; // arm tightness
      const jitter = (rng() - 0.5) * (0.45 + 0.85 * (1 - r));
      const ang = arm + Math.log(r * 6 + 1) * wind + jitter;
      const bri = 0.25 + 0.75 * rng() * (1.1 - r * 0.35);
      const hue = rng();
      galaxy[i * 4 + 0] = r;
      galaxy[i * 4 + 1] = ang;
      galaxy[i * 4 + 2] = bri;
      galaxy[i * 4 + 3] = hue;
    }
  },
  frame: (t, time) => {
    t.clear(0, 0, 0);
    const { idx, local, reveal } = timeline(time);
    const scene = SCENES[idx].name;

    if (scene === 'nebula') sceneNebula(t, local, reveal, time);
    else if (scene === 'galaxy') sceneGalaxy(t, local, reveal, time);
    else if (scene === 'ocean') sceneOcean(t, local, reveal, time);
    else if (scene === 'aurora') sceneAurora(t, local, reveal, time);

    // Grade only the visible interior — the letterbox bars are about to be
    // overwritten with pure black, so grading those rows is wasted work.
    const bar = letterboxBar(t);
    grade(t, time, bar, t.H - bar);
    letterbox(t, bar);
  },
});
