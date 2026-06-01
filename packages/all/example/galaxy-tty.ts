/**
 * Galaxy TTY — a living spiral galaxy, in your terminal.
 *
 * A cinematic grand-design spiral galaxy rendered straight into a half-block
 * TRUECOLOR framebuffer with HDR additive accumulation and an ACES filmic
 * tonemap — the terminal cousin of the GPU `particle-galaxy.ts`. ~30,000 stars
 * orbit a softened central black-hole + dark-matter-halo potential under genuine
 * DIFFERENTIAL ROTATION: each star's angular speed follows the analytic circular
 * curve Ω(r)=v_c(r)/r (fast inner, slow outer), with a small epicyclic wobble, so
 * the disk shears exactly like a real galaxy.
 *
 * The spiral ARMS are a slowly-rotating two-arm LOGARITHMIC DENSITY WAVE (Lin–Shu
 * density-wave theory: spiral arms are standing waves the stars stream THROUGH, not
 * material arms that wind up into rings). A star's distance to the nearest arm crest
 * — θ_arm(r,t) = ±π/2·(...)  with crests winding as −cot(pitch)·ln r and the whole
 * pattern turning at a fixed pattern speed Ω_p — drives its colour and brightness:
 * inside an arm, stars light up hot blue-white (compressed gas → young stars); a
 * golden bulge fills the nucleus; cool amber populates the outskirts and the broad
 * inter-arm disk. Because the pattern turns slowly while stars orbit fast, the arms
 * stay crisp and OPEN, slowly winding, never collapsing into a ring.
 *
 * RENDER. Each star splats a soft additive Gaussian blob into a linear HDR buffer.
 * A compact, legible golden nucleus (NOT a blown-out disk); interstellar DUST that
 * darkens & reddens the leading edge of each arm into dark lanes; a gentle separable
 * BLOOM; a deep-space STARFIELD; and a vignette compose the frame, which is then
 * ACES-tonemapped so the core is bright but never clipped and the arms stay readable.
 * The disk is projected with a small inclination for depth and turns slowly.
 *
 * Scales to any terminal: stars live in world space; the scene is re-projected to
 * t.W×t.H every frame (using t.aspect for round geometry), so it reflows on resize.
 *
 * Technique: analytic differential rotation + epicyclic wobble · rotating log-spiral
 *   density wave · density-lit hot-blue arms + dust lanes · HDR additive Gaussian
 *   splat · separable bloom · ACES tonemap · inclined disk projection.
 *
 * Run: bun run packages/all/example/galaxy-tty.ts
 */
import { runDemo, Term, clamp01, lerp, smoothstep, aces, mulberry32, TAU } from './_term';

// Tuning override hook (GAL_<NAME>) so captures can sweep without recompiling.
const envN = (name: string, fallback: number): number => {
  const v = process.env[`GAL_${name}`];
  const n = v === undefined || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ── Simulation scale ───────────────────────────────────────────────────────────
const STAR_COUNT = envN('STARS', 30000) | 0;   // tuned for >=120 bench fps at 160x50
const GALAXY_R = 9.0;                           // world-space disk radius the camera frames

// ── Rotation curve (softened black hole + flat-ish dark-matter halo) ───────────
const G = 1.0;
const M_BH = 12.0;                  // central mass → fast inner Keplerian spin
const SOFT_BH = 0.45;              // BH softening (bounds inner Ω; keeps it integrable)
const M_HALO = 26.0;              // halo mass → flat outer rotation curve
const R_HALO = GALAXY_R * 0.9;
const SOFTEN = 1.05;
const DISK_SCALE = GALAXY_R * 0.42; // exponential disk scale length h
const BULGE_R = GALAXY_R * 0.17;
const BULGE_FRAC = 0.10;

const haloEnclosed = (r: number): number => {
  const x = Math.min(1, r / R_HALO);
  return M_HALO * x * x * (1.5 - 0.5 * x);
};
// Circular speed v_c(r) and angular speed Ω(r)=v_c/r from the analytic potential.
const circularSpeed = (r: number): number => {
  const aBH = (G * M_BH * r) / (r * r + SOFT_BH * SOFT_BH);
  const aHalo = (G * haloEnclosed(r) * r) / (r * r + SOFTEN * SOFTEN);
  return Math.sqrt(Math.max(0, aBH + aHalo));
};

// ── Density-wave spiral pattern ────────────────────────────────────────────────
const ARM_COUNT = 2;                       // grand-design two-arm spiral
const PITCH = envN('PITCH', 0.40);         // arm pitch angle (rad); ~23° → open arms
const ARM_WIND = 1 / Math.tan(PITCH);      // = cot(pitch), how fast crests wind with ln r
const PATTERN_SPEED = envN('OMEGAP', 0.085); // pattern angular speed Ω_p (rad/s) — slow
const ARM_WIDTH = envN('ARMW', 0.40);      // angular half-width of an arm crest (rad)
const ARM_R0 = GALAXY_R * 0.10;            // inside this, arms dissolve into the bulge

// Signed angular distance (−π..π) of azimuth φ to the nearest arm crest at radius r,
// time t. Crests sit where  ARM_COUNT·(φ − Ω_p·t) + ARM_WIND·ln(r/ARM_R0)  ≡ 0 (mod 2π).
const armPhase = (phi: number, r: number, t: number): number => {
  const s = ARM_COUNT * (phi - PATTERN_SPEED * t) + ARM_WIND * Math.log(Math.max(r, ARM_R0 * 0.5) / ARM_R0);
  // wrap to (−π, π]; /ARM_COUNT brings it back to an azimuthal distance
  let w = s % TAU;
  if (w > Math.PI) w -= TAU;
  if (w < -Math.PI) w += TAU;
  return w / ARM_COUNT;
};

// ── State arrays (allocated in init) ───────────────────────────────────────────
let r0!: Float32Array;     // orbital radius (fixed per star)
let phi0!: Float32Array;   // initial azimuth
let omega!: Float32Array;  // angular speed Ω(r) (precomputed)
let yoff!: Float32Array;   // disk-plane vertical offset (thickness)
let epiAmp!: Float32Array; // epicyclic radial wobble amplitude
let epiPh!: Float32Array;  // epicyclic phase
let epiW!: Float32Array;   // epicyclic frequency
let baseTemp!: Float32Array; // base population colour temp 0..1
let starMass!: Float32Array; // relative render mass/brightness weight
let armBias!: Float32Array;  // per-star [0..1] tendency to be an arm (young) star
// ── Derived per-star constants (precomputed once for the hot loop) ─────────────
let massW!: Float32Array;  // (0.55 + 0.30*starMass[i]) brightness mass weight
let armMul!: Float32Array; // arm-membership multiplier (1 for arm stars, 0.35 else)

// ── Fast exp(-x) for x>=0 via a LUT with linear interp (Gaussian falloffs) ─────
// Domain [0, EXP_MAX); beyond that exp(-x) is negligible (<3e-4) → 0.
const EXP_MAX = 8;
const EXP_N = 2048;
const EXP_LUT = new Float32Array(EXP_N + 1);
const EXP_SCALE = EXP_N / EXP_MAX;
for (let i = 0; i <= EXP_N; i++) EXP_LUT[i] = Math.exp(-(i / EXP_SCALE));
const expNeg = (x: number): number => {
  if (x <= 0) return 1;
  if (x >= EXP_MAX) return 0;
  const f = x * EXP_SCALE;
  const i = f | 0;
  const t = f - i;
  const a = EXP_LUT[i];
  return a + (EXP_LUT[i + 1] - a) * t;
};

// ── sin/cos LUT (interpolated) for the per-star orbit angle ────────────────────
// 16384 entries over [0,TAU) → angular step ~3.8e-4 rad; with linear interp the
// position error is far below one pixel, so the splat is visually identical.
const TRIG_N = 16384;
const TRIG_MASK = TRIG_N - 1;
const SIN_LUT = new Float32Array(TRIG_N + 1);
const COS_LUT = new Float32Array(TRIG_N + 1);
const TRIG_SCALE = TRIG_N / TAU;
for (let i = 0; i <= TRIG_N; i++) {
  const a = (i / TRIG_N) * TAU;
  SIN_LUT[i] = Math.sin(a);
  COS_LUT[i] = Math.cos(a);
}
const INV_TAU = 1 / TAU;

// ── ln(x) LUT for the arm-phase term (x ∈ [LN_LO, LN_HI]) ──────────────────────
// Input is (clamped radius)/ARM_R0 ∈ [0.5, ~14]; a fine interpolated table matches
// Math.log closely enough to be byte-identical after quantization.
const LN_LO = 0.5, LN_HI = 16;
const LN_N = 8192;
const LN_LUT = new Float32Array(LN_N + 1);
const LN_SCALE = LN_N / (LN_HI - LN_LO);
for (let i = 0; i <= LN_N; i++) LN_LUT[i] = Math.log(LN_LO + i / LN_SCALE);
const lutLog = (x: number): number => {
  if (x <= LN_LO) return LN_LUT[0];
  if (x >= LN_HI) return Math.log(x);
  const f = (x - LN_LO) * LN_SCALE;
  const i = f | 0;
  const t = f - i;
  const a = LN_LUT[i];
  return a + (LN_LUT[i + 1] - a) * t;
};

// ── Seed the disk ──────────────────────────────────────────────────────────────
const initSim = (): void => {
  r0 = new Float32Array(STAR_COUNT);
  phi0 = new Float32Array(STAR_COUNT);
  omega = new Float32Array(STAR_COUNT);
  yoff = new Float32Array(STAR_COUNT);
  epiAmp = new Float32Array(STAR_COUNT);
  epiPh = new Float32Array(STAR_COUNT);
  epiW = new Float32Array(STAR_COUNT);
  baseTemp = new Float32Array(STAR_COUNT);
  starMass = new Float32Array(STAR_COUNT);
  armBias = new Float32Array(STAR_COUNT);
  massW = new Float32Array(STAR_COUNT);
  armMul = new Float32Array(STAR_COUNT);

  const rng = mulberry32(0x5EED1234);
  const gauss = (): number => rng() + rng() + rng() + rng() - 2.0; // ~N(0,0.577)

  for (let i = 0; i < STAR_COUNT; i++) {
    const isBulge = rng() < BULGE_FRAC;
    let r: number;
    if (isBulge) {
      r = BULGE_R * Math.pow(rng(), 0.6);
    } else {
      r = -DISK_SCALE * Math.log(Math.max(1e-4, rng()));
      r = Math.min(r, GALAXY_R * 1.35);
      r = Math.max(r, GALAXY_R * 0.02);
    }
    const rNorm = r / GALAXY_R;
    r0[i] = r;

    // Bias the azimuth of DISK stars toward the spiral crests at t=0 by rejection
    // sampling the density-wave profile — this is the "young population" that traces
    // the arms; bulge + a fraction of disk stars stay uniform (the smooth disk).
    let phi = rng() * TAU;
    const young = !isBulge && rng() < 0.62;
    armBias[i] = young ? 1 : 0;
    if (young) {
      for (let tries = 0; tries < 10; tries++) {
        const cand = rng() * TAU;
        phi = cand;
        const d = armPhase(cand, r, 0);
        const w = Math.exp(-(d * d) / (2 * ARM_WIDTH * ARM_WIDTH));
        if (rng() < 0.12 + 0.88 * w) break; // accept near a crest; floor keeps some spread
      }
    }
    phi0[i] = phi;

    omega[i] = circularSpeed(r) / Math.max(r, 1e-3);

    // thickness: thin disk that flares slightly; bulge is a puffy spheroid
    const thick = isBulge
      ? BULGE_R * 0.55 * Math.pow(1 - Math.min(1, r / BULGE_R), 0.5)
      : 0.035 * GALAXY_R * (0.5 + 0.7 * Math.min(1, rNorm));
    yoff[i] = gauss() * thick;

    // epicyclic radial wobble for life (small, frequency ~ orbital): a star breathes
    // in/out of its mean radius so the disk isn't a frozen pattern.
    epiAmp[i] = (isBulge ? 0.03 : 0.05) * r * (0.4 + rng());
    epiPh[i] = rng() * TAU;
    epiW[i] = omega[i] * (1.3 + 0.4 * rng()); // near the epicyclic frequency κ≈√2·Ω

    // base population colour: warm-gold bulge, cooler amber outskirts. Young arm
    // stars get their hot-blue boost at render time from the live wave.
    let tc: number;
    if (isBulge) tc = 0.40 + gauss() * 0.05;
    else tc = 0.46 - 0.26 * rNorm + gauss() * 0.10;
    baseTemp[i] = clamp01(tc);

    // render mass weight: a few bright giants anchor the arms visually
    const u = rng();
    starMass[i] = 0.55 + 3.2 * u * u * u + (young ? 0.5 : 0);

    // precomputed hot-loop constants
    massW[i] = 0.55 + 0.30 * starMass[i];
    armMul[i] = young ? 1 : 0.35; // young flag == armBias>0.5
  }
};

// ── temperature 0..1 → emissive RGB (linear, ~0..1) ─────────────────────────────
// 1 = hot blue-white, ~0.45 = gold, 0 = deep red. 256-entry LUT (branchless hot path).
const TEMP_LUT_R = new Float32Array(256);
const TEMP_LUT_G = new Float32Array(256);
const TEMP_LUT_B = new Float32Array(256);
{
  for (let i = 0; i < 256; i++) {
    const tc = i / 255;
    let r: number, g: number, b: number;
    if (tc > 0.62) {
      const k = (tc - 0.62) / 0.38;
      r = lerp(0.74, 0.58, k); g = lerp(0.84, 0.74, k); b = lerp(1.0, 1.0, k);   // blue-white → blue
    } else if (tc > 0.42) {
      const k = (tc - 0.42) / 0.20;
      r = lerp(1.0, 0.74, k); g = lerp(0.90, 0.84, k); b = lerp(0.68, 1.0, k);   // white → blue-white
    } else if (tc > 0.22) {
      const k = (tc - 0.22) / 0.20;
      r = lerp(1.0, 1.0, k); g = lerp(0.60, 0.90, k); b = lerp(0.28, 0.68, k);   // gold → white
    } else {
      const k = tc / 0.22;
      r = lerp(0.93, 1.0, k); g = lerp(0.32, 0.60, k); b = lerp(0.20, 0.28, k);  // red → gold
    }
    TEMP_LUT_R[i] = r; TEMP_LUT_G[i] = g; TEMP_LUT_B[i] = b;
  }
}

// ── Render scratch (allocated per size) ────────────────────────────────────────
let acc!: Float32Array;     // HDR accumulation (R,G,B linear) length W*H*3
let bloomA!: Float32Array;  // downsampled bright pass (half-res, RGB)
let bloomB!: Float32Array;  // blur scratch
let starBuf!: Float32Array; // baked deep-space starfield (RGB)
let vigBuf!: Float32Array;  // baked vignette (per pixel)
let bw = 0, bh = 0;
let lastW = -1, lastH = -1;

const allocForSize = (W: number, H: number, aspect: number): void => {
  acc = new Float32Array(W * H * 3);
  bw = (W >> 1) || 1;
  bh = (H >> 1) || 1;
  bloomA = new Float32Array(bw * bh * 3);
  bloomB = new Float32Array(bw * bh * 3);

  const cx = W * 0.5, cy = H * 0.5;
  const maxR = Math.hypot(cx, cy);

  // Bake a faint, sparse deep-space starfield over near-black space. The ambient
  // floor is whisper-thin and decays to true black well before the frame edge, so
  // space reads deep and the arms keep their contrast (no grey-blue inter-arm haze).
  starBuf = new Float32Array(W * H * 3);
  const srng = mulberry32(0x9E3779B1);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 3;
      const d = Math.hypot(x - cx, y - cy) / maxR;
      // cubic falloff that hits ~0 by the corners → black space, faint cool halo near disk
      const g = clamp01(1 - d * 1.35);
      const g3 = g * g * g;
      starBuf[o] = 0.0016 + 0.0030 * g3;
      starBuf[o + 1] = 0.0024 + 0.0050 * g3;
      starBuf[o + 2] = 0.0052 + 0.0096 * g3;
    }
  }
  // Two passes: a dense field of dim pinpoints, plus a sparse few crisp brighter stars
  // with tasteful temperature tint (warm-amber ↔ cool-blue), never pure saturated.
  const addStar = (b: number): void => {
    const x = (srng() * W) | 0;
    const y = (srng() * H) | 0;
    const o = (y * W + x) * 3;
    const tint = srng();              // 0 warm .. 1 cool
    const warm = clamp01(1 - tint * 1.6);
    const cool = clamp01(tint * 1.6 - 0.6);
    starBuf[o] += b * (0.86 + 0.14 * warm);
    starBuf[o + 1] += b * (0.84 + 0.10 * warm + 0.06 * cool);
    starBuf[o + 2] += b * (0.80 + 0.20 * cool);
  };
  const nDim = Math.floor(W * H * 0.013);
  for (let s = 0; s < nDim; s++) { const u = srng(); addStar(0.03 + u * u * 0.22); }
  const nBright = Math.floor(W * H * 0.0016);
  for (let s = 0; s < nBright; s++) { const u = srng(); addStar(0.30 + u * u * 0.55); }

  // Bake the vignette (de-squash x by aspect so it's a round falloff).
  vigBuf = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / aspect, dy = y - cy;
      const d = Math.hypot(dx, dy) / Math.hypot(cx / aspect, cy);
      vigBuf[y * W + x] = 1 - 0.42 * Math.pow(clamp01(d), 2.3);
    }
  }
};

const frame = (t: Term, time: number, _dt: number, _frameNo: number): void => {
  const W = t.W, H = t.H, aspect = t.aspect;
  if (W !== lastW || H !== lastH) {
    allocForSize(W, H, aspect);
    lastW = W; lastH = H;
  }

  acc.fill(0);
  const buf = acc;

  // ── projection: slow global viewing rotation + inclination, fit disk to screen ──
  const view = time * 0.05;               // very slow camera turn
  const cosV = Math.cos(view), sinV = Math.sin(view);
  const cx = W * 0.5, cy = H * 0.5;
  const fit = Math.min(W / aspect, H) * 0.5;
  const scale = fit / (GALAXY_R * 1.14);
  const sxScale = scale * aspect;         // x-axis scale (keeps the disk round)
  // Nucleus-density normalization: the bulge maps to a fixed angular size, so at low pixel
  // counts its dense stars pile into very few pixels and clip the core to a flat white dot.
  // Scale per-star flux by the pixel budget (∝ disk-fit in px) so the nucleus keeps the same
  // contrast at every terminal size. Clamped to ≤1 → only *dims* small frames; the verified
  // large/reference look (where fit is generous) is left untouched.
  let densNorm = fit * (1 / 60);          // fit≈64px at the 230×64 reference; ~34px at 110×34
  densNorm = densNorm < 1 ? 0.30 + 0.70 * densNorm * densNorm : 1;
  const cosI = Math.cos(1.02), sinI = Math.sin(1.02); // inclination

  const Wc = W;
  const Wc3 = W * 3;

  // hoisted loop-invariants for the per-star inner loop
  const INV_2ARMW2 = 1 / (2 * ARM_WIDTH * ARM_WIDTH);
  const INV_GR = 1 / GALAXY_R;
  const INV_2GR = 1 / (2 * GALAXY_R);
  // armFade = smoothstep(e0a,e1a,rn)*smoothstep(e0b,e1b,rn); precompute reciprocals
  const e0a = ARM_R0 / GALAXY_R, invSpanA = 1 / (0.26 - e0a);
  const e0b = 1.32, invSpanB = 1 / (1.05 - 1.32);
  const patT = PATTERN_SPEED * time;            // pattern advance this frame
  const armBaseS = ARM_COUNT * -patT;           // phi-independent part of arm phase
  const ARM_R0_HALF = ARM_R0 * 0.5;
  const INV_ARM_R0 = 1 / ARM_R0;
  // central-density taper: stars inside rn<CORE_TAPER_R fade their per-star emission to
  // CORE_TAPER_MIN at the very centre, so the dense bulge doesn't clip the nucleus white.
  const CORE_TAPER_R = 0.22, INV_CORE_TAPER_R = 1 / CORE_TAPER_R, CORE_TAPER_MIN = 0.10;

  // ── per-star: advance on its analytic orbit, light by the live density wave, splat ──
  for (let i = 0; i < STAR_COUNT; i++) {
    // analytic differential-rotation orbit + epicyclic radial wobble (sin via LUT)
    // args are non-negative (phase + ω·t with ω,t,phase ≥ 0) → |0 == floor for wrap
    const ea = epiW[i] * time + epiPh[i];
    const ef = (ea - ((ea * INV_TAU) | 0) * TAU) * TRIG_SCALE;
    const ei = ef | 0; const et = ef - ei;
    const epi = epiAmp[i] * (SIN_LUT[ei] + (SIN_LUT[ei + 1] - SIN_LUT[ei]) * et);
    const r = r0[i] + epi;
    const phi = phi0[i] + omega[i] * time;
    const pf = (phi - ((phi * INV_TAU) | 0) * TAU) * TRIG_SCALE;
    const pi = pf | 0; const pt = pf - pi;
    const cph = COS_LUT[pi] + (COS_LUT[pi + 1] - COS_LUT[pi]) * pt;
    const sph = SIN_LUT[pi] + (SIN_LUT[pi + 1] - SIN_LUT[pi]) * pt;
    const wx = r * cph;
    const wz = r * sph;
    const wy = yoff[i];

    // density-wave arm membership (inlined armPhase; log of the live wobbled radius)
    let s = ARM_COUNT * phi + armBaseS + ARM_WIND * lutLog((r > ARM_R0_HALF ? r : ARM_R0_HALF) * INV_ARM_R0);
    // wrap to (−π,π] via round-to-nearest range reduction (no fmod, no branches)
    const sn = s * INV_TAU;
    s -= ((sn >= 0 ? sn + 0.5 : sn - 0.5) | 0) * TAU;
    const d = s * 0.5;                            // /ARM_COUNT (==2)
    let armW = expNeg(d * d * INV_2ARMW2);        // 0..1, peak on crest
    // fade the wave into the bulge so the nucleus stays smooth/golden (inlined smoothstep)
    const rn = r * INV_GR;
    let fA = (rn - e0a) * invSpanA; fA = fA < 0 ? 0 : fA > 1 ? 1 : fA; fA = fA * fA * (3 - 2 * fA);
    let fB = (rn - e0b) * invSpanB; fB = fB < 0 ? 0 : fB > 1 ? 1 : fB; fB = fB * fB * (3 - 2 * fB);
    armW *= fA * fB;
    const arm = armW * armMul[i];                 // arm stars 1.0, smooth-disk 0.35

    // viewing rotation in the disk plane, then inclination tilt
    const rx = wx * cosV - wz * sinV;
    const rz = wx * sinV + wz * cosV;
    const sy = wy * cosI - rz * sinI;          // squashed vertical
    const depth = wy * sinI + rz * cosI;       // +depth = toward viewer

    const ix = (cx + rx * sxScale) | 0;
    const iy = (cy + sy * scale) | 0;
    if (ix < 1 || iy < 1 || ix >= W - 1 || iy >= H - 1) continue;

    // colour: base temp pushed hot-blue inside the arm (young stars in compressed gas)
    let tc = baseTemp[i] + 0.62 * (arm * arm); // arm² → only the crest goes truly blue
    if (tc > 1) tc = 1;
    const li = (tc * 255) | 0;
    const cr = TEMP_LUT_R[li], cg = TEMP_LUT_G[li], cb = TEMP_LUT_B[li];

    // brightness: low ambient disk floor + a STRONG arm term (so arms read clearly),
    // gentle mass weighting + a subtle depth shade (near edge slightly brighter).
    let sh = (depth + GALAXY_R) * INV_2GR; sh = sh < 0 ? 0 : sh > 1 ? 1 : sh;
    const shade = 0.80 + 0.20 * sh;
    // Central density compensation: the projected bulge packs hundreds of stars into a
    // few pixels, so their summed splats clip the nucleus to a flat WHITE dot. Taper each
    // star's individual emission toward r→0 (the unresolved bulge is rendered by the smooth
    // gold core injection below) so the centre stays a legible GOLDEN nucleus, never clipped.
    let cTap = densNorm;
    if (rn < CORE_TAPER_R) { const u = rn * INV_CORE_TAPER_R; cTap *= CORE_TAPER_MIN + (1 - CORE_TAPER_MIN) * (u * u * (3 - 2 * u)); }
    const bright = (0.028 + 0.160 * arm) * massW[i] * shade * cTap;

    const br = cr * bright, bg = cg * bright, bb = cb * bright;

    // 3×3 separable Gaussian footprint (centre 1, edges 0.5, corners 0.22)
    const base = (iy * W + ix) * 3;
    const br1 = br * 0.5, bg1 = bg * 0.5, bb1 = bb * 0.5;
    const br2 = br * 0.22, bg2 = bg * 0.22, bb2 = bb * 0.22;
    buf[base] += br; buf[base + 1] += bg; buf[base + 2] += bb;
    let o = base - 3;       buf[o] += br1; buf[o + 1] += bg1; buf[o + 2] += bb1;
    o = base + 3;           buf[o] += br1; buf[o + 1] += bg1; buf[o + 2] += bb1;
    const up = base - Wc3, dn = base + Wc3;
    o = up;                 buf[o] += br1; buf[o + 1] += bg1; buf[o + 2] += bb1;
    o = dn;                 buf[o] += br1; buf[o + 1] += bg1; buf[o + 2] += bb1;
    o = up - 3;             buf[o] += br2; buf[o + 1] += bg2; buf[o + 2] += bb2;
    o = up + 3;             buf[o] += br2; buf[o + 1] += bg2; buf[o + 2] += bb2;
    o = dn - 3;             buf[o] += br2; buf[o + 1] += bg2; buf[o + 2] += bb2;
    o = dn + 3;             buf[o] += br2; buf[o + 1] += bg2; buf[o + 2] += bb2;
  }

  // ── compact, legible GOLDEN nucleus ──
  // A tight warm point, not a pale disk: a crisp gold core sits over a soft amber bulge
  // glow. Kept restrained (low blue, sub-clip peak) so bloom can't blow it out to grey.
  {
    const coreR = Math.min(W / aspect, H) * 0.058;
    const coreR2 = coreR * coreR;
    const y0 = Math.max(1, (cy - coreR) | 0), y1 = Math.min(H - 2, (cy + coreR) | 0);
    const x0 = Math.max(1, (cx - coreR * aspect) | 0), x1 = Math.min(W - 2, (cx + coreR * aspect) | 0);
    for (let yy = y0; yy <= y1; yy++) {
      const dy = yy - cy;
      for (let xx = x0; xx <= x1; xx++) {
        const dx = (xx - cx) / aspect;
        const d2 = dx * dx + dy * dy;
        if (d2 > coreR2) continue;
        const core = Math.exp(-d2 / (coreR2 * 0.028)); // tight, crisp centre
        const bulge = Math.exp(-d2 / (coreR2 * 0.26));  // soft surrounding amber glow (tighter)
        const o = (yy * W + xx) * 3;
        // warm gold: R>G>B, green/blue rolled off harder toward the centre so the brightest
        // point reads GOLD, never a flat white dot. The `core` term is the tight gold point;
        // the (tighter, restrained) `bulge` is a compact amber halo — kept small so it doesn't
        // wash the whole nucleus pale at low terminal resolutions.
        buf[o]     += 0.82 * core + 0.34 * bulge;
        buf[o + 1] += 0.56 * core + 0.21 * bulge;
        buf[o + 2] += 0.26 * core + 0.09 * bulge;
      }
    }
  }

  // ── BLOOM: threshold + downsample + separable blur ──
  {
    const thr = 0.30; // higher knee → only true highlights bloom; arms/core stay crisp
    for (let y = 0; y < bh; y++) {
      const sy0 = y * 2;
      for (let x = 0; x < bw; x++) {
        const sx0 = x * 2;
        let rr = 0, gg = 0, bb = 0;
        for (let j = 0; j < 2; j++) {
          const yy = sy0 + j < H ? sy0 + j : H - 1;
          for (let k = 0; k < 2; k++) {
            const xx = sx0 + k < W ? sx0 + k : W - 1;
            const oo = (yy * W + xx) * 3;
            const a0 = buf[oo] - thr, a1 = buf[oo + 1] - thr, a2 = buf[oo + 2] - thr;
            if (a0 > 0) rr += a0; if (a1 > 0) gg += a1; if (a2 > 0) bb += a2;
          }
        }
        const oo = (y * bw + x) * 3;
        bloomA[oo] = rr * 0.25; bloomA[oo + 1] = gg * 0.25; bloomA[oo + 2] = bb * 0.25;
      }
    }
    const k0 = 0.4, k1 = 0.25, k2 = 0.05;
    for (let y = 0; y < bh; y++) {
      const rb = y * bw;
      for (let x = 0; x < bw; x++) {
        const oo = (rb + x) * 3;
        const xm2 = (rb + (x - 2 > 0 ? x - 2 : 0)) * 3, xm1 = (rb + (x - 1 > 0 ? x - 1 : 0)) * 3;
        const xp1 = (rb + (x + 1 < bw ? x + 1 : bw - 1)) * 3, xp2 = (rb + (x + 2 < bw ? x + 2 : bw - 1)) * 3;
        bloomB[oo]     = k0 * bloomA[oo]     + k1 * (bloomA[xm1] + bloomA[xp1])         + k2 * (bloomA[xm2] + bloomA[xp2]);
        bloomB[oo + 1] = k0 * bloomA[oo + 1] + k1 * (bloomA[xm1 + 1] + bloomA[xp1 + 1]) + k2 * (bloomA[xm2 + 1] + bloomA[xp2 + 1]);
        bloomB[oo + 2] = k0 * bloomA[oo + 2] + k1 * (bloomA[xm1 + 2] + bloomA[xp1 + 2]) + k2 * (bloomA[xm2 + 2] + bloomA[xp2 + 2]);
      }
    }
    for (let y = 0; y < bh; y++) {
      const ym2 = (y - 2 > 0 ? y - 2 : 0) * bw, ym1 = (y - 1 > 0 ? y - 1 : 0) * bw;
      const yp1 = (y + 1 < bh ? y + 1 : bh - 1) * bw, yp2 = (y + 2 < bh ? y + 2 : bh - 1) * bw;
      const rb = y * bw;
      for (let x = 0; x < bw; x++) {
        const oo = (rb + x) * 3;
        const om2 = (ym2 + x) * 3, om1 = (ym1 + x) * 3, op1 = (yp1 + x) * 3, op2 = (yp2 + x) * 3;
        bloomA[oo]     = k0 * bloomB[oo]     + k1 * (bloomB[om1] + bloomB[op1])         + k2 * (bloomB[om2] + bloomB[op2]);
        bloomA[oo + 1] = k0 * bloomB[oo + 1] + k1 * (bloomB[om1 + 1] + bloomB[op1 + 1]) + k2 * (bloomB[om2 + 1] + bloomB[op2 + 1]);
        bloomA[oo + 2] = k0 * bloomB[oo + 2] + k1 * (bloomB[om1 + 2] + bloomB[op1 + 2]) + k2 * (bloomB[om2 + 2] + bloomB[op2 + 2]);
      }
    }
  }

  // ── COMPOSITE: dust lanes + starfield + bloom + vignette + ACES tonemap → t.buf ──
  const out = t.buf;
  const invScale = 1 / scale;
  const invSx = 1 / sxScale;
  const EXPOSURE = 1.12;
  const BLOOM_GAIN = 0.40;
  // hoisted dust + tonemap invariants
  const INV_COSI = 1 / (cosI + 1e-6);
  const laneW = ARM_WIDTH * 0.42;
  const INV_2LANEW2 = 1 / (2 * laneW * laneW);
  const RR_LO = ARM_R0 * 1.2, RR_HI = GALAXY_R * 1.3;
  // fade = smoothstep(0.14,0.34,rn)*smoothstep(1.30,1.0,rn); rn = rr/GALAXY_R
  const fE0 = 0.14, fInvA = 1 / (0.34 - 0.14);
  const fE0b = 1.30, fInvB = 1 / (1.0 - 1.30);
  const dustBaseS = ARM_COUNT * -(PATTERN_SPEED * time); // phi-independent part of arm phase
  // ACES constants (inlined per channel)
  const Aa = 2.51, Ab = 0.03, Ac = 2.43, Ad = 0.59, Ae = 0.14;
  for (let yy = 0; yy < H; yy++) {
    const rowB = yy * W;
    const syw = (yy - cy) * invScale;
    const wzp = syw * INV_COSI;                 // approx world z (ignore depth shear)
    const wzpC = wzp * cosV, wzpS = wzp * sinV; // partials for un-rotation
    const bRow = (yy >> 1) * bw;
    for (let xx = 0; xx < W; xx++) {
      const o = (rowB + xx) * 3;
      let rl = buf[o], gl = buf[o + 1], bl = buf[o + 2];

      // DUST: unproject pixel → disk plane, place a dark lane just inside each arm
      // crest (real dust lanes ride the inner edge of spiral arms). Reddens as it dims.
      if (rl > 0.006 || gl > 0.006 || bl > 0.006) {
        const px = (xx - cx) * invSx;
        // un-rotate the viewing turn
        const uwx = px * cosV + wzpS;
        const uwz = -px * sinV + wzpC;
        const rr = Math.sqrt(uwx * uwx + uwz * uwz);
        if (rr > RR_LO && rr < RR_HI) {
          const aphi = Math.atan2(uwz, uwx);
          // inlined armPhase(aphi,rr,time) + 0.16 offset (toward the arm's inner edge)
          let s = ARM_COUNT * aphi + dustBaseS + ARM_WIND * lutLog((rr > ARM_R0_HALF ? rr : ARM_R0_HALF) * INV_ARM_R0);
          const sn = s * INV_TAU;
          s -= ((sn >= 0 ? sn + 0.5 : sn - 0.5) | 0) * TAU; // wrap to (−π,π]
          const dd = s * 0.5 + 0.16;          // s/ARM_COUNT, then the inner-edge offset
          const lane = Math.exp(-(dd * dd) * INV_2LANEW2);
          const rn = rr * INV_GR;
          let fa = (rn - fE0) * fInvA; fa = fa < 0 ? 0 : fa > 1 ? 1 : fa; fa = fa * fa * (3 - 2 * fa);
          let fb = (rn - fE0b) * fInvB; fb = fb < 0 ? 0 : fb > 1 ? 1 : fb; fb = fb * fb * (3 - 2 * fb);
          const tau = lane * fa * fb * 0.66;
          // chromatic extinction: dust scatters blue away → lanes darken cool-first, redden
          rl *= 1 - tau * 0.86; gl *= 1 - tau * 0.96; bl *= 1 - tau;
        }
      }

      const bo = (bRow + (xx >> 1)) * 3;
      rl += bloomA[bo] * BLOOM_GAIN + starBuf[o];
      gl += bloomA[bo + 1] * BLOOM_GAIN + starBuf[o + 1];
      bl += bloomA[bo + 2] * BLOOM_GAIN + starBuf[o + 2];

      const vig = vigBuf[rowB + xx] * EXPOSURE;
      rl *= vig; gl *= vig; bl *= vig;

      // inlined ACES filmic tonemap + clamp01, ×255 → byte
      let tr = (rl * (Aa * rl + Ab)) / (rl * (Ac * rl + Ad) + Ae); tr = tr < 0 ? 0 : tr > 1 ? 1 : tr;
      let tg = (gl * (Aa * gl + Ab)) / (gl * (Ac * gl + Ad) + Ae); tg = tg < 0 ? 0 : tg > 1 ? 1 : tg;
      let tb = (bl * (Aa * bl + Ab)) / (bl * (Ac * bl + Ad) + Ae); tb = tb < 0 ? 0 : tb > 1 ? 1 : tb;
      out[o] = (tr * 255) | 0;
      out[o + 1] = (tg * 255) | 0;
      out[o + 2] = (tb * 255) | 0;
    }
  }
};

runDemo({
  title: 'Galaxy TTY',
  hud: 'DIFFERENTIAL ROTATION - LOG-SPIRAL DENSITY WAVE - HDR ADDITIVE ACES',
  captureT: 8,
  init: () => {
    initSim();
  },
  frame,
});
