/**
 * Particle Galaxy — a 4-MILLION-star self-gravitating N-body galaxy, in pure TypeScript.
 *
 * A borderless ~16:9 window fills with a living, spinning spiral galaxy of 4,194,304
 * GPU-compute stars whose motion is REAL PHYSICS — not a scripted animation. Every star
 * carries an integrated POSITION, VELOCITY and its OWN MASS (drawn from a Salpeter stellar
 * IMF — a multitude of faint dwarfs and a rare few brilliant blue-white giants). Each frame a
 * chain of Direct3D 11 compute shaders (HLSL JIT-compiled at runtime over Bun FFI) advances the
 * whole disk with a symplectic leapfrog integrator under THREE genuine forces:
 *
 *   • a heavy softened CENTRAL BLACK HOLE — an invisible point mass the disk orbits, wrapped in
 *     a brilliant golden nuclear star cluster whipping around it on fast Keplerian orbits;
 *   • a smooth extended dark-matter HALO that flattens the outer rotation curve; and
 *   • GENUINE PER-STAR SELF-GRAVITY — every star deposits its own mass (Cloud-in-Cell, atomic)
 *     onto a 2-D particle-mesh field; a warm-started Jacobi relaxation solves the Poisson
 *     equation ∇²φ = source for the gravitational potential φ; each star then feels a_self =
 *     -∇φ at its position. So neighbours genuinely ATTRACT, dense regions deepen their own
 *     wells, giants anchor their surroundings, and spiral arms / clumps / dust lanes / spurs
 *     SELF-ORGANISE — they are GROWN by gravity, not painted on. A blast that removes mass from
 *     a region is felt, with real geometry, by everything around it.
 *
 * The galaxy is seeded as a SMOOTH, warm exponential disk + bulge — NOT a painted spiral — carrying
 * only a faint few-percent log-spiral density perturbation to break symmetry. At startup the field
 * solver is run once and each star's circular speed is reseeded from the MEASURED azimuthally-
 * averaged force (true thin-disk equilibrium, no spherical approximation), so the disk starts in
 * genuine balance and does NOT ring up. The live self-gravity then GROWS the arms by swing
 * amplification and differential rotation — they wind, feather, grow spurs and asymmetry, and
 * regenerate as recurrent transient spirals. The disk is tuned cool enough (Toomre Q≈1.3) to be
 * genuinely self-gravitating yet warm enough to favour open spirals over axisymmetric rings; the
 * black-hole + halo backbone keeps it globally stable. Gravity is softened near r=0 so the core can
 * never fling a star to infinity (no NaN, no blow-up). Stars that plunge into the black hole or
 * escape the rim respawn on fresh circular orbits, so the disk never depletes or disperses.
 *
 * INTERACTIONS inject REAL velocity, so momentum PERSISTS — releasing a button never
 * snaps stars back; the disk keeps moving and re-settles under its own gravity:
 *   • LEFT click  = BANG    — a one-shot radial OUTWARD impulse near the cursor (Gaussian
 *                             falloff) + an exposure/bloom FLASH; stars blast out, then fall
 *                             back and re-settle over seconds.
 *   • RIGHT hold  = IMPLODE — a strong moving gravity attractor at the cursor sucks stars in;
 *                             on release their momentum carries them onward.
 *   • MIDDLE hold = VORTEX  — a tangential swirl + mild inward pull: a real whirlpool that
 *                             keeps spinning after release.
 * The cursor is unprojected as a true ray onto the disk plane y=0 using the SAME orbiting
 * camera the scene renders with, so the well lands exactly under the pointer.
 *
 * Each star is rendered with NO vertex buffer: a vertex shader expands it into a soft additive
 * billboard quad (6 verts/star via SV_VertexID), projected through the cinematic orbiting camera
 * and coloured by REAL dynamics AND the live emergent structure — it samples the live density field
 * so young hot-blue stars light up exactly where gravity has GROWN a dense arm; plus a golden bulge,
 * cool red outskirts, relativistic Doppler beaming on the fast inner cluster, and mass-driven size.
 * Quads accumulate with pure-additive blending into an HDR R16G16B16A16_FLOAT target. Then a screen-
 * space FX pass makes the centre LEGIBLE (a brilliant compact accretion glow + gravitational-lensing
 * warp + faint Einstein ring marking the black hole) and lights the dense arms with H-alpha pink +
 * OIII cyan STAR-FORMING NEBULAE; interstellar DUST reads the same density grid to redden + darken
 * the disk into dark lanes; rare SUPERNOVA flashes bloom and fade (opt-in, GAL_SN=1); and a multi-resolution BLOOM
 * chain, ACES filmic tonemap, chroma recovery, a deep-space STARFIELD + gradient and a vignette
 * compose the back buffer. A flicker-free GDI HUD reads the live star count + fps.
 *
 * The self-gravity is MOMENTUM-CONSERVING and self-force-free: mass is deposited with a CIC kernel,
 * the grid force g=-∇φ is then interpolated back to each star with the SAME kernel, and a small
 * timestep keeps the stiff nucleus stable — so the disk runs as a near-conservative system with no
 * artificial drag or clamps (energy drift ~0.1%/s; verify with ENERGY_PROBE=1). Only clicks inject
 * energy. Stars unbound by a blast genuinely escape; a softened-core respawn protects the integrator.
 *
 * Pipeline (per physics sub-step, off a PeekMessage pump):
 *   1. CS clearGrid         — zero the GRID_N² density cells
 *   2. CS deposit  (CIC)    — each star atomically splats its OWN mass onto 4 field cells
 *   3. CS source            — de-scale cell mass → Poisson source
 *   4. CS jacobi ×K         — warm-started relaxation → gravitational potential φ
 *   5. CS force             — grid force g=-∇φ (central difference), for matched CIC interpolation
 *   6. CS integrate (KDK)   — leapfrog: black hole + halo + CIC(a_self) + interactions, respawn
 *   7. HDR splat (additive) — 4M billboards, blackbody colour, live-density arm lighting, Doppler
 *   8. DUST extinction      — live density grid reddens + darkens before bloom → dark dust lanes
 *   9. FX pass              — legible BH (accretion glow + lensing) + HII nebulae (supernovae opt-in)
 *  10. bright → 3× down+blur → composite (ACES + starfield) → back buffer + GDI HUD
 *
 * CONTROLS: left-DRAG orbits the cinematic camera, the WHEEL (or arrows) zooms; LEFT-click = bang,
 * RIGHT = implode, MIDDLE = vortex; C launches a galaxy COLLISION (a heavy intruder shown as a
 * VISIBLE companion nucleus on a close grazing pass, shearing the disk into real tidal tails + a
 * bridge, with an eased camera — no jolt); SPACE pauses (a true freeze you can still orbit), [ / ]
 * slow / speed time, . steps one frame; H toggles a help overlay; R resets; ESC exits.
 *
 * @bun-win32 / engine APIs (from ./_gpu, ./_gpu3d, ./_hud, ./_snapshot).
 *
 * Run: bun run packages/all/example/particle-galaxy.ts   (drag orbit · wheel zoom · C collide · H help)
 *   SELFSHOT=1 SELFSHOT_PATH=<abs.png> SELFSHOT_T=<simSeconds> DEMO_DURATION_MS=<ms> — capture a frame.
 *   ENERGY_PROBE=1 measures total-energy conservation; GAL_* env vars tune every physics/visual knob.
 */

import { GDI32, User32 } from '../index';
import { VirtualKey } from '@bun-win32/user32';
import * as gpu from './_gpu';
import * as gpu3d from './_gpu3d';
import * as hud from './_hud';
import { captureBackBuffer } from './_snapshot';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// Tuning override: any physics constant below can be overridden from the environment (e.g.
// `GAL_SELF_G_GAIN=24 GAL_VEL_DISP=0.05 bun run …`) so the capture loop can sweep parameters
// without recompiling. Falls back to the baked default when the env var is absent/blank.
const envNum = (name: string, fallback: number): number => {
  const v = process.env[`GAL_${name}`];
  const n = v === undefined || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ── Modest 16:9 window (never fill the monitor) ───────────────────────────────
const screenW = User32.GetSystemMetrics(0) || 1920;
const screenH = User32.GetSystemMetrics(1) || 1080;
const WIN_H = Math.min(1000, Math.floor(screenH * 0.72));
const WIN_W = Math.min(Math.floor(screenW * 0.9), Math.round((WIN_H * 16) / 9));

// ── 2048 × 2048 = 4,194,304 stars. numthreads(256) → count/256 groups. ────────
const PARTICLE_SIDE = 2048;
const PARTICLE_COUNT = PARTICLE_SIDE * PARTICLE_SIDE;
const THREADS_PER_GROUP = 256;
const GROUPS = PARTICLE_COUNT / THREADS_PER_GROUP;

// World-space disk radius the galaxy occupies (camera/projection tuned around this).
const GALAXY_RADIUS = 9.0;

// ── 2-D PARTICLE-MESH for GENUINE per-star self-gravity ───────────────────────
// Every star deposits its OWN mass (Cloud-in-Cell, bilinear) onto a GRID_N×GRID_N field
// covering the disk plane (x,z). A warm-started Jacobi relaxation solves the 2-D Poisson
// equation ∇²φ = source for the gravitational potential φ; each star then feels a_self = -∇φ
// sampled at its position. Neighbours genuinely attract, dense regions deepen their own wells,
// and spiral arms / clumps / spurs SELF-ORGANISE — not a painted-on kinematic pattern. The
// smooth GLOBAL field is carried analytically by the central black hole + halo (below), so the
// grid only has to supply LOCAL structure and the disk cannot ring up into axisymmetric shells
// (the failure mode of a naive PM disk with no stabilising backbone).
const GRID_N = envNum('GRID_N', 640); // field resolution (GRID_N² cells); multiple of 16
const FIELD_HALF = GALAXY_RADIUS * 2.25; // self-gravity field half-extent (covers the disk + margin); a star past it keeps orbiting on the analytic BH+halo, where self-gravity is negligible anyway
const CELL = (2 * FIELD_HALF) / GRID_N; // world width of one cell
const MASS_FIXED_SCALE = 1.0e7; // float mass → uint fixed-point for InterlockedAdd
const JACOBI_ITERS = envNum('JACOBI_ITERS', 32); // warm-started relaxation passes per sub-step
const GRID_GROUPS = Math.ceil(GRID_N / 16); // numthreads(16,16); ceil so a non-mult-of-16 GRID_N still covers (shaders bound-check id<GRID_N)

// ── Physics constants (shared with the integrate shader as cbuffer values) ────
// STABILITY MODEL: a heavy SOFTENED central BLACK HOLE sets the inner Keplerian spin (the
// bright nuclear cluster whips around it; softening keeps the r→0 singularity from flinging a
// star to infinity), an extended analytic HALO flattens the outer rotation curve, and the
// COLLECTIVE 2-D self-gravity (-∇φ) adds the disk's OWN local field on top. The disk is seeded
// in true rotational equilibrium against (BH + halo + its own analytic enclosed mass) and
// warmed by a small velocity dispersion (Toomre Q>1) so it neither collapses nor flies apart.
// The BH+halo backbone keeps Toomre Q high enough that the live self-gravity only sculpts
// LOCAL structure (arms, clumps, spurs) rather than globally fragmenting the disk.
const G_CONST = 1.0; // gravitational constant (folds into the mass scale)
const M_BH = envNum('M_BH', 18.0); // central BLACK HOLE mass (softened point mass, invisible)
const SOFT_BH = envNum('SOFT_BH', 0.3); // BH softening: peak accel M_BH/soft² stays < MAX_ACC (seed ≡ runtime force) and keeps inner Ω·dt < 1
const M_HALO = envNum('M_HALO', 30.0); // extended halo mass within R_HALO → a flat-ish v_c(r) curve. Lowered from 60 so the disk's own gravity carries much of the support (self-gravitating, Toomre Q≈1.3 — spiral-forming) yet stays warm enough that it sculpts open arms rather than shattering into axisymmetric rings (equilibrium-preserving: the measured seed v_c uses the same M_HALO)
const SOFTEN = envNum('SOFTEN', 1.1); // halo / general softening
const STAR_MASS = envNum('STARMASS', 0.000016); // MEAN per-star mass → total disk mass N·mean. Heavier than the old 1.1e-5 → more disk self-gravity (lower Toomre Q) → BOLDER emergent arms (equilibrium-preserving: scales seed & live force together)
const DT_FIXED = envNum('DT', 0.007); // physics timestep (s); smaller ⇒ less leapfrog heating of the stiff nucleus
// SELF_G_GAIN ↔ DISK_SEED_W are a MATCHED, VERIFIED-STABLE pair: DISK_SEED_W is how much of the
// disk's own gravity the SEED v_c assumes; SELF_G_GAIN is the live weight that REPRODUCES that
// support so the disk starts in equilibrium. DO NOT change this pair to crank self-gravity — its
// calibration is delicate (a mismatch rings the disk up). Instead use the EQUILIBRIUM-PRESERVING
// levers: M_HALO (smaller backbone → disk carries more support) and STAR_MASS (heavier disk → more
// self-gravity); both scale seed AND live force together, so the disk stays balanced as it gets more
// self-gravitating. VEL_DISP cools the disk (lower Toomre Q → swing-amplified arms) without touching
// the radial balance.
const SELF_G_GAIN = envNum('SELF_G_GAIN', 26.0); // weight on the 2-D self-gravity (-∇φ) [verified-stable]
const DISK_SEED_W = envNum('DISK_SEED_W', 0.65); // disk self-gravity weight to balance the SEED v_c
const VEL_DISP = envNum('VEL_DISP', 0.045); // velocity dispersion as a fraction of v_c (Toomre Q≈1.3): warm enough to SUPPRESS axisymmetric ring modes, cool enough that self-gravity keeps sculpting open spiral arms / spurs / feathering from the seed
// CONSERVATIVE BY DEFAULT — no drag, no clamps. Once the particle-mesh force was made
// momentum-conserving (CIC deposit ↔ grid finite-difference force ↔ CIC interpolation) and the
// timestep halved, the thermostat became UNNECESSARY: the ENERGY_PROBE shows total E only drifting
// ~0.1%/s (decelerating, bound, no escape runaway) instead of the blow-up the old unmatched force
// produced when unclamped. Each knob is still env-overridable for an extra margin on weak hardware
// (e.g. GAL_VEL_DAMP=0.003 GAL_MAX_ACC=260 GAL_MAX_SPEED=34), or set them up to reproduce the study.
const VEL_DAMP = envNum('VEL_DAMP', 0.0); // velocity damping; 0 = fully conservative (no drag)
const MAX_ACC = envNum('MAX_ACC', 0.0); // accel clamp; 0 = off (softening + conservative force bound accel)
const MAX_SPEED = envNum('MAX_SPEED', 0.0); // speed clamp; 0 = off (a star keeps exactly what gravity/clicks give it)
const R_MIN = 0.045; // respawn core-plungers (keeps the innermost orbit's Ω·dt below the leapfrog limit)
const R_MAX = GALAXY_RADIUS * envNum('R_MAX_MUL', 20.0); // far escape net (≈off → unbound stars leave for good); only a NaN-safe backstop

// ── Stellar Initial Mass Function (Salpeter ξ(m) ∝ m^-2.35 on [M_LO, M_HI]) ────
// Each star draws its OWN mass: most are faint dwarfs, a rare few are massive blue-white
// giants that render bigger/brighter AND pull harder (deposit more mass), so giants become
// local anchors that gather neighbours. Masses are normalised so the BATCH MEAN equals
// STAR_MASS (rotation-curve magnitude preserved). Pos.w stores the per-star sim mass.
const IMF_M_LO = 0.1; // lightest star (solar units, pre-normalisation)
const IMF_M_HI = 30.0; // heaviest star (solar units, pre-normalisation)
const IMF_SLOPE = 2.35; // Salpeter exponent

const SELFSHOT = process.env.SELFSHOT === '1';
const SELFSHOT_T = process.env.SELFSHOT_T ? Number(process.env.SELFSHOT_T) : 6.0;
const DEBUG_RAW = process.env.DEBUG_RAW === '1';
// ENERGY_PROBE=1 reads the Pos/Vel/field buffers back to the CPU every few sim-seconds and prints
// total energy (KE + BH + halo + self-gravity) so conservation can be MEASURED, not asserted. With
// no clicks, a flat E means lossless; a rising E reveals numerical heating from the particle mesh.
const ENERGY_PROBE = process.env.ENERGY_PROBE === '1';
const ENERGY_PROBE_T = process.env.ENERGY_PROBE_T ? Number(process.env.ENERGY_PROBE_T) : 60.0;
const SELFSHOT_PATH = process.env.SELFSHOT_PATH ?? 'D:/Projects/bun-win32/packages/all/screenshots/particle-galaxy.png';

// ── Window + device ───────────────────────────────────────────────────────────
const win = gpu.createWindow({ title: 'Particle Galaxy — 4,194,304-star N-body galaxy in pure TypeScript', width: WIN_W, height: WIN_H, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });
gpu3d.bindGpu3d(dev); // for the CULL_NONE rasterizer state + TRIANGLELIST star-quad draw

console.log('Particle Galaxy — four million GPU stars as a real self-gravitating N-body galaxy, in pure TypeScript.');
console.log(`  ${PARTICLE_COUNT.toLocaleString()} stars · ${clientW}x${clientH} · ${dev.driver} · ${dev.gpuName}`);
console.log(`  Real gravity: central black hole + halo + per-star self-gravity (2-D ${GRID_N}² particle-mesh Poisson), leapfrog integrated.`);
console.log('  Drag = orbit · Wheel = zoom · LEFT = BANG · RIGHT = IMPLODE · MIDDLE = VORTEX · C = COLLIDE.');
console.log('  Space = pause · [ ] = slow/fast · . = step · H = help · R = reset · ESC = exit.\n');

// ── Seed a SPINNING two-arm SPIRAL galaxy with REAL initial state ─────────────
// Each star gets a position on a thick exponential disk + small central bulge, with a STRONG
// m=2 two-arm logarithmic-spiral density (a large fraction of disk stars crowded onto two
// trailing arm ridges with clear inter-arm voids), and an INITIAL TANGENTIAL velocity equal
// to the local circular speed v_c(r)=sqrt(G·M(<r)·r/(r²+soft²)) computed from the analytic
// enclosed-mass profile of the seed, plus a small velocity dispersion. The result reads
// UNMISTAKABLY as a spinning spiral galaxy from t=0; real gravity then slowly winds the arms
// over tens of seconds (true physics). Pos.w = star mass; Vel.w = temperature (advected).
const posSeed = Buffer.alloc(PARTICLE_COUNT * 16);
const velSeed = Buffer.alloc(PARTICLE_COUNT * 16);

const DISK_SCALE = GALAXY_RADIUS * 0.4; // exponential disk scale length h
const DISK_MASS_TOTAL = PARTICLE_COUNT * STAR_MASS;
const R_HALO = GALAXY_RADIUS * envNum('R_HALO_MUL', 1.0); // halo mass grows out to here (flat v_c)
const BULGE_R = GALAXY_RADIUS * 0.16; // central bulge radius (spheroidal nucleus)
const BULGE_FRAC = envNum('BULGE_FRAC', 0.075); // fraction of stars in the bulge. SMALLER than the old 0.13 so the bright nucleus does not wash out the disk → the emergent spiral arms are the star of the frame
// Smooth analytic HALO enclosed mass (∝ r² near the centre, flattening to M_HALO) — the bulk
// of the flat rotation curve. Mirrored exactly in the integrate shader so the seed balances.
function haloEnclosed(r: number): number {
  const x = Math.min(1, r / R_HALO);
  return M_HALO * x * x * (1.5 - 0.5 * x); // smooth 0→M_HALO, gentle flattening
}
// Enclosed DISK mass for an exponential surface density Σ∝e^(−r/h): the fraction interior to
// r is 1−(1+r/h)e^(−r/h). The live radial solve measures essentially this, so seeding the
// circular speed from it puts the disk in genuine equilibrium (no ring-up, no collapse).
function diskEnclosedFrac(r: number): number {
  const x = Math.max(0, r) / DISK_SCALE;
  return 1 - (1 + x) * Math.exp(-x);
}
const DISK_FRAC_NORM = diskEnclosedFrac(GALAXY_RADIUS * 1.5); // ~total enclosed within the rim
// Analytic enclosed DISK mass (sim units) interior to r — what the live PM field measures.
function diskEnclosed(r: number): number {
  return (DISK_MASS_TOTAL * diskEnclosedFrac(r)) / DISK_FRAC_NORM;
}
// Circular speed that balances the seed against the SAME softened force law the shader uses:
// a heavy BH point mass (softened by SOFT_BH) plus the extended halo + the disk's own analytic
// mass (softened by SOFTEN). v_c² = G·[ M_BH·r/(r²+soft_bh²) + (halo+disk)·r/(r²+soft²) ].
// Seeding from this puts the disk in genuine rotational equilibrium so it neither falls into
// the black hole nor phase-mixes into a ring; the live 2-D self-gravity then takes over.
function circularSpeed(r: number): number {
  const aBH = (G_CONST * M_BH * r) / (r * r + SOFT_BH * SOFT_BH);
  const aRest = (G_CONST * (haloEnclosed(r) + diskEnclosed(r) * DISK_SEED_W) * r) / (r * r + SOFTEN * SOFTEN);
  return Math.sqrt(Math.max(0, aBH + aRest));
}

// EMERGENT structure: the disk is seeded SMOOTH and axisymmetric — NO painted arms. A faint
// broadband density perturbation (a few percent, in a random superposition of m=2..4 modes) is the
// ONLY seed; the live self-gravity then GROWS the arms by swing amplification and differential
// rotation. PERT_AMP=0 → a pure smooth/Poisson-noise seed (arms still grow, more flocculent);
// raise it for a grander-design head-start. This is what makes the galaxy read as REAL physics
// rather than a rotating painted pattern: structure is grown, winds, shears and regenerates.
const PERT_AMP = envNum('PERT_AMP', 0.45); // seed overdensity amplitude (0 = pure smooth disk). A clearly-visible but irregular m=2 log-spiral head-start that the live self-gravity then sculpts — winds, feathers, grows spurs and asymmetry — so the arms read as open and ALIVE, not painted
const ARM_R0 = GALAXY_RADIUS * 0.2; // inside this radius the perturbation fades into the bulge

// Salpeter IMF inverse-CDF: u∈[0,1) → a stellar mass on [M_LO, M_HI] with ξ(m)∝m^-slope.
const IMF_A = 1 - IMF_SLOPE; // -1.35
const IMF_LO_A = Math.pow(IMF_M_LO, IMF_A);
const IMF_HI_A = Math.pow(IMF_M_HI, IMF_A);
function imfSampleRaw(u: number): number {
  return Math.pow(IMF_LO_A + u * (IMF_HI_A - IMF_LO_A), 1 / IMF_A);
}
// Analytic mean of that distribution, so per-star masses normalise to a batch mean of
// STAR_MASS without a second pass: mean = ∫m·m^-α / ∫m^-α over [lo,hi].
const IMF_MEAN_RAW = (() => {
  const p = 1 - IMF_SLOPE; // -1.35
  const q = 2 - IMF_SLOPE; // -0.35
  const numer = (Math.pow(IMF_M_HI, q) - Math.pow(IMF_M_LO, q)) / q;
  const denom = (Math.pow(IMF_M_HI, p) - Math.pow(IMF_M_LO, p)) / p;
  return numer / denom;
})();

{
  let s = 0x1234abcd >>> 0;
  const rand = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
  const gauss = (): number => rand() + rand() + rand() + rand() - 2.0; // ~N(0,0.577)
  // Faint multi-arm seed perturbation (random phases, drawn once). A star is accepted onto azimuth
  // φ with probability ∝ (1 + PERT_AMP·Σ wₘ cos(mφ+φ0ₘ)) — a few-percent coherent overdensity that
  // gives swing amplification a grand-design head-start WITHOUT pinning stars to painted ridges.
  const ph2 = rand() * Math.PI * 2,
    ph3 = rand() * Math.PI * 2;
  const pertW2 = 1.0,
    pertW3 = 0.3; // m=2 grand-design dominant + a touch of m=3 for irregularity
  const pertMax = 1 + PERT_AMP * (pertW2 + pertW3);
  // LOG-SPIRAL seed: the perturbation peaks along a TRAILING two-arm logarithmic spiral (OPEN arms),
  // not a radial m=2 oval (which would wind straight into concentric rings). armAngle winds with
  // ln(r); the live self-gravity then grows, winds and regenerates these open arms. ARM_WIND≈cot(pitch);
  // 2.4 ≈ a 23° pitch — nicely open. This is a faint head-start (PERT_AMP contrast), not painted ridges.
  const ARM_WIND = envNum('ARM_WIND', 2.4);
  const seedPert = (phi: number, r: number): number => {
    const rN = r / GALAXY_RADIUS;
    const fade = Math.min(1, Math.max(0, (rN - ARM_R0 / GALAXY_RADIUS) / 0.12));
    const armAngle = -ARM_WIND * Math.log(Math.max(r, ARM_R0) / ARM_R0);
    return 1 + fade * PERT_AMP * (pertW2 * Math.cos(2 * (phi - armAngle) + ph2) + pertW3 * Math.cos(3 * (phi - armAngle) + ph3));
  };
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    // Radius: exponential-disk-like sampling (r ≈ −h·ln(u)) capped at the rim, plus a denser
    // central bulge population so the nucleus is bright and the disk fills the centre (no gap).
    const isBulge = rand() < BULGE_FRAC;
    let r: number;
    if (isBulge) {
      // Spheroidal bulge: r³-ish concentration toward the core.
      r = BULGE_R * Math.pow(rand(), 0.55);
    } else {
      r = -DISK_SCALE * Math.log(Math.max(1e-4, rand()));
      r = Math.min(r, GALAXY_RADIUS * 1.45);
    }
    const rNorm = r / GALAXY_RADIUS;

    // Thickness: a thin disk that flares slightly outward; the bulge is a puffy spheroid.
    const thick = isBulge ? BULGE_R * 0.55 * Math.pow(1 - Math.min(1, r / BULGE_R), 0.5) : 0.045 * GALAXY_RADIUS * (0.5 + 0.6 * Math.min(1, rNorm));
    const yy = gauss() * thick;

    // Azimuth: SMOOTH (uniform), then nudged by the faint multi-mode perturbation via rejection
    // sampling — the ONLY departure from axisymmetry. No painted arms; gravity grows them. The
    // bulge stays uniform. Up to 8 tries to land on a slightly overdense azimuth, else last draw.
    let phi = rand() * Math.PI * 2;
    if (!isBulge && PERT_AMP > 0) {
      for (let tries = 0; tries < 8; tries += 1) {
        const cand = rand() * Math.PI * 2;
        phi = cand;
        if (rand() * pertMax <= seedPert(cand, r)) break;
      }
    }
    const px = r * Math.cos(phi);
    const pz = r * Math.sin(phi);

    // Stellar populations: a SMOOTH radial colour gradient (no seeded arms). Warm-gold nucleus, a
    // bluer young mid-disk, cooler red outskirts, with scatter. The LIVE density then paints the
    // EMERGENT arms hot-blue in the vertex shader (young stars where gravity concentrates gas), so
    // colour structure follows the GROWN arms instead of being baked into the seed.
    let temp: number;
    if (isBulge) {
      temp = 0.42 + gauss() * 0.07; // warm-gold bulge
    } else {
      temp = 0.52 - 0.3 * rNorm + gauss() * 0.12; // bluer mid-disk → red outskirts, with scatter
    }
    if (!isBulge && rand() < 0.1) temp = 0.4 + rand() * 0.12; // warm-gold intermediates
    temp = Math.min(1, Math.max(0, temp));

    // Initial velocity: tangential circular speed + small dispersion. Tangential direction
    // for a counter-clockwise (viewed from +Y) disk is (-sin φ, +cos φ) in the xz-plane.
    const vc = circularSpeed(r);
    const disp = vc * VEL_DISP; // velocity dispersion (Toomre warm) → suppresses ring modes
    const tx = -Math.sin(phi);
    const tz = Math.cos(phi);
    const vx = tx * vc + gauss() * disp;
    const vz = tz * vc + gauss() * disp;
    const vyv = gauss() * disp * 0.5;

    // Per-star mass from the Salpeter IMF, normalised so the batch mean is STAR_MASS. (Mass →
    // colour/size/brightness is applied once, in the vertex shader, so it isn't double-counted.)
    const mRaw = imfSampleRaw(rand());
    const simMass = STAR_MASS * (mRaw / IMF_MEAN_RAW);

    const o = i * 16;
    posSeed.writeFloatLE(px, o + 0);
    posSeed.writeFloatLE(yy, o + 4);
    posSeed.writeFloatLE(pz, o + 8);
    posSeed.writeFloatLE(simMass, o + 12);
    velSeed.writeFloatLE(vx, o + 0);
    velSeed.writeFloatLE(vyv, o + 4);
    velSeed.writeFloatLE(vz, o + 8);
    velSeed.writeFloatLE(temp, o + 12);
  }
}

// ── State buffers ─────────────────────────────────────────────────────────────
// Pos (u0): xyz = integrated world position, w = star mass.
// Vel (u1): xyz = integrated world velocity, w = temperature (advected unchanged).
const posBuf = gpu.makeStructuredBuffer({ stride: 16, count: PARTICLE_COUNT, uav: true, srv: true, initialData: posSeed });
const velBuf = gpu.makeStructuredBuffer({ stride: 16, count: PARTICLE_COUNT, uav: true, srv: true, initialData: velSeed });
// 2-D particle-mesh buffers (GRID_N² cells each, indexed i = gy*GRID_N + gx):
//   densBuf  : fixed-point per-cell deposited mass (uint, the InterlockedAdd target).
//   srcBuf   : Poisson source for the relaxation (float), derived from the cell mass.
//   phiA/phiB: gravitational potential φ (float), ping-ponged by the Jacobi relaxation and
//              PERSISTED across frames so each frame warm-starts from the last solution.
const GRID_CELLS = GRID_N * GRID_N;
const zeroGrid = Buffer.alloc(GRID_CELLS * 4);
const densBuf = gpu.makeStructuredBuffer({ stride: 4, count: GRID_CELLS, uav: true, srv: false });
const srcBuf = gpu.makeStructuredBuffer({ stride: 4, count: GRID_CELLS, uav: true, srv: true });
const phiA = gpu.makeStructuredBuffer({ stride: 4, count: GRID_CELLS, uav: true, srv: true, initialData: zeroGrid });
const phiB = gpu.makeStructuredBuffer({ stride: 4, count: GRID_CELLS, uav: true, srv: true, initialData: zeroGrid });
// forceBuf: g = -∇φ per cell (float2), finite-differenced from φ then CIC-interpolated to each
// star — the SAME kernel as the mass deposit. This matched deposit↔force pairing is what makes
// the self-gravity momentum-conserving and self-force-free (a star does not pull on itself).
const forceBuf = gpu.makeStructuredBuffer({ stride: 8, count: GRID_CELLS, uav: true, srv: true });

// ── HDR scene + bloom mip chain ───────────────────────────────────────────────
const HDR_FMT = gpu.DXGI_FORMAT_R16G16B16A16_FLOAT;
const hdr = gpu.makeTexture({ w: clientW, h: clientH, format: HDR_FMT, rtv: true, srv: true });
const BLOOM_LEVELS = 3;
interface BloomMip {
  w: number;
  h: number;
  a: gpu.TextureResult;
  b: gpu.TextureResult;
}
const bloom: BloomMip[] = [];
{
  let bw = clientW;
  let bh = clientH;
  for (let i = 0; i < BLOOM_LEVELS; i += 1) {
    bw = Math.max(1, bw >> 1);
    bh = Math.max(1, bh >> 1);
    bloom.push({
      w: bw,
      h: bh,
      a: gpu.makeTexture({ w: bw, h: bh, format: HDR_FMT, rtv: true, srv: true }),
      b: gpu.makeTexture({ w: bw, h: bh, format: HDR_FMT, rtv: true, srv: true }),
    });
  }
}

const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });
const additiveBlend = gpu.makeAdditiveBlendState(true);

// ── Constant buffers ──────────────────────────────────────────────────────────
// Sim CB (compute), 6 × float4 = 96 bytes:
//   gParams (dt, time, spread, Mhalo),
//   gGrav   (G, Mbh, soft, selfGain),
//   gPhys   (velDamp, maxAcc, maxSpeed, Rhalo),
//   gBH     (softBh, _, _, _),
//   gAct    (mode, strength, radius, _)   mode: 0 none, 1 bang, 2 implode, 3 vortex
//   gCursor (x, y, z, active)
// Structural grid constants (GRID_N, FIELD_HALF, CELL, massScale) are baked into the HLSL.
const SIM_CB_SIZE = 112; // 7 float4 (added gBH2 for the collision intruder black hole)
const simCb = gpu.makeConstantBuffer(SIM_CB_SIZE);
const simData = Buffer.alloc(SIM_CB_SIZE);

// Render CB (VS+PS): viewProj[64] + gParams(spriteSize, aspect, time, spread)[16] +
//   gRight(camRight.xyz, eyeX)[16] + gUp(camUp.xyz, eyeY)[16] + gFwd(camFwd.xyz, eyeZ)[16] = 128 bytes.
//   (camera forward + eye world position are packed for the VS relativistic-Doppler beaming.)
const REND_CB_SIZE = 128;
const rendCb = gpu.makeConstantBuffer(REND_CB_SIZE);
const rendData = Buffer.alloc(REND_CB_SIZE);

// Post/bloom CB: float4 (texelW, texelH, param0, param1).
const POST_CB_SIZE = 16;
const postCb = gpu.makeConstantBuffer(POST_CB_SIZE);
const postData = Buffer.alloc(POST_CB_SIZE);

// ── Interstellar DUST: a screen-space extinction pass that reads the live mass-density grid as a
//    dust-column proxy and reddens + darkens the HDR scene BEFORE bloom, so dense arm dust both
//    dims the light through it AND stops blooming → it reads as dark dust LANES threading the arms. ──
const DUST_ON = envNum('DUST', 1) > 0.5;
const DUST_STRENGTH = envNum('DUST_STRENGTH', 2.3); // peak optical depth scale — bold lanes that carve the bright arm ridges into segments
const DUST_FLOOR = envNum('DUST_FLOOR', 0.05); // overdensity threshold (below = clear)
const DUST_GAMMA = envNum('DUST_GAMMA', 0.52); // column→tau shaping (lower = crisper lanes)
const DUST_REDDEN = envNum('DUST_REDDEN', 1.0); // 0 grey dimming … 1 full blue-biased reddening
const DUST_OFFSET = envNum('DUST_OFFSET', 0.55); // inward silhouette offset (cells)
const DUST_TINT = envNum('DUST_TINT', 0.5); // faint warm-brown re-emission in deep lanes
const DUST_CB_SIZE = 96;
const dustCb = gpu.makeConstantBuffer(DUST_CB_SIZE);
const dustData = Buffer.alloc(DUST_CB_SIZE);
// Scratch HDR target the dust pass writes into (can't read+write the same texture).
const hdr2 = gpu.makeTexture({ w: clientW, h: clientH, format: HDR_FMT, rtv: true, srv: true });

// ── NUCLEUS + LENSING + HII pass knobs + CB (7 float4 = 112 bytes) ──
const HII_ON = envNum('HII', 1) > 0.5;
const HII_STRENGTH = envNum('HII_STRENGTH', 0.42); // peak nebula emission — subtle (the pink should accent the arms, not coat them)
const HII_FLOOR = envNum('HII_FLOOR', 0.5); // overdensity threshold (below = no nebula) — only the densest knots glow
const HII_GAMMA = envNum('HII_GAMMA', 0.85); // overdensity→emission shaping
const CORE_INTENSITY = envNum('CORE_INTENSITY', 3.4); // brilliance of the accretion glow (HDR, blooms)
const CORE_SPAN = envNum('CORE_SPAN', 0.017); // core glow radius (fraction of screen height) — compact
const LENS_STRENGTH = envNum('LENS_STRENGTH', 0.016); // gravitational-lensing deflection scale (0 = off)
const LENS_RADIUS = envNum('LENS_RADIUS', 0.045); // lensing influence radius (UV)
const FX_CB_SIZE = 144;
const fxCb = gpu.makeConstantBuffer(FX_CB_SIZE);
const fxData = Buffer.alloc(FX_CB_SIZE);
const SN_ON = envNum('SN', 0) > 0.5; // rare supernova flashes — OFF by default (opt in with GAL_SN=1); the random flashes/shock-rings read as distracting pulses
const SN_PEAK = envNum('SN_PEAK', 5.0); // flash brilliance (HDR, blooms hard)
const SN_INTERVAL = envNum('SN_INTERVAL', 4.5); // mean sim-seconds between supernovae
// HII radial baseline (mass-per-cell at r=0) — same exponential-disk model as the arm lighting.
const HII_BASE0 = (DISK_MASS_TOTAL / (2 * Math.PI * DISK_SCALE * DISK_SCALE)) * CELL * CELL;

// ── COMMON HLSL preamble: cbuffer + radial-bin helpers shared by every compute pass ──
const SIM_HLSL = `
#define GRID_N ${GRID_N}
#define GRID_CELLS ${GRID_N * GRID_N}
#define FIELD_HALF ${FIELD_HALF.toFixed(6)}
#define CELL ${CELL.toFixed(8)}
#define CELL_INV ${(1 / CELL).toFixed(8)}
#define MASS_SCALE ${MASS_FIXED_SCALE.toFixed(1)}
cbuffer Sim : register(b0) {
  float4 gParams; // x=dt, y=time, z=spread(0..1 opening), w=Mhalo
  float4 gGrav;   // x=G, y=Mbh, z=soft, w=selfGain
  float4 gPhys;   // x=velDamp, y=maxAcc, z=maxSpeed, w=Rhalo
  float4 gBH;     // x=softBh, yzw=_
  float4 gAct;    // x=mode(0 none/1 bang/2 implode/3 vortex), y=strength, z=radius, w=_
  float4 gCursor; // xyz=cursor world pos on disk plane, w=active(0/1)
  float4 gBH2;    // xyz=intruder black-hole world pos, w=mass (0 ⇒ no collision, no force)
};
// World (x,z) → continuous cell coordinates in [0, GRID_N]: integer part = cell, frac =
// position within the cell. Cell (gx,gy) centre is world ((gx+0.5)*CELL-FIELD_HALF, ...).
float2 worldToCell(float2 wxz) {
  return (wxz + float2(FIELD_HALF, FIELD_HALF)) * CELL_INV;
}
// Clamp integer cell coords to the grid and return the flat index gy*GRID_N + gx.
int cellIndex(int gx, int gy) {
  gx = clamp(gx, 0, GRID_N - 1);
  gy = clamp(gy, 0, GRID_N - 1);
  return gy * GRID_N + gx;
}
`;

// ── CS 1: clear the GRID_N² density cells ─────────────────────────────────────
const CS_CLEARGRID_SRC = `
${SIM_HLSL}
RWStructuredBuffer<uint> Dens : register(u0);
[numthreads(16, 16, 1)]
void main(uint3 id : SV_DispatchThreadID) {
  if (id.x < (uint)GRID_N && id.y < (uint)GRID_N) Dens[id.y * GRID_N + id.x] = 0u;
}
`;

// ── CS 2: deposit each star's OWN mass onto the field (Cloud-in-Cell, atomic) ──
// Bilinear splat across the 4 grid CENTRES surrounding the star's in-plane position, so a star
// between cells contributes fractionally to each. Heavier stars (Pos.w) deposit more mass — a
// giant digs a deeper local well and gathers its neighbours.
const CS_DEPOSIT_SRC = `
${SIM_HLSL}
StructuredBuffer<float4> Pos  : register(t0); // xyz=pos, w=mass
RWStructuredBuffer<uint>  Dens : register(u0);
[numthreads(${THREADS_PER_GROUP}, 1, 1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  float4 P = Pos[i];
  float2 fc = worldToCell(float2(P.x, P.z)) - 0.5; // integer part = lower-left CENTRE cell
  int gx = (int)floor(fc.x);
  int gy = (int)floor(fc.y);
  // Drop a star whose 2×2 CIC stencil falls off the grid (a far escaper) rather than clamping its
  // mass onto a boundary cell. Far from the disk its self-gravity is negligible anyway; it keeps
  // orbiting on the analytic BH+halo.
  if (gx < 0 || gx >= GRID_N - 1 || gy < 0 || gy >= GRID_N - 1) return;
  float fx = fc.x - (float)gx;
  float fy = fc.y - (float)gy;
  float m = max(0.0, P.w) * MASS_SCALE;
  InterlockedAdd(Dens[cellIndex(gx,     gy    )], (uint)(m * (1.0 - fx) * (1.0 - fy)));
  InterlockedAdd(Dens[cellIndex(gx + 1, gy    )], (uint)(m * fx * (1.0 - fy)));
  InterlockedAdd(Dens[cellIndex(gx,     gy + 1)], (uint)(m * (1.0 - fx) * fy));
  InterlockedAdd(Dens[cellIndex(gx + 1, gy + 1)], (uint)(m * fx * fy));
}
`;

// ── CS 3: convert deposited cell mass → Poisson source for the relaxation ──────
// src = de-scaled cell mass. The absolute scale (4πG, cell area) is folded into selfGain at
// sample time, so no physical constants are needed here — only that source ∝ local mass.
const CS_SOURCE_SRC = `
${SIM_HLSL}
RWStructuredBuffer<uint>  Dens : register(u0);
RWStructuredBuffer<float> Src  : register(u1);
[numthreads(16, 16, 1)]
void main(uint3 id : SV_DispatchThreadID) {
  if (id.x >= (uint)GRID_N || id.y >= (uint)GRID_N) return;
  uint idx = id.y * GRID_N + id.x;
  Src[idx] = (float)Dens[idx] / MASS_SCALE;
}
`;

// ── CS 4: one Jacobi relaxation pass of the 2-D Poisson equation ───────────────
// ∇²φ = src, discretised on the cell grid: φ_new = 0.25·(φL+φR+φU+φD − CELL²·src). Run
// JACOBI_ITERS times per sub-step, ping-ponging PhiSrc→PhiDst and warm-started from the last
// frame's φ. High-frequency (LOCAL) structure — clumps, arm self-gravity, feathering —
// converges in a handful of passes; the smooth global field is carried analytically by the
// BH+halo, so the disk never rings up. Dirichlet φ=0 outside the grid.
const CS_JACOBI_SRC = `
${SIM_HLSL}
StructuredBuffer<float>   Src    : register(t0);
StructuredBuffer<float>   PhiSrc : register(t1);
RWStructuredBuffer<float> PhiDst : register(u0);
float phiAt(int gx, int gy) {
  if (gx < 0 || gx >= GRID_N || gy < 0 || gy >= GRID_N) return 0.0; // Dirichlet boundary
  return PhiSrc[gy * GRID_N + gx];
}
[numthreads(16, 16, 1)]
void main(uint3 id : SV_DispatchThreadID) {
  if (id.x >= (uint)GRID_N || id.y >= (uint)GRID_N) return;
  int gx = (int)id.x;
  int gy = (int)id.y;
  float lr = phiAt(gx - 1, gy) + phiAt(gx + 1, gy);
  float ud = phiAt(gx, gy - 1) + phiAt(gx, gy + 1);
  float s = Src[gy * GRID_N + gx];
  float jac = 0.25 * (lr + ud - (CELL * CELL) * s);
  // DAMPED (weighted) Jacobi, ω=0.8. Plain Jacobi leaves the checkerboard (k=π) mode that the
  // CIC point deposit injects every frame undamped (eigenvalue −1, |·|=1 → persistent grid-
  // frequency ripple in φ). Blending toward the old value gives that mode eigenvalue 1−2·0.8 =
  // −0.6 (|·|<1) so it finally decays. The fixed point is unchanged, so the solution is identical.
  float center = PhiSrc[gy * GRID_N + gx];
  PhiDst[gy * GRID_N + gx] = lerp(center, jac, 0.8);
}
`;

// ── CS 5: grid force field g = -∇φ (central difference at cell centres) ────────
// Computing the force ONCE per cell and CIC-interpolating it to each star (matched to the CIC
// deposit) makes the self-gravity momentum-conserving and free of the self-force / kernel-mismatch
// heating that an unmatched per-star gradient injected. Dirichlet φ=0 outside the grid.
const CS_FORCE_SRC = `
${SIM_HLSL}
StructuredBuffer<float>    Phi   : register(t0);
RWStructuredBuffer<float2> Force : register(u0);
float phiAt(int gx, int gy) {
  if (gx < 0 || gx >= GRID_N || gy < 0 || gy >= GRID_N) return 0.0;
  return Phi[gy * GRID_N + gx];
}
[numthreads(16, 16, 1)]
void main(uint3 id : SV_DispatchThreadID) {
  if (id.x >= (uint)GRID_N || id.y >= (uint)GRID_N) return;
  int gx = (int)id.x;
  int gy = (int)id.y;
  float gxf = -(phiAt(gx + 1, gy) - phiAt(gx - 1, gy)) * (0.5 * CELL_INV);
  float gyf = -(phiAt(gx, gy + 1) - phiAt(gx, gy - 1)) * (0.5 * CELL_INV);
  Force[gy * GRID_N + gx] = float2(gxf, gyf);
}
`;

// ── CS 6: leapfrog (kick-drift-kick) integrate under all forces ───────────────
// Symplectic leapfrog: acceleration sampled once at the current position → a half-kick, a full
// drift, then the matching half-kick. Forces: heavy softened central BLACK HOLE + extended smooth
// HALO (the FIXED rotation-curve backbone) + COLLECTIVE 2-D self-gravity a_self = -∇φ, taken from
// the precomputed grid force field and CIC-interpolated (matched to the deposit → momentum-
// conserving, no self-force) so each star genuinely feels its neighbours → arms/clumps/spurs
// self-organise + the active interaction (bang/implode/vortex).
const CS_INTEGRATE_SRC = `
${SIM_HLSL}
RWStructuredBuffer<float4> Pos   : register(u0); // xyz=pos, w=mass
RWStructuredBuffer<float4> Vel   : register(u1); // xyz=vel, w=temp
StructuredBuffer<float2>   Force : register(t0); // g = -∇φ per cell (grid force field)

float hash11(uint n) {
  n = (n ^ 61u) ^ (n >> 16u);
  n *= 9u; n = n ^ (n >> 4u); n *= 0x27d4eb2du; n = n ^ (n >> 15u);
  return float(n & 0x00ffffffu) / float(0x01000000);
}

// Smooth analytic HALO enclosed mass (∝ r² near the centre, flattening to Mhalo) — the FIXED,
// smooth backbone that anchors the disk and keeps the live self-gravity from fragmenting it.
float haloEnclosed(float r) {
  float Rh = gPhys.w;
  float x = saturate(r / Rh);
  return gParams.w * x * x * (1.5 - 0.5 * x);
}

// Read one grid force cell (Dirichlet 0 off-grid, matching the solver's boundary).
float2 forceCell(int gx, int gy) {
  if (gx < 0 || gx >= GRID_N || gy < 0 || gy >= GRID_N) return float2(0.0, 0.0);
  return Force[gy * GRID_N + gx];
}
// Self-gravity acceleration a_self = -∇φ, CIC-interpolated from the grid force field with the
// SAME bilinear weights as the mass deposit. That deposit↔interpolation symmetry is what makes the
// force conservative and self-force-free (a lone star feels no net pull from its own deposit).
float3 selfAccel(float2 wxz) {
  float2 fc = worldToCell(wxz) - 0.5;
  int gx = (int)floor(fc.x);
  int gy = (int)floor(fc.y);
  float fx = fc.x - (float)gx;
  float fy = fc.y - (float)gy;
  float2 g = forceCell(gx,     gy    ) * ((1.0 - fx) * (1.0 - fy))
           + forceCell(gx + 1, gy    ) * (fx * (1.0 - fy))
           + forceCell(gx,     gy + 1) * ((1.0 - fx) * fy)
           + forceCell(gx + 1, gy + 1) * (fx * fy);
  return float3(g.x, 0.0, g.y);
}

[numthreads(${THREADS_PER_GROUP}, 1, 1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  float4 P = Pos[i];
  float4 V = Vel[i];
  float dt = gParams.x;
  float G = gGrav.x;
  float Mbh = gGrav.y;
  float soft = gGrav.z;
  float selfGain = gGrav.w;
  float softBh = gBH.x;
  float temp = V.w;

  float3 pos = P.xyz;
  float3 vel = V.xyz;

  float3 acc = float3(0,0,0);
  float r3 = length(pos);
  float rin = length(float2(pos.x, pos.z));
  float soft2 = soft * soft;
  float rr = r3 + 1e-5;
  float3 rhat = pos / rr;

  // Central BLACK HOLE — heavy softened point mass: a = -G·Mbh·rhat/(r²+softBh²). The small
  // softening keeps the r→0 singularity from flinging a star out yet gives a fast Keplerian whirl.
  acc += -G * Mbh * rhat / (r3 * r3 + softBh * softBh);
  // COLLISION intruder: a heavy passing black hole (gBH2.w>0). Its moving softened well shears the
  // disk into real tidal TAILS and a BRIDGE. a = -G·m·d/(|d|²+softBh²)^{3/2}.
  if (gBH2.w > 0.0) {
    float3 d2v = pos - gBH2.xyz;
    float dd = dot(d2v, d2v) + softBh * softBh;
    acc += -G * gBH2.w * d2v * rsqrt(dd) / dd;
  }
  // Smooth analytic HALO backbone (extended, softened) — the flat outer rotation curve.
  acc += -G * haloEnclosed(r3) * rhat / (r3 * r3 + soft2);
  // COLLECTIVE 2-D self-gravity: every star feels -∇φ of the field all stars built this frame.
  acc += selfGain * selfAccel(float2(pos.x, pos.z));

  // A gentle restoring force toward the disk plane keeps the disk thin (vertical gravity from
  // the BH+halo backbone; the 2-D self-gravity field has no vertical component).
  {
    float backbone = Mbh + haloEnclosed(r3);
    float denom = rin * rin + soft2;
    acc.y += -pos.y * (G * backbone * 0.05 / (denom + 0.25));
  }

  // ── Active interaction (real extra gravity; BANG is a velocity impulse below) ──
  int mode = (int)(gAct.x + 0.5);
  if (gCursor.w > 0.5 && mode > 0) {
    float3 toC = gCursor.xyz - pos;
    float d2 = dot(toC, toC) + 0.04;
    float d = sqrt(d2);
    float3 dhat = toC / d;
    float radius = gAct.z;
    float strength = gAct.y;
    if (mode == 2) {
      acc += dhat * (strength / (d2 + soft2)); // IMPLODE: a moving gravity well
    } else if (mode == 3) {
      float fall = exp(-d2 / (2.0 * radius * radius));
      float3 tang = float3(toC.z, 0.0, -toC.x) / d; // VORTEX: swirl WITH the galaxy's CCW spin + mild pull
      acc += tang * (strength * 1.6 * fall);
      acc += dhat * (strength * 0.35 * fall);
    }
  }

  // OPTIONAL acceleration clamp (off when maxAcc<=0). Every force above is softened, so accel is
  // already bounded; the conservative default leaves this off so the force is exactly -∇(potential).
  float amag = length(acc);
  float maxAcc = gPhys.y;
  if (maxAcc > 0.0 && amag > maxAcc) acc *= maxAcc / amag;

  // ── Leapfrog kick-drift-kick ──
  vel += acc * (0.5 * dt);
  pos += vel * dt;
  vel += acc * (0.5 * dt);

  // ── One-shot BANG impulse: a pure VELOCITY kick (momentum, not a held force) ──
  if (mode == 1 && gCursor.w > 0.5) {
    float3 toC = pos - gCursor.xyz;
    float d2 = dot(toC, toC) + 1e-3;
    float radius = gAct.z;
    float fall = exp(-d2 / (2.0 * radius * radius));
    float d = sqrt(d2);
    float3 outw = toC / d;
    vel += outw * (gAct.y * fall); // instantaneous outward velocity → blasts then falls back
  }

  // Tiny velocity damping so momentum persists but energy doesn't accumulate forever.
  vel *= (1.0 - gPhys.x * dt);

  // OPTIONAL speed clamp (off when maxSpeed<=0). Conservative default leaves it off so a star keeps
  // EXACTLY the velocity gravity (and clicks) give it — no energy is quietly removed at the top end.
  float smag = length(vel);
  float maxSpeed = gPhys.z;
  if (maxSpeed > 0.0 && smag > maxSpeed) vel *= maxSpeed / smag;

  // ── Respawn core-plungers (integrator safety near the BH) and far escapers (recycling them on
  //    fresh circular orbits also caps runaway heating — part of the thermostat). Push R_MAX_MUL
  //    large (env) for truer escapes, at the cost of energy stability. ──
  float rinNew = length(float2(pos.x, pos.z));
  if (rinNew < ${R_MIN.toFixed(3)} || length(pos) > ${R_MAX.toFixed(3)}) {
    float h1 = hash11(i * 2u + (uint)(gParams.y * 13.0));
    float h2 = hash11(i * 7u + 101u + (uint)(gParams.y * 29.0));
    float h3 = hash11(i * 13u + 53u + (uint)(gParams.y * 51.0));
    float rs = ${(GALAXY_RADIUS * 0.45).toFixed(3)} + h1 * ${(GALAXY_RADIUS * 0.65).toFixed(3)};
    float ang = h2 * 6.2831853;
    pos = float3(rs * cos(ang), (h3 - 0.5) * 0.08 * ${GALAXY_RADIUS.toFixed(1)}, rs * sin(ang));
    // Fresh circular orbit from the analytic backbone (BH + halo); the live self-gravity adds on.
    float aBH = G * Mbh * rs / (rs * rs + softBh * softBh);
    float aRest = G * haloEnclosed(rs) * rs / (rs * rs + soft2);
    float vc = sqrt(max(0.0, aBH + aRest));
    float3 tang = float3(-sin(ang), 0.0, cos(ang));
    vel = tang * vc;
  }

  Pos[i] = float4(pos, P.w);
  Vel[i] = float4(vel, temp);
}
`;

// Arm-lighting baseline: the mean exponential-disk mass-per-cell at r=0. A star whose LIVE
// PM density exceeds the smooth radial baseline at its radius is "in an arm" → it renders as a
// young hot-blue luminous star. So colour/brightness FOLLOW the emergent grown structure.
const ARM_BASE0 = (DISK_MASS_TOTAL / (2 * Math.PI * DISK_SCALE * DISK_SCALE)) * CELL * CELL;
const ARM_GAIN = envNum('ARM_GAIN', 1.6); // how sharply overdensity → blue arm tint
const ARM_BLUE = envNum('ARM_BLUE', 0.42); // arm young-population blue shift
const ARM_GLOW = envNum('ARM_GLOW', 0.16); // extra arm brightness — lets the emergent arms compete with the bright nucleus

// ── VERTEX: expand each star into a soft additive quad (6 verts/star) ─────────
// Colour is driven by REAL dynamics AND the live emergent structure: stars in dense GROWN arms
// render young/hot-blue, fast stars hotter, the golden bulge, cool red outskirts. A per-frame
// opening 'spread' scales render positions in toward the core for the cinematic reveal.
const VS_SRC = `
#define VGRID_N ${GRID_N}
#define VCELL_INV ${(1 / CELL).toFixed(8)}
#define VFIELD_HALF ${FIELD_HALF.toFixed(6)}
cbuffer Rend : register(b0) {
  float4x4 gViewProj;
  float4 gP;     // x=spriteSize, y=aspect, z=time, w=spread(0..1 opening)
  float4 gRight; // camera right (world), xyz; w=eyeX
  float4 gUp;    // camera up (world), xyz; w=eyeY
  float4 gFwd;   // camera forward (world), xyz; w=eyeZ  (for relativistic Doppler beaming)
};
StructuredBuffer<float4> Pos  : register(t0); // xyz=pos, w=mass
StructuredBuffer<float4> Vel  : register(t1); // xyz=vel, w=temp
StructuredBuffer<float>  Dens : register(t2); // live PM density (de-scaled cell mass) → arm lighting
// CIC-sample the live density field at a star's in-plane position (same kernel as the deposit).
float vDensAt(float2 wxz) {
  float2 fc = (wxz + float2(VFIELD_HALF, VFIELD_HALF)) * VCELL_INV - 0.5;
  int gx = (int)floor(fc.x); int gy = (int)floor(fc.y);
  if (gx < 0 || gx >= VGRID_N - 1 || gy < 0 || gy >= VGRID_N - 1) return 0.0;
  float fx = fc.x - (float)gx; float fy = fc.y - (float)gy;
  float s00 = Dens[gy * VGRID_N + gx],       s10 = Dens[gy * VGRID_N + gx + 1];
  float s01 = Dens[(gy + 1) * VGRID_N + gx], s11 = Dens[(gy + 1) * VGRID_N + gx + 1];
  return lerp(lerp(s00, s10, fx), lerp(s01, s11, fx), fy);
}

struct VSOut {
  float4 pos   : SV_Position;
  float2 local : TEXCOORD0;  // [-1,1] within the sprite (for the gaussian)
  float3 tint  : TEXCOORD1;  // HDR star colour
  float  bright: TEXCOORD2;  // brightness multiplier
};

// PHYSICALLY-BASED STELLAR COLOUR (blackbody Planck locus). The 0..1 temperature param maps
// LOG-spaced to an effective temperature (~1800 K red dwarf … ~40000 K O-star). The hue along
// that locus was derived offline (param→Kelvin→Planckian chromaticity→XYZ→linear-sRGB, each
// colour normalised to its own peak channel so this is pure HUE; brightness is carried by
// o.bright) and fitted with these 6 anchors — the Sun (~5800 K) reads warm-white, cool dwarfs
// deep orange/red, hot stars blue-white. Endpoints are saturated so millions of additive sprites
// + the composite chroma-push keep colour.
// Anchors follow the real blackbody Planck-locus HUE ORDER (deep red → amber → gold → warm-white
// Sun → blue-white → blue) but at vivid HDR values (>1, like astrophotography), so the palette
// stays physically motivated yet punches through additive overlap + bloom instead of washing grey.
float3 blackbody(float t) {
  const float3 c0 = float3(1.60, 0.13, 0.01); // ~1800 K  deep red (M dwarf)
  const float3 c1 = float3(1.65, 0.46, 0.07); // ~2865 K  amber / orange
  const float3 c2 = float3(1.55, 0.82, 0.30); // ~4560 K  warm gold (K-type)
  const float3 c3 = float3(1.18, 1.02, 0.90); // ~6200 K  warm white (G/Sun) — dimmer midtone
  const float3 c4 = float3(0.74, 0.86, 1.28); // ~8480 K  white, blue cast (A-type)
  const float3 c5 = float3(0.30, 0.55, 1.95); // ~15000 K+ blue-white (B/O-type)
  float3 c = lerp(c0, c1, smoothstep(0.00, 0.15, t));
  c = lerp(c, c2, smoothstep(0.15, 0.30, t));
  c = lerp(c, c3, smoothstep(0.30, 0.42, t));
  c = lerp(c, c4, smoothstep(0.42, 0.55, t));
  c = lerp(c, c5, smoothstep(0.55, 0.85, t));
  return c;
}
float3 starColor(float temp) {
  float t = saturate(temp);
  float3 c = blackbody(t);
  // Small chroma lift so the warm-white Sun zone survives the composite chroma-push.
  float lum = dot(c, float3(0.2126, 0.7152, 0.0722));
  c = lerp(lum.xxx, c, 1.14);
  return max(c, 0.0.xxx);
}

VSOut main(uint vid : SV_VertexID) {
  uint pid = vid / 6u;
  uint corner = vid % 6u;
  float4 P = Pos[pid];
  float4 Vd = Vel[pid];
  float tempSeed = Vd.w;
  float massRel = P.w * ${(1 / STAR_MASS).toFixed(4)}; // star mass ÷ mean (≈0.3 dwarf … ≈90 giant)
  float speed = length(Vd.xyz);
  float radius = length(P.xyz);
  float rin = length(float2(P.x, P.z));

  // Live overdensity → "in an emergent arm" (∈[0,1]); faded out of the deep bulge so the arms,
  // not the nucleus, carry the blue young-star tint. THIS is what lights up the grown structure.
  float dens = vDensAt(float2(P.x, P.z));
  float baseDens = ${ARM_BASE0.toExponential(6)} * exp(-rin * ${(1 / DISK_SCALE).toFixed(6)});
  float arm = saturate((dens / (baseDens + 1e-6) - 1.0) * ${ARM_GAIN.toFixed(3)});
  arm *= smoothstep(${(GALAXY_RADIUS * 0.05).toFixed(3)}, ${(GALAXY_RADIUS * 0.18).toFixed(3)}, rin);
  // Relativistic Doppler beaming: stars sweeping TOWARD the eye brighten + blue-shift, away dim +
  // redden. Only the fast inner cluster round the black hole is fast enough to show it → the
  // nucleus reads as a spinning mass. dop>0 ⇒ approaching.
  float3 eyeW = float3(gRight.w, gUp.w, gFwd.w);
  float3 losDir = normalize(P.xyz - eyeW);
  float dop = clamp(-dot(Vd.xyz, losDir) / 8.0, -1.0, 1.0);

  VSOut o;

  float2 cs[6] = {
    float2(-1,-1), float2( 1,-1), float2(-1, 1),
    float2(-1, 1), float2( 1,-1), float2( 1, 1)
  };
  float2 c = cs[corner];

  float jitter = frac(sin(float(pid) * 91.17) * 7547.13);
  float jitter2 = frac(sin(float(pid) * 47.91) * 3271.77);
  float coreT = saturate(radius / ${GALAXY_RADIUS.toFixed(1)});
  // Heavier stars are physically larger: a giant renders several times bigger than a dwarf.
  float massSize = clamp(pow(max(massRel, 0.05), 0.30), 0.65, 3.2);
  float size = gP.x * (0.5 + 0.7 * (1.0 - coreT) + 0.5 * jitter) * massSize;

  // Opening reveal: scale the world position in toward the core for the first frames.
  float spread = gP.w;
  float3 wp = P.xyz * spread;

  // Billboard: offset along the camera right/up axes so each sprite faces the camera.
  float3 wpos = wp + (gRight.xyz * c.x + gUp.xyz * c.y) * size;
  o.pos = mul(gViewProj, float4(wpos, 1.0));
  o.local = c;

  // ── Colour from REAL dynamics ──
  // Base on the seeded temperature, then bias by where the star actually sits AND how fast
  // it moves: a golden bulge, hot blue where stars are fast / in the bright mid-disk, cool
  // red in the slow diffuse outskirts.
  float rNorm = coreT;
  float tempR = tempSeed;
  float coreBias = smoothstep(0.16, 0.0, rNorm);
  tempR = lerp(tempR, 0.44, coreBias * 0.8);          // deep core → warm gold
  tempR -= smoothstep(0.55, 1.0, rNorm) * 0.28;       // outskirts → red
  // Fast stars run hotter/bluer (real kinematic colouring).
  float speedN = saturate(speed / 14.0);
  tempR += speedN * 0.30 * smoothstep(0.10, 0.55, rNorm);
  // Massive stars burn hot blue-white (young, luminous giants).
  tempR += saturate((massRel - 2.0) / 28.0) * 0.40;
  tempR += arm * ${ARM_BLUE.toFixed(3)} + dop * 0.12; // young blue stars in the emergent arms + Doppler blue-shift
  tempR = saturate(tempR);

  float3 col = starColor(tempR);
  col += float3(0.06, 0.10, 0.22) * speedN; // hot blue flash on the fastest streams
  col += float3(0.10, 0.05, 0.16) * arm;    // faint H-alpha/young-cluster violet bias along the arms
  o.tint = col;

  // Brightness: deliberately dim per star so the galaxy's glow is built by the DENSITY of
  // millions of overlapping sprites (keeps colour in HDR range instead of clipping white).
  // Rare supergiants and the deep nucleus punch the HDR highlights that bloom.
  float supergiant = pow(jitter, 30.0) * 16.0 + pow(jitter2, 70.0) * 55.0;
  // Core glow fills the deep nucleus so it reads as a bright GOLDEN core (not a dark hole), tuned
  // COMPACT (steeper falloff, lower gain) so the centre does not over-bloom into a featureless blob —
  // the legible black-hole accretion glow (separate, screen-space) supplies the bright pinpoint core.
  float coreGlow = pow(1.0 - coreT, 3.5) * 0.30;
  float hot = smoothstep(0.72, 0.95, tempR);
  float blueBoost = hot * 1.7 + pow(jitter2, 22.0) * hot * 30.0;
  // EMERGENT ARM GLOW: dense grown arms hold the young luminous stars → they glow brighter, so the
  // spiral structure the gravity built lights up (brightest where it is also bluest/hottest).
  float armGlow = arm * ${ARM_GLOW.toFixed(3)} * (0.6 + 0.9 * hot);
  // Luminosity rises steeply with mass: rare giants are the bright anchors that punch the HDR
  // highlights (and seed the bloom), while the dwarf multitude stays dim so colour survives.
  float massLum = min(pow(max(massRel, 0.05), 0.88), 15.0);

  float base = (0.012 + 0.020 * tempR + armGlow + 0.045 * coreGlow + 0.035 * blueBoost);
  float doppler = 1.0 + 0.55 * dop; // relativistic beaming brightens the approaching inner cluster
  // Tame the over-dense nucleus so the centre is a compact bright core (the FX accretion glow), not a
  // big featureless white blob that swallows the inner arms. Dims the dense inner disk (~inner 26%),
  // ramping back to full brightness in the arm-forming disk.
  float centerDim = lerp(0.34, 1.0, smoothstep(0.02, 0.26, coreT));
  o.bright = base * (1.0 + supergiant) * (0.5 + 0.7 * massLum) * doppler * centerDim;
  return o;
}
`;

// ── PIXEL (splat): radial gaussian × star colour, additive into HDR ───────────
const PS_POINTS_SRC = `
struct VSOut {
  float4 pos   : SV_Position;
  float2 local : TEXCOORD0;
  float3 tint  : TEXCOORD1;
  float  bright: TEXCOORD2;
};
float4 main(VSOut i) : SV_Target {
  float r2 = dot(i.local, i.local);
  float halo = exp(-r2 * 2.6);
  float core = exp(-r2 * 13.0);
  float a = halo * 0.5 + core * 0.85;
  if (a < 0.0015) discard;
  float3 c = i.tint * i.bright * a;
  return float4(c, a);
}
`;

// Fullscreen-triangle VS (shared by every post pass).
const VS_FULLSCREEN_SRC = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// ── DUST EXTINCTION: reads the live PM mass-density grid as a dust column, reconstructs each
//    pixel's disk-plane point (same unproject as the cursor), and multiplies the HDR by a
//    blue-biased transmittance. Dust = OVERDENSITY above a smooth radial baseline, so lanes ride
//    the arms (and migrate as they wind) and the inter-arm voids stay clear. ──
const PS_DUST_SRC = `
#define GRID_N ${GRID_N}
#define CELL ${CELL.toFixed(8)}
#define CELL_INV ${(1 / CELL).toFixed(8)}
cbuffer Dust : register(b0) {
  float4 gEye;   // xyz=eye, w=_
  float4 gFwd;   // xyz=forward, w=tanHalfFovY
  float4 gRgt;   // xyz=camRight, w=aspect
  float4 gUp_;   // xyz=camUp, w=_
  float4 gDust;  // x=strength y=floor z=gamma w=redden
  float4 gDust2; // x=offset y=tint z=fieldHalf w=baselineScale
};
Texture2D               Hdr : register(t0);
StructuredBuffer<float> Src : register(t1);
SamplerState            Smp : register(s0);
float densityAt(float2 wxz) {
  float2 fc = (wxz + gDust2.z) * CELL_INV - 0.5;
  int gx = (int)floor(fc.x);
  int gy = (int)floor(fc.y);
  if (gx < 0 || gx >= GRID_N - 1 || gy < 0 || gy >= GRID_N - 1) return 0.0;
  float fx = fc.x - (float)gx;
  float fy = fc.y - (float)gy;
  float s00 = Src[(gy    ) * GRID_N + (gx    )];
  float s10 = Src[(gy    ) * GRID_N + (gx + 1)];
  float s01 = Src[(gy + 1) * GRID_N + (gx    )];
  float s11 = Src[(gy + 1) * GRID_N + (gx + 1)];
  return lerp(lerp(s00, s10, fx), lerp(s01, s11, fx), fy);
}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 scene = Hdr.SampleLevel(Smp, uv, 0).rgb;
  if (gDust.x <= 0.0) return float4(scene, 1.0);
  float2 ndc = uv * float2(2.0, -2.0) + float2(-1.0, 1.0);
  float3 rd = gFwd.xyz + gRgt.xyz * (ndc.x * gRgt.w * gFwd.w) + gUp_.xyz * (ndc.y * gFwd.w);
  rd = normalize(rd);
  if (rd.y > -1e-4) return float4(scene, 1.0);       // ray over the horizon → no disk dust
  float tHit = min(-gEye.y / rd.y, 1.0e4);
  float2 wxz = gEye.xz + tHit * rd.xz;
  float r = length(wxz);
  float baseline = gDust2.w * exp(-r * ${(1 / (GALAXY_RADIUS * 0.42)).toFixed(5)});
  float2 inward = (r > 1e-3) ? (wxz / r) : float2(0.0, 0.0);
  float dHere = densityAt(wxz);
  float dIn   = densityAt(wxz - inward * (gDust2.x * CELL)); // inner-edge silhouette sample
  float col   = max(dHere, dIn * 1.06);
  float over  = max(0.0, col - baseline - gDust.y);
  float tau = gDust.x * pow(over * ${(1 / ((DISK_MASS_TOTAL / (GRID_N * GRID_N)) * 18.0)).toFixed(6)}, gDust.z);
  tau = min(tau, 6.0);
  float3 extCurve = lerp(float3(1.18, 1.18, 1.18), float3(1.45, 1.18, 1.00), gDust.w); // blue extinguished most
  float3 trans = exp(-tau * extCurve);
  float3 outc = scene * trans;
  float absorbed = 1.0 - dot(trans, float3(0.333, 0.333, 0.333));
  outc += float3(0.018, 0.008, 0.003) * (absorbed * gDust2.y); // faint warm dust re-emission
  return float4(outc, 1.0);
}
`;

// ── NUCLEUS + LENSING + HII: one screen-space pass that makes the centre LEGIBLE and lights the
//    arms with star-forming nebulae. (1) A subtle GRAVITATIONAL-LENSING warp + faint Einstein ring
//    around the projected black hole bends the light near the mass. (2) A brilliant compact warm
//    ACCRETION GLOW marks the nucleus everything orbits. (3) HII EMISSION: unproject each pixel to
//    the disk and, where the LIVE density overshoots its radial baseline (the dense arm ridges), add
//    glowing H-alpha pink + OIII cyan nebulosity — so the stellar nurseries appear exactly where
//    gravity concentrated matter. Runs in HDR before bloom, so the core + nebulae bloom. ──
const PS_FX_SRC = `
#define FGRID_N ${GRID_N}
#define FCELL_INV ${(1 / CELL).toFixed(8)}
cbuffer Fx : register(b0) {
  float4 gEye;   // xyz=eye, w=time
  float4 gFwd;   // xyz=camForward, w=tanHalfFovY
  float4 gRgt;   // xyz=camRight, w=aspect
  float4 gUp_;   // xyz=camUp, w=fieldHalf
  float4 gCore;  // x=coreU, y=coreV, z=coreSpanUV, w=coreIntensity
  float4 gLens;  // x=lensStrength, y=lensRadiusUV, z=hiiStrength, w=hiiFloor
  float4 gHii;   // x=hiiGamma, y=hiiBaseline0, z=hiiInvH, w=_
  float4 gComp;  // x=compU, y=compV, z=compSpanUV, w=compIntensity (companion nucleus; 0 = none)
  float4 gSN;    // x=snU, y=snV, z=snSpanUV(expanding), w=snIntensity (supernova flash; 0 = none)
};
Texture2D               Scene : register(t0);
StructuredBuffer<float> Src   : register(t1);
SamplerState            Smp   : register(s0);
float fDensAt(float2 wxz) {
  float2 fc = (wxz + gUp_.w) * FCELL_INV - 0.5;
  int gx = (int)floor(fc.x); int gy = (int)floor(fc.y);
  if (gx < 0 || gx >= FGRID_N - 1 || gy < 0 || gy >= FGRID_N - 1) return 0.0;
  float fx = fc.x - (float)gx; float fy = fc.y - (float)gy;
  float s00 = Src[gy * FGRID_N + gx],       s10 = Src[gy * FGRID_N + gx + 1];
  float s01 = Src[(gy + 1) * FGRID_N + gx], s11 = Src[(gy + 1) * FGRID_N + gx + 1];
  return lerp(lerp(s00, s10, fx), lerp(s01, s11, fx), fy);
}
float fHash(float2 p) { return frac(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453); }
// Smooth (bilinear, smoothstep-faded) value noise → blobby nebulae with NO blocky grid artifacts.
float vnoise(float2 p) {
  float2 i = floor(p); float2 f = frac(p); f = f * f * (3.0 - 2.0 * f);
  float a = fHash(i), b = fHash(i + float2(1, 0)), c = fHash(i + float2(0, 1)), d = fHash(i + float2(1, 1));
  return lerp(lerp(a, b, f.x), lerp(c, d, f.x), f.y);
}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float aspect = gRgt.w;
  // (1) Gravitational lensing: pull the sampled UV toward the core near the mass (light bends in).
  float2 d = (uv - gCore.xy) * float2(aspect, 1.0);
  float r = length(d);
  float2 dir = r > 1e-5 ? d / r : float2(0.0, 0.0);
  float defl = gLens.x * (gLens.y * gLens.y) / (r * r + gLens.y * gLens.y);
  float2 warpUv = uv - dir * float2(defl / aspect, defl);
  float3 scene = Scene.SampleLevel(Smp, warpUv, 0).rgb;

  // (2) HII star-forming regions from the live density field (unproject to the disk plane y=0).
  float2 ndc = uv * float2(2.0, -2.0) + float2(-1.0, 1.0);
  float3 rd = normalize(gFwd.xyz + gRgt.xyz * (ndc.x * aspect * gFwd.w) + gUp_.xyz * (ndc.y * gFwd.w));
  if (gLens.z > 0.0 && rd.y < -0.06) {   // steep enough below the horizon to avoid far-distance aliasing (grid blocks)
    float tHit = -gEye.y / rd.y;
    float2 wxz = gEye.xz + tHit * rd.xz;
    float rr = length(wxz);
    if (rr < ${(FIELD_HALF * 0.9).toFixed(3)}) {
      float dens = fDensAt(wxz);
      float base = gHii.y * exp(-rr * gHii.z);
      float over = max(0.0, dens / (base + 1e-6) - 1.0 - gLens.w);
      float hii = pow(saturate(over * 0.55), gHii.x);
      // SMOOTH blobby variation (2 octaves of value noise) → discrete nebulae, never grid blocks. Drifts slowly.
      float n = vnoise(wxz * 1.6 + gEye.w * 0.05) * 0.62 + vnoise(wxz * 4.3 + 11.0) * 0.38;
      hii *= smoothstep(0.30, 0.85, n);
      hii *= smoothstep(0.0, 1.2, rr);                                              // none in the deep bulge
      hii *= smoothstep(0.0, ${(HII_BASE0 * 0.02).toExponential(6)}, dens);         // ABSOLUTE floor → no glow in sparse tidal tails
      hii *= smoothstep(${(FIELD_HALF * 0.9).toFixed(3)}, ${(FIELD_HALF * 0.5).toFixed(3)}, rr); // fade out toward the field edge
      float3 hcol = float3(1.55, 0.30, 0.85) * hii          // H-alpha pink/magenta
                  + float3(0.22, 0.72, 0.95) * pow(hii, 1.7) * 0.6; // OIII cyan in the bright knots
      scene += hcol * gLens.z;
    }
  }

  // (3) Galactic nucleus — a PREMIUM look, not a glow sprite: an intense sharp core with a realistic
  //     two-scale exponential falloff (real bulge light has power-law wings, not a soft gaussian disc),
  //     faint THIN diffraction spikes (the telescope/astrophoto signature of a bright point source),
  //     and a hot-white core grading to warm-gold wings. No soft halo blob, no cheap photon ring.
  if (gCore.w > 0.0) {
    float cr = r / max(gCore.z, 1e-4);
    float nucleus = exp(-cr * cr * 6.0);                            // intense unresolved core
    float wings   = exp(-cr * 1.8) * 0.38 + exp(-cr * 0.65) * 0.09; // two-scale realistic glow wings
    float ang = atan2(d.y, d.x);
    float sp = pow(abs(cos(ang)), 90.0) + pow(abs(sin(ang)), 90.0); // 4-point diffraction spikes
    float spike = sp * exp(-cr * 0.85) * 0.12;                      // thin, faint, fading with radius
    float3 hot  = float3(1.30, 1.21, 1.08);                         // white-hot nucleus
    float3 gold = float3(1.34, 0.88, 0.46);                         // warm-gold old-star wings
    float3 col  = lerp(gold, hot, saturate(nucleus * 1.6));
    scene += col * (gCore.w * (nucleus + wings)) + float3(1.05, 1.0, 0.92) * (gCore.w * spike);
  }
  // (4) Companion / intruder nucleus (galaxy COLLISION): a second bright cored glow you can SEE, with
  //     a bluish dwarf cast. Its gravity (in the integrate pass) shears the host into tidal tails +
  //     a bridge toward it — so the encounter reads as two galaxies colliding, not an invisible tug.
  if (gComp.w > 0.0) {
    float2 dc = (uv - gComp.xy) * float2(aspect, 1.0);
    float rc = length(dc);
    float cs = rc / max(gComp.z, 1e-4);
    float cglow = exp(-cs * cs * 1.9) + exp(-cs * cs * 0.22) * 0.32;
    scene += float3(0.90, 0.98, 1.20) * (gComp.w * cglow);
  }
  // (5) Supernova flash: a brilliant blue-white point with an expanding faint shock RING, blooming
  //     then fading — a transient that ties the visuals to the live stellar population.
  if (gSN.w > 0.0) {
    float2 ds = (uv - gSN.xy) * float2(aspect, 1.0);
    float rs = length(ds);
    float core = exp(-(rs * rs) / (gSN.z * gSN.z * 0.10));               // brilliant point
    float shock = exp(-pow((rs - gSN.z) / (gSN.z * 0.22), 2.0)) * 0.30;  // expanding shell ring
    scene += float3(0.85, 0.95, 1.25) * (gSN.w * (core + shock));
  }
  return float4(scene, 1.0);
}
`;

// ── BRIGHT PASS: extract luminous regions (bloom source), with soft knee ──────
const PS_BRIGHT_SRC = `
cbuffer Post : register(b0) { float4 gP; }; // x=texelW y=texelH z=threshold w=_
Texture2D Src : register(t0);
SamplerState Smp : register(s0);
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 c = Src.SampleLevel(Smp, uv, 0).rgb;
  float l = max(c.r, max(c.g, c.b));
  float knee = 0.5;
  float soft = smoothstep(gP.z - knee, gP.z + knee, l);
  return float4(c * soft, 1.0);
}
`;

// ── DOWNSAMPLE: 13-tap box-tent downsample (stable, wide) ─────────────────────
const PS_DOWN_SRC = `
cbuffer Post : register(b0) { float4 gP; }; // xy = SOURCE texel size
Texture2D Src : register(t0);
SamplerState Smp : register(s0);
float3 S(float2 uv) { return Src.SampleLevel(Smp, uv, 0).rgb; }
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 t = gP.xy;
  float3 c = S(uv) * 4.0;
  c += S(uv + float2(-t.x, -t.y));
  c += S(uv + float2( t.x, -t.y));
  c += S(uv + float2(-t.x,  t.y));
  c += S(uv + float2( t.x,  t.y));
  c += (S(uv + float2(-2.0*t.x, 0)) + S(uv + float2(2.0*t.x, 0)) +
        S(uv + float2(0, -2.0*t.y)) + S(uv + float2(0, 2.0*t.y))) * 0.5;
  return float4(c / 12.0, 1.0);
}
`;

// ── SEPARABLE GAUSSIAN BLUR: direction in gP.zw, source texel in gP.xy ────────
const PS_BLUR_SRC = `
cbuffer Post : register(b0) { float4 gP; }; // xy = texel size, zw = blur direction (1,0)/(0,1)
Texture2D Src : register(t0);
SamplerState Smp : register(s0);
float3 S(float2 uv) { return Src.SampleLevel(Smp, uv, 0).rgb; }
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 dir = gP.zw * gP.xy;
  float w0 = 0.227027, w1 = 0.316216, w2 = 0.070270, w3 = 0.008094;
  float o1 = 1.384615, o2 = 3.230769, o3 = 5.0;
  float3 c = S(uv) * w0;
  c += S(uv + dir * o1) * w1; c += S(uv - dir * o1) * w1;
  c += S(uv + dir * o2) * w2; c += S(uv - dir * o2) * w2;
  c += S(uv + dir * o3) * w3; c += S(uv - dir * o3) * w3;
  return float4(c, 1.0);
}
`;

// ── COMPOSITE: HDR scene + the three bloom mips → ACES filmic → vignette → gamma ──
const PS_COMPOSITE_SRC = `
cbuffer Post : register(b0) { float4 gP; }; // x=exposure y=bloomStrength z=time w=aspect
Texture2D Hdr   : register(t0);
Texture2D Blo0  : register(t1);
Texture2D Blo1  : register(t2);
Texture2D Blo2  : register(t3);
SamplerState Smp : register(s0);

float3 aces(float3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}
float3 hash3(float2 p) {
  float3 q = float3(dot(p, float2(127.1, 311.7)), dot(p, float2(269.5, 183.3)), dot(p, float2(419.2, 371.9)));
  return frac(sin(q) * 43758.5453);
}
float fhash(float2 p) { return frac(sin(dot(p, float2(127.1, 311.7))) * 43758.5453); }
// One octave of a procedural distant starfield (screen-space ≈ infinity): one twinkling, faintly
// coloured star per cell above the threshold. Cheap, no loops (FXC-safe).
float3 bgStar(float2 p, float scale, float thr, float tightness, float time) {
  float2 g = p * scale; float2 id = floor(g); float2 f = frac(g);
  float h = fhash(id + scale);
  float on = step(thr, h);
  float2 c = float2(fhash(id + 1.3), fhash(id + 2.7));
  float d = length(f - c);
  float s = exp(-d * d * tightness) * on * (h - thr) / (1.0 - thr);
  float tw = 0.6 + 0.4 * sin(time * 1.7 + h * 53.0);
  float3 sc = lerp(float3(0.72, 0.80, 1.0), float3(1.0, 0.84, 0.64), fhash(id + 5.1));
  return s * tw * sc;
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 scene = Hdr.SampleLevel(Smp, uv, 0).rgb;
  float3 b0 = Blo0.SampleLevel(Smp, uv, 0).rgb;
  float3 b1 = Blo1.SampleLevel(Smp, uv, 0).rgb;
  float3 b2 = Blo2.SampleLevel(Smp, uv, 0).rgb;
  float3 blo = b0 * 1.0 + b1 * 0.85 + b2 * 0.65;

  float3 col = scene + blo * gP.y;
  col *= gP.x; // exposure

  // ── Deep-space background: a subtle blue→violet gradient + a procedural distant starfield, shown
  //    only where the galaxy is faint (bgMask) so it never washes over the disk. Adds depth + scale. ──
  float aspect = gP.w;
  float2 cc = uv - 0.5;
  float3 grad = lerp(float3(0.010, 0.013, 0.026), float3(0.0008, 0.0014, 0.0050), saturate(length(cc) * 1.5));
  float2 sp = float2(uv.x * aspect, uv.y);
  float3 stars = bgStar(sp, 250.0, 0.985, 230.0, gP.z) * 0.6
               + bgStar(sp, 140.0, 0.991, 110.0, gP.z) * 1.0;
  float sceneL = max(col.r, max(col.g, col.b));
  float bgMask = saturate(1.0 - sceneL * 6.0);
  col += (grad + stars) * bgMask;

  float lum = dot(col, float3(0.299, 0.587, 0.114));
  col += float3(0.05, 0.025, 0.0) * smoothstep(0.8, 3.0, lum); // golden nucleus warmth

  col = aces(col);

  // Recover the chroma the filmic curve crushes so the kinematic palette stays vivid.
  float g = dot(col, float3(0.299, 0.587, 0.114));
  col = lerp(g.xxx, col, 1.55);
  col = max(col, 0.0.xxx);

  float2 q = uv - 0.5;
  float vig = 1.0 - dot(q, q) * 1.15;
  col *= clamp(vig, 0.25, 1.0);

  col = pow(saturate(col), (1.0 / 2.2).xxx);
  float dither = (hash3(uv * float2(1920.0, 1080.0) + gP.z).x - 0.5) / 255.0;
  col += dither;
  return float4(col, 1.0);
}
`;

// ── RAW debug PS: show HDR scaled (diagnostic only) ───────────────────────────
const PS_RAW_SRC = `
cbuffer Post : register(b0) { float4 gP; };
Texture2D Hdr : register(t0);
SamplerState Smp : register(s0);
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 c = Hdr.SampleLevel(Smp, uv, 0).rgb;
  c = c / (c + 1.0.xxx);
  return float4(pow(saturate(c), (1.0/2.2).xxx), 1.0);
}
`;

// ── Compile + create shaders ──────────────────────────────────────────────────
const csClearGridCode = gpu.compile(CS_CLEARGRID_SRC, 'main', 'cs_5_0');
const csDepositCode = gpu.compile(CS_DEPOSIT_SRC, 'main', 'cs_5_0');
const csSourceCode = gpu.compile(CS_SOURCE_SRC, 'main', 'cs_5_0');
const csJacobiCode = gpu.compile(CS_JACOBI_SRC, 'main', 'cs_5_0');
const csForceCode = gpu.compile(CS_FORCE_SRC, 'main', 'cs_5_0');
const csIntegrateCode = gpu.compile(CS_INTEGRATE_SRC, 'main', 'cs_5_0');
const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
const psPointsCode = gpu.compile(PS_POINTS_SRC, 'main', 'ps_5_0');
const vsFsCode = gpu.compile(VS_FULLSCREEN_SRC, 'main', 'vs_5_0');
const psDustCode = gpu.compile(PS_DUST_SRC, 'main', 'ps_5_0');
const psFxCode = gpu.compile(PS_FX_SRC, 'main', 'ps_5_0');
const psBrightCode = gpu.compile(PS_BRIGHT_SRC, 'main', 'ps_5_0');
const psDownCode = gpu.compile(PS_DOWN_SRC, 'main', 'ps_5_0');
const psBlurCode = gpu.compile(PS_BLUR_SRC, 'main', 'ps_5_0');
const psCompositeCode = gpu.compile(PS_COMPOSITE_SRC, 'main', 'ps_5_0');
const psRawCode = gpu.compile(PS_RAW_SRC, 'main', 'ps_5_0');

const csClearGrid = gpu.makeComputeShader(csClearGridCode);
const csDeposit = gpu.makeComputeShader(csDepositCode);
const csSource = gpu.makeComputeShader(csSourceCode);
const csJacobi = gpu.makeComputeShader(csJacobiCode);
const csForce = gpu.makeComputeShader(csForceCode);
const csIntegrate = gpu.makeComputeShader(csIntegrateCode);
const vsPoints = gpu.makeVertexShader(vsCode);
const psPoints = gpu.makePixelShader(psPointsCode);
const vsFs = gpu.makeVertexShader(vsFsCode);
const psDust = gpu.makePixelShader(psDustCode);
const psFx = gpu.makePixelShader(psFxCode);
const psBright = gpu.makePixelShader(psBrightCode);
const psDown = gpu.makePixelShader(psDownCode);
const psBlur = gpu.makePixelShader(psBlurCode);
const psComposite = gpu.makePixelShader(psCompositeCode);
const psRaw = gpu.makePixelShader(psRawCode);

// ── Camera matrices ───────────────────────────────────────────────────────────
function mul4(a: number[], b: number[]): number[] {
  const r = new Array<number>(16).fill(0);
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) sum += a[i * 4 + k]! * b[k * 4 + j]!;
      r[i * 4 + j] = sum;
    }
  }
  return r;
}

// Left-handed look-at (D3D). Returns ROW-MAJOR (transposed on upload) plus the camera
// right/up/forward/eye so the VS can billboard and so the cursor ray can be unprojected.
function lookAt(eye: [number, number, number], center: [number, number, number], up: [number, number, number]): { m: number[]; right: [number, number, number]; up: [number, number, number]; forward: [number, number, number] } {
  let zx = center[0] - eye[0];
  let zy = center[1] - eye[1];
  let zz = center[2] - eye[2];
  const zl = Math.hypot(zx, zy, zz);
  zx /= zl;
  zy /= zl;
  zz /= zl;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  const xl = Math.hypot(xx, xy, xz);
  xx /= xl;
  xy /= xl;
  xz /= xl;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  return {
    m: [xx, xy, xz, -(xx * eye[0] + xy * eye[1] + xz * eye[2]), yx, yy, yz, -(yx * eye[0] + yy * eye[1] + yz * eye[2]), zx, zy, zz, -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 0, 0, 0, 1],
    right: [xx, xy, xz],
    up: [yx, yy, yz],
    forward: [zx, zy, zz],
  };
}

function perspective(fovY: number, aspect: number, near: number, far: number): number[] {
  const ff = 1 / Math.tan(fovY / 2);
  const range = far / (far - near);
  return [ff / aspect, 0, 0, 0, 0, ff, 0, 0, 0, 0, range, -near * range, 0, 0, 1, 0];
}

// ── GDI HUD ───────────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-19, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;
const particleLabel = PARTICLE_COUNT.toLocaleString();

function drawHud(fps: number, timeScale: number, isPaused: boolean, helpOpen: boolean): void {
  hud.draw(dev, clientW, clientH, (dc) => {
    const prevFont = GDI32.SelectObject(dc, hudFont);
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    // One-line live status: fps + time-scale/pause + cheap virial + mean speed + key hints.
    const tsLabel = isPaused ? 'PAUSED' : `${timeScale}x`;
    const stats = statVirial > 0 ? ` · 2KE/|PE| ${statVirial.toFixed(2)} · v ${statMeanSpeed.toFixed(1)}` : '';
    const line = `${particleLabel} stars · ${fps} fps · ${tsLabel}${stats} · drag orbit · wheel zoom · LEFT bang · C collide · H help`;
    const text = encodeWide(line);
    GDI32.SetTextColor(dc, 0x00100804); // shadow (BGR)
    GDI32.TextOutW(dc, 19, 19, text.ptr!, line.length);
    GDI32.SetTextColor(dc, isPaused ? 0x0080d0ff : 0x00f0d8b0); // amber when paused, else warm white
    GDI32.TextOutW(dc, 18, 18, text.ptr!, line.length);

    // Help overlay panel (toggled with H / ?): a dark scrim + a column of every control.
    if (helpOpen) {
      const x0 = 18,
        y0 = 56,
        lineH = 26;
      const rc = Buffer.alloc(16);
      rc.writeInt32LE(x0 - 8, 0);
      rc.writeInt32LE(y0 - 8, 4);
      rc.writeInt32LE(x0 + 360, 8);
      rc.writeInt32LE(y0 + helpLines.length * lineH + 4, 12);
      User32.FillRect(dc, rc.ptr!, helpBrush);
      for (let i = 0; i < helpLines.length; i += 1) {
        const s = helpLines[i]!;
        if (s === '') continue;
        const w = encodeWide(s);
        const yy = y0 + i * lineH;
        GDI32.SetTextColor(dc, 0x00100804);
        GDI32.TextOutW(dc, x0 + 1, yy + 1, w.ptr!, s.length);
        GDI32.SetTextColor(dc, i === 0 ? 0x0090e0ff : 0x00e8e0d0);
        GDI32.TextOutW(dc, x0, yy, w.ptr!, s.length);
      }
    }
    GDI32.SelectObject(dc, prevFont);
  });
}

// ── Loop state ────────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frames = 0;
let fps = 0;
let fpsWindowStart = startTime;
let dispatched = false;
let presented = 0;
let shotTaken = false;

// Integrated SIM time, advanced by a fixed physics step per frame. In SELFSHOT mode we
// advance several sub-steps per frame so a requested capture time (e.g. SELFSHOT_T=60s of
// SIM time) is reached quickly without waiting 60 wall-clock seconds — the physics is the
// same fixed-dt leapfrog either way.
let simTime = 0;
// Substep count is derived from a target sim-time per frame, so halving DT keeps the on-screen
// evolution rate (and capture speed) the same — it just integrates more accurately.
const SUBSTEPS = Math.max(1, Math.round((SELFSHOT || ENERGY_PROBE ? 0.084 : 0.013) / DT_FIXED));

// ── Energy diagnostic (ENERGY_PROBE) ──────────────────────────────────────────
// Closed-form softened-BH potential Φ_BH(r) (its gradient is exactly the BH force used in the
// shader: -G·Mbh·r̂/(r²+soft²)), and a numerically-integrated halo potential Φ_halo(r) = -∫_r^∞ g.
function phiBH(r: number): number {
  return ((G_CONST * M_BH) / SOFT_BH) * (Math.atan(r / SOFT_BH) - Math.PI / 2);
}
const PHI_TBL_DR = 0.05;
const PHI_TBL_RMAX = 400;
const PHI_TBL_N = Math.ceil(PHI_TBL_RMAX / PHI_TBL_DR) + 2;
const phiHaloTbl = new Float64Array(PHI_TBL_N);
for (let k = PHI_TBL_N - 2; k >= 0; k -= 1) {
  const r = k * PHI_TBL_DR;
  const g = (G_CONST * haloEnclosed(r)) / (r * r + SOFTEN * SOFTEN);
  phiHaloTbl[k] = phiHaloTbl[k + 1] - g * PHI_TBL_DR; // integrate Φ down from Φ(∞)=0
}
function phiHalo(r: number): number {
  if (r >= PHI_TBL_RMAX) return 0;
  const f = r / PHI_TBL_DR;
  const i = Math.floor(f);
  const t = f - i;
  return phiHaloTbl[i]! * (1 - t) + phiHaloTbl[i + 1]! * t;
}
let nextProbeT = 2.0;
function energyProbe(): void {
  const pos = new Float32Array(gpu.readbackBuffer(posBuf.buffer, PARTICLE_COUNT * 16));
  const vel = new Float32Array(gpu.readbackBuffer(velBuf.buffer, PARTICLE_COUNT * 16));
  let KE = 0,
    PE_BH = 0,
    PE_halo = 0,
    escaped = 0;
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const o = i * 4;
    const px = pos[o]!,
      py = pos[o + 1]!,
      pz = pos[o + 2]!,
      mm = pos[o + 3]!;
    const vx = vel[o]!,
      vy = vel[o + 1]!,
      vz = vel[o + 2]!;
    const r3 = Math.hypot(px, py, pz);
    KE += 0.5 * mm * (vx * vx + vy * vy + vz * vz);
    PE_BH += mm * phiBH(r3);
    PE_halo += mm * phiHalo(r3);
    if (Math.hypot(px, pz) > FIELD_HALF) escaped += 1;
  }
  // Self-gravity PE from the grid: ½·selfGain·Σ_cells (cellMass · φ). src = de-scaled cell mass.
  const src = new Float32Array(gpu.readbackBuffer(srcBuf.buffer, GRID_CELLS * 4));
  const phi = new Float32Array(gpu.readbackBuffer(phiRead.buffer, GRID_CELLS * 4));
  let sp = 0;
  for (let c = 0; c < GRID_CELLS; c += 1) sp += src[c]! * phi[c]!;
  const PE_self = 0.5 * SELF_G_GAIN * sp;
  const E = KE + PE_BH + PE_halo + PE_self;
  console.log(
    `ENERGY t=${simTime.toFixed(1)}s  KE=${KE.toFixed(1)}  PE_BH=${PE_BH.toFixed(1)}  PE_halo=${PE_halo.toFixed(1)}  PE_self=${PE_self.toFixed(1)}  E=${E.toFixed(2)}  2KE/|PE|=${((2 * KE) / Math.abs(PE_BH + PE_halo + PE_self)).toFixed(3)}  escaped=${((100 * escaped) / PARTICLE_COUNT).toFixed(2)}%`,
  );
}

// One-shot BANG edge-trigger state (fire on the LEFT-button press transition only).
let prevLeft = false;

const aspect = clientW / clientH;
const proj = perspective((52 * Math.PI) / 180, aspect, 0.1, 120);

let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    try {
      gpu.setBlendState(0n);
      gpu3d.releaseGpu3d();
      hud.release();
      GDI32.DeleteObject(hudFont);
      GDI32.DeleteObject(helpBrush);
      gpu.comRelease(additiveBlend);
      gpu.comRelease(sampler);
      for (const m of bloom) {
        gpu.comRelease(m.a.srv ?? 0n);
        gpu.comRelease(m.a.rtv ?? 0n);
        gpu.comRelease(m.a.tex);
        gpu.comRelease(m.b.srv ?? 0n);
        gpu.comRelease(m.b.rtv ?? 0n);
        gpu.comRelease(m.b.tex);
      }
      gpu.comRelease(hdr.srv ?? 0n);
      gpu.comRelease(hdr.rtv ?? 0n);
      gpu.comRelease(hdr.tex);
      gpu.comRelease(hdr2.srv ?? 0n);
      gpu.comRelease(hdr2.rtv ?? 0n);
      gpu.comRelease(hdr2.tex);
      gpu.comRelease(dustCb);
      gpu.comRelease(fxCb);
      gpu.comRelease(psFx);
      gpu.blobRelease(psFxCode.blob);
      gpu.comRelease(psDust);
      gpu.blobRelease(psDustCode.blob);
      gpu.comRelease(psRaw);
      gpu.comRelease(psComposite);
      gpu.comRelease(psBlur);
      gpu.comRelease(psDown);
      gpu.comRelease(psBright);
      gpu.comRelease(vsFs);
      gpu.comRelease(psPoints);
      gpu.comRelease(vsPoints);
      gpu.comRelease(csIntegrate);
      gpu.comRelease(csForce);
      gpu.comRelease(csJacobi);
      gpu.comRelease(csSource);
      gpu.comRelease(csDeposit);
      gpu.comRelease(csClearGrid);
      gpu.blobRelease(psRawCode.blob);
      gpu.blobRelease(psCompositeCode.blob);
      gpu.blobRelease(psBlurCode.blob);
      gpu.blobRelease(psDownCode.blob);
      gpu.blobRelease(psBrightCode.blob);
      gpu.blobRelease(vsFsCode.blob);
      gpu.blobRelease(psPointsCode.blob);
      gpu.blobRelease(vsCode.blob);
      gpu.blobRelease(csIntegrateCode.blob);
      gpu.blobRelease(csForceCode.blob);
      gpu.blobRelease(csJacobiCode.blob);
      gpu.blobRelease(csSourceCode.blob);
      gpu.blobRelease(csDepositCode.blob);
      gpu.blobRelease(csClearGridCode.blob);
      gpu.comRelease(postCb);
      gpu.comRelease(rendCb);
      gpu.comRelease(simCb);
      gpu.comRelease(posBuf.srv ?? 0n);
      gpu.comRelease(posBuf.uav ?? 0n);
      gpu.comRelease(posBuf.buffer);
      gpu.comRelease(velBuf.srv ?? 0n);
      gpu.comRelease(velBuf.uav ?? 0n);
      gpu.comRelease(velBuf.buffer);
      gpu.comRelease(densBuf.uav ?? 0n);
      gpu.comRelease(densBuf.buffer);
      gpu.comRelease(srcBuf.srv ?? 0n);
      gpu.comRelease(srcBuf.uav ?? 0n);
      gpu.comRelease(srcBuf.buffer);
      gpu.comRelease(phiA.srv ?? 0n);
      gpu.comRelease(phiA.uav ?? 0n);
      gpu.comRelease(phiA.buffer);
      gpu.comRelease(phiB.srv ?? 0n);
      gpu.comRelease(phiB.uav ?? 0n);
      gpu.comRelease(phiB.buffer);
      gpu.comRelease(forceBuf.srv ?? 0n);
      gpu.comRelease(forceBuf.uav ?? 0n);
      gpu.comRelease(forceBuf.buffer);
      gpu.comRelease(dev.backBufferRTV);
      gpu.comRelease(dev.swapChain);
      gpu.comRelease(dev.context);
      gpu.comRelease(dev.device);
    } catch {
      // best-effort teardown
    }
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));

const rtvArrEmpty: readonly bigint[] = [];

// Separable-blur a bloom mip in place (horizontal A→B, vertical B→A).
function blurMip(m: BloomMip): void {
  gpu.setRenderTargets([m.b.rtv!]);
  gpu.setViewport(m.w, m.h);
  postData.writeFloatLE(1 / m.w, 0);
  postData.writeFloatLE(1 / m.h, 4);
  postData.writeFloatLE(1, 8);
  postData.writeFloatLE(0, 12);
  gpu.updateConstantBuffer(postCb, postData);
  gpu.vsSet(vsFs);
  gpu.psSet(psBlur, { cb: [postCb], srv: [m.a.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(psBlur, { srv: [0n] });
  gpu.setRenderTargets(rtvArrEmpty);
  gpu.setRenderTargets([m.a.rtv!]);
  gpu.setViewport(m.w, m.h);
  postData.writeFloatLE(0, 8);
  postData.writeFloatLE(1, 12);
  gpu.updateConstantBuffer(postCb, postData);
  gpu.vsSet(vsFs);
  gpu.psSet(psBlur, { cb: [postCb], srv: [m.b.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(psBlur, { srv: [0n] });
  gpu.setRenderTargets(rtvArrEmpty);
}

// Bang flash decays over ~0.5s of sim time for the exposure/bloom "BANG" pop.
let bangFlash = 0;

// Persistent φ ping-pong for the Jacobi relaxation: phiRead always holds the latest potential
// (warm start), phiWrite is the next target; they swap every iteration and persist across
// frames so each frame refines the previous solution rather than starting cold.
let phiRead = phiA;
let phiWrite = phiB;

// R = RESET the galaxy back to its fresh two-arm spiral (edge-triggered on the key press).
const VK_R = 0x52; // virtual-key code for 'R'
let prevR = false;

// ── Interactive cinematic camera: left-drag orbits, wheel/keys dolly, inertial glide, and a
//    slow auto-orbit fades back in after a few idle seconds so an untouched demo stays alive. ──
const CAM_ORBIT_RATE = envNum('CAM_ORBIT_RATE', 0.085); // idle auto-orbit yaw rate (rad/s)
const CAM_DRAG_SENS = envNum('CAM_DRAG_SENS', 0.0046); // rad of orbit per pixel dragged
const CAM_ZOOM_SENS = envNum('CAM_ZOOM_SENS', 0.14); // log-dist per wheel notch / key tick
const CAM_INERTIA = envNum('CAM_INERTIA', 6.0); // orbit velocity damping (1/s)
const CAM_ZOOM_INERTIA = envNum('CAM_ZOOM_INERTIA', 9.0); // dolly velocity damping (1/s)
const CAM_IDLE = envNum('CAM_IDLE', 3.5); // idle seconds before auto-orbit fades in
const CAM_AUTO_FADE = envNum('CAM_AUTO_FADE', 1.5); // seconds to ease auto-orbit 0→1
const CAM_ELEV_MIN = 0.18; // ~10° above the disk (keep eye above y=0)
const CAM_ELEV_MAX = 1.45; // ~83° (short of the look-down gimbal)
const CAM_DIST_MIN = envNum('CAM_DIST_MIN', 6.0);
const CAM_DIST_MAX = envNum('CAM_DIST_MAX', 60.0);
const CAM_DEFAULT_DIST = envNum('CAM_DIST', 17.0);
const CAM_DEFAULT_ELEV = Math.min(CAM_ELEV_MAX, Math.max(CAM_ELEV_MIN, envNum('CAM_ELEV', 1.1)));
interface CamState {
  yaw: number;
  elev: number;
  dist: number;
  yawVel: number;
  elevVel: number;
  logDistVel: number;
  autoMix: number;
  idle: number;
  resetEase: number;
}
const cam0: CamState = {
  yaw: 0,
  elev: CAM_DEFAULT_ELEV,
  dist: CAM_DEFAULT_DIST,
  yawVel: 0,
  elevVel: 0,
  logDistVel: 0,
  autoMix: 1,
  idle: CAM_IDLE,
  resetEase: 0,
};
const CAM_CLICK_PX = 5; // left-press travel below which it's a BANG click, not an orbit drag
let dragActive = false;
let dragMoved = 0;
let dragPrevX = 0;
let dragPrevY = 0;
let camPrevLeft = false;
let camPrevWall = performance.now();
const VK_ADD = 0x6b,
  VK_SUBTRACT = 0x6d; // numpad +/- = zoom (arrows also zoom)
const keyDownVK = (vk: number): boolean => (User32.GetAsyncKeyState(vk) & 0x8000) !== 0;

// ── Time controls + HUD state. timeScale multiplies the per-frame SUB-STEP COUNT (never DT, which
//    would change leapfrog accuracy/conservation); pause runs zero sub-steps (a true freeze-frame
//    you can still orbit). A throttled, strided readback gives a cheap live virial readout. ──
const TIME_SCALES = [0.125, 0.25, 0.5, 1, 2, 4, 8];
const TIME_SCALE_DEFAULT_IX = 3;
const HUD_STATS = process.env.GAL_HUD_STATS === '1'; // live virial readout costs a buffer readback → opt-in
const STAT_INTERVAL_MS = envNum('STAT_MS', 1200);
const STAT_STRIDE = Math.max(1, Math.round(envNum('STAT_STRIDE', 64)));
const VK_H = 0x48,
  VK_OEM_4 = 0xdb,
  VK_OEM_6 = 0xdd,
  VK_OEM_MINUS = 0xbd,
  VK_OEM_PLUS = 0xbb;
const VK_OEM_PERIOD = 0xbe,
  VK_OEM_2 = 0xbf;
let timeScaleIx = TIME_SCALE_DEFAULT_IX;
let paused = false;
let showHelp = false;
let stepOnce = false;
let substepAccum = 0;
const keyPrev = new Map<number, boolean>();
function edge(vk: number): boolean {
  const down = (User32.GetAsyncKeyState(vk) & 0x8000) !== 0;
  const was = keyPrev.get(vk) === true;
  keyPrev.set(vk, down);
  return down && !was;
}
// Cheap live physics readout: strided subset, BH+halo PE only (backbone dominates |PE|), throttled.
let statVirial = 0;
let statMeanSpeed = 0;
let statWallT = -1e9;
function sampleStats(): void {
  const pos = new Float32Array(gpu.readbackBuffer(posBuf.buffer, PARTICLE_COUNT * 16));
  const vel = new Float32Array(gpu.readbackBuffer(velBuf.buffer, PARTICLE_COUNT * 16));
  let KE = 0,
    PE = 0,
    vsum = 0,
    n = 0;
  for (let i = 0; i < PARTICLE_COUNT; i += STAT_STRIDE) {
    const o = i * 4;
    const px = pos[o]!,
      py = pos[o + 1]!,
      pz = pos[o + 2]!,
      mm = pos[o + 3]!;
    const vx = vel[o]!,
      vy = vel[o + 1]!,
      vz = vel[o + 2]!;
    const r3 = Math.hypot(px, py, pz);
    const sp2 = vx * vx + vy * vy + vz * vz;
    KE += 0.5 * mm * sp2;
    PE += mm * (phiBH(r3) + phiHalo(r3));
    vsum += Math.sqrt(sp2);
    n += 1;
  }
  statVirial = PE !== 0 ? (2 * KE) / Math.abs(PE) : 0;
  statMeanSpeed = n > 0 ? vsum / n : 0;
}
const helpBrush = GDI32.CreateSolidBrush(0x00242018); // dark warm scrim (BGR)
const helpLines: string[] = [
  ' PARTICLE GALAXY — CONTROLS',
  '',
  ' Left-drag      orbit the camera',
  ' Wheel / arrows zoom in / out',
  ' Left click     BANG (radial blast)',
  ' Right hold     IMPLODE (gravity well)',
  ' Middle hold    VORTEX (whirlpool)',
  ' C              launch a galaxy COLLISION',
  '',
  ' Space          pause / resume (freeze)',
  ' [ - slower     ] = faster   . step',
  ' R reset        H help        ESC exit',
];

// ── Galaxy COLLISION: press C to launch a heavy INTRUDER black hole on a grazing flyby that
//    shears the disk into real tidal TAILS and a BRIDGE. It's an extra softened well in the
//    integrate shader (gBH2); m=0 ⇒ no force ⇒ single-galaxy physics is byte-identical. ──
const COLL_MASS = envNum('COLL_MASS', M_BH * 1.1); // intruder BH mass (≳ the host's own BH → strong tidal tails)
const COLL_SPEED = envNum('COLL_SPEED', 4.2); // launch speed
const COLL_R0 = envNum('COLL_R0', GALAXY_RADIUS * 2.0); // launch distance from centre (closer → arrives sooner)
const COLL_IMPACT = envNum('COLL_IMPACT', GALAXY_RADIUS * 0.45); // impact parameter (closer grazing pass → bigger tidal bridge/tails)
const COLL_HEIGHT = envNum('COLL_HEIGHT', GALAXY_RADIUS * 0.35); // launch height above the disk plane
const VK_C = 0x43;
const COLLIDE_AUTO = process.env.GAL_COLLIDE === '1'; // headless test: auto-launch the collision at t≈1
let autoCollided = false;
let prevC = false;
let collisionActive = false;
let collPullSmooth = 0; // eased camera pull-back during a collision (no hard jolt on launch)
// Supernova flashes: a rare bright transient at a random disk site, blooming then fading.
let snAge = 1e9,
  snNext = SN_INTERVAL,
  snIdx = 0;
const snPos: [number, number, number] = [0, 0, 0];
const snHash = (k: number): number => {
  const s = Math.sin(k) * 43758.5453;
  return s - Math.floor(s);
};
const bh2 = { p: [0, 0, 0] as [number, number, number], v: [0, 0, 0] as [number, number, number], m: 0 };
function launchIntruder(): void {
  collisionActive = true;
  bh2.p = [-COLL_R0, COLL_HEIGHT, COLL_IMPACT]; // off to the side and above the plane
  const dir = [1.0, -0.16, -0.3]; // aimed across the centre for a grazing pass
  const dl = Math.hypot(dir[0]!, dir[1]!, dir[2]!);
  bh2.v = [(dir[0]! / dl) * COLL_SPEED, (dir[1]! / dl) * COLL_SPEED, (dir[2]! / dl) * COLL_SPEED];
  bh2.m = COLL_MASS;
  bangFlash = Math.max(bangFlash, 0.5);
}
// Leapfrog the intruder under the host's enclosed mass (central BH + halo + analytic disk) so it
// follows a real grazing orbit through the galaxy.
function advanceIntruder(dt: number): void {
  if (!collisionActive || bh2.m <= 0 || dt <= 0) return;
  const accel = (px: number, py: number, pz: number): [number, number, number] => {
    const r = Math.hypot(px, py, pz) + 1e-5;
    const Menc = M_BH + haloEnclosed(r) + diskEnclosed(r) * DISK_SEED_W;
    const g = (G_CONST * Menc) / (r * r + SOFTEN * SOFTEN);
    return [-(px / r) * g, -(py / r) * g, -(pz / r) * g];
  };
  let a = accel(bh2.p[0], bh2.p[1], bh2.p[2]);
  for (let k = 0; k < 3; k += 1) bh2.v[k] += a[k]! * 0.5 * dt;
  for (let k = 0; k < 3; k += 1) bh2.p[k] += bh2.v[k]! * dt;
  a = accel(bh2.p[0], bh2.p[1], bh2.p[2]);
  for (let k = 0; k < 3; k += 1) bh2.v[k] += a[k]! * 0.5 * dt;
}

// ── STARTUP EQUILIBRIUM CALIBRATION ────────────────────────────────────────────
// The analytic seed used a SPHERICAL enclosed-mass estimate for the disk's self-gravity, but the
// live PM solver computes the TRUE thin-disk radial force (stronger, differently shaped). That
// mismatch rang a smooth seed UP into axisymmetric shells instead of letting spirals grow. Fix:
// solve the field ONCE on the seeded positions, MEASURE the azimuthally-averaged inward self-gravity
// g_r(r), and reseed every star's circular speed from the ACTUAL total force (BH + halo + measured
// self-gravity). The disk then starts in genuine rotational equilibrium, so the growing modes are the
// swing-amplified SPIRALS we want — not a breathing ring. One-time; the corrected velocities also
// become the R-reset state. GAL_MEASURE_EQ=0 falls back to the analytic seed for comparison.
const MEASURE_EQ = envNum('MEASURE_EQ', 1) > 0.5;
function solveFieldOnce(coldIters: number): void {
  simData.fill(0);
  simData.writeFloatLE(DT_FIXED, 0); // gParams.x dt
  simData.writeFloatLE(0, 4); // gParams.y time
  simData.writeFloatLE(1, 8); // gParams.z spread (render only)
  simData.writeFloatLE(M_HALO, 12); // gParams.w halo mass
  simData.writeFloatLE(G_CONST, 16); // gGrav.x G
  simData.writeFloatLE(M_BH, 20); // gGrav.y BH mass
  simData.writeFloatLE(SOFTEN, 24); // gGrav.z soft
  simData.writeFloatLE(SELF_G_GAIN, 28); // gGrav.w selfGain
  simData.writeFloatLE(R_HALO, 44); // gPhys.w halo radius
  simData.writeFloatLE(SOFT_BH, 48); // gBH.x BH softening
  gpu.updateConstantBuffer(simCb, simData);
  gpu.csSet(csClearGrid, { cb: [simCb], uav: [densBuf.uav!] });
  gpu.dispatch(GRID_GROUPS, GRID_GROUPS, 1);
  gpu.csSet(0n, { uav: [0n] });
  gpu.csSet(csDeposit, { cb: [simCb], srv: [posBuf.srv!], uav: [densBuf.uav!] });
  gpu.dispatch(GROUPS, 1, 1);
  gpu.csSet(0n, { srv: [0n], uav: [0n] });
  gpu.csSet(csSource, { cb: [simCb], uav: [densBuf.uav!, srcBuf.uav!] });
  gpu.dispatch(GRID_GROUPS, GRID_GROUPS, 1);
  gpu.csSet(0n, { uav: [0n, 0n] });
  for (let k = 0; k < coldIters; k += 1) {
    gpu.csSet(csJacobi, { cb: [simCb], srv: [srcBuf.srv!, phiRead.srv!], uav: [phiWrite.uav!] });
    gpu.dispatch(GRID_GROUPS, GRID_GROUPS, 1);
    gpu.csSet(0n, { srv: [0n, 0n], uav: [0n] });
    const tmp = phiRead;
    phiRead = phiWrite;
    phiWrite = tmp;
  }
  gpu.csSet(csForce, { cb: [simCb], srv: [phiRead.srv!], uav: [forceBuf.uav!] });
  gpu.dispatch(GRID_GROUPS, GRID_GROUPS, 1);
  gpu.csSet(0n, { srv: [0n], uav: [0n] });
}
if (MEASURE_EQ) {
  solveFieldOnce(500); // cold start → many passes for a converged t=0 field (also warm-starts the loop)
  const force = new Float32Array(gpu.readbackBuffer(forceBuf.buffer, GRID_CELLS * 8));
  const NR = 320;
  const RMAXP = FIELD_HALF;
  const accSum = new Float64Array(NR);
  const accCnt = new Float64Array(NR);
  for (let gy = 0; gy < GRID_N; gy += 1) {
    const wz = (gy + 0.5) * CELL - FIELD_HALF;
    for (let gx = 0; gx < GRID_N; gx += 1) {
      const wx = (gx + 0.5) * CELL - FIELD_HALF;
      const r = Math.hypot(wx, wz);
      if (r < 1e-3 || r >= RMAXP) continue;
      const c = (gy * GRID_N + gx) * 2;
      const inward = -((force[c]! * wx + force[c + 1]! * wz) / r); // inward radial part of -∇φ (>0 attracting)
      const bin = Math.min(NR - 1, ((r / RMAXP) * NR) | 0);
      accSum[bin] += inward;
      accCnt[bin] += 1;
    }
  }
  const aSelf = new Float64Array(NR);
  let last = 0;
  for (let b = 0; b < NR; b += 1) {
    aSelf[b] = accCnt[b]! > 0 ? accSum[b]! / accCnt[b]! : last;
    last = aSelf[b]!;
  }
  const aS = new Float64Array(NR); // light radial smoothing of the measured profile
  for (let b = 0; b < NR; b += 1) {
    let s = 0,
      n = 0;
    for (let d = -3; d <= 3; d += 1) {
      const j = b + d;
      if (j >= 0 && j < NR) {
        s += aSelf[j]!;
        n += 1;
      }
    }
    aS[b] = s / n;
  }
  const measuredSelfAt = (r: number): number => {
    const f = Math.min(NR - 1.001, Math.max(0, (r / RMAXP) * NR));
    const i = f | 0;
    const t = f - i;
    return Math.max(0, aS[i]! * (1 - t) + aS[Math.min(NR - 1, i + 1)]! * t);
  };
  // Measured circular speed: v² = r·(a_BH + a_halo + selfGain·a_self_measured). a_self is the live
  // grid's azimuthally-averaged inward force, so the disk balances the FORCE IT ACTUALLY FEELS.
  const vcMeasured = (r: number): number => {
    const aBH = (G_CONST * M_BH) / (r * r + SOFT_BH * SOFT_BH);
    const aHalo = (G_CONST * haloEnclosed(r)) / (r * r + SOFTEN * SOFTEN);
    return Math.sqrt(Math.max(0, r * (aBH + aHalo + SELF_G_GAIN * measuredSelfAt(r))));
  };
  let es = 0x51ed270b >>> 0;
  const erand = (): number => {
    es = (Math.imul(es, 1664525) + 1013904223) >>> 0;
    return es / 0x1_0000_0000;
  };
  const egauss = (): number => erand() + erand() + erand() + erand() - 2.0;
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const o = i * 16;
    const px = posSeed.readFloatLE(o);
    const pz = posSeed.readFloatLE(o + 8);
    const r = Math.hypot(px, pz);
    if (r < 1e-4) continue;
    const vc = vcMeasured(r);
    const disp = vc * VEL_DISP;
    const tx = -pz / r,
      tz = px / r; // CCW tangential unit vector
    velSeed.writeFloatLE(tx * vc + egauss() * disp, o);
    velSeed.writeFloatLE(egauss() * disp * 0.5, o + 4);
    velSeed.writeFloatLE(tz * vc + egauss() * disp, o + 8);
    // velSeed.w (temperature) untouched
  }
  gpu.updateConstantBuffer(velBuf.buffer, velSeed);
  console.log(`  Equilibrium calibration: measured v_c(r) — r=1:${vcMeasured(1).toFixed(2)} r=3:${vcMeasured(3).toFixed(2)} r=6:${vcMeasured(6).toFixed(2)} r=9:${vcMeasured(9).toFixed(2)}`);
}

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  if ((User32.GetAsyncKeyState(VirtualKey.VK_ESCAPE) & 0x8000) !== 0) break;

  // ── R = RESET: re-upload the initial spiral seed into the Pos/Vel buffers and restart the
  //    cinematic reveal, wiping any blasts / implodes / accumulated winding so the fresh
  //    two-arm spiral is reborn. Safe at the loop top — no UAV/SRV is bound to these buffers. ──
  const rDown = (User32.GetAsyncKeyState(VK_R) & 0x8000) !== 0;
  if (rDown && !prevR) {
    gpu.updateConstantBuffer(posBuf.buffer, posSeed);
    gpu.updateConstantBuffer(velBuf.buffer, velSeed);
    gpu.updateConstantBuffer(phiA.buffer, zeroGrid); // wipe the warm-started field so it rebuilds
    gpu.updateConstantBuffer(phiB.buffer, zeroGrid);
    phiRead = phiA;
    phiWrite = phiB;
    simTime = 0;
    bangFlash = 0;
    prevLeft = false;
    cam0.resetEase = 1;
    cam0.yaw = 0;
    cam0.idle = 0;
    cam0.autoMix = 0; // re-frame the camera too
    timeScaleIx = TIME_SCALE_DEFAULT_IX;
    paused = false;
    substepAccum = 0;
    stepOnce = false;
    collisionActive = false;
    bh2.m = 0;
    collPullSmooth = 0; // exit collision mode, drop the camera pull-back
    snAge = 1e9;
    snNext = SN_INTERVAL;
    snIdx = 0; // reset the supernova scheduler (else it stalls / loses SELFSHOT determinism post-reset)
  }
  prevR = rDown;

  // ── C = launch a galaxy COLLISION (intruder black hole flyby), edge-triggered ──
  const cDown = (User32.GetAsyncKeyState(VK_C) & 0x8000) !== 0;
  if (cDown && !prevC) launchIntruder();
  prevC = cDown;
  if (COLLIDE_AUTO && !autoCollided && simTime >= 1.0) {
    launchIntruder();
    autoCollided = true;
  }

  const now = performance.now();
  const t = simTime; // SIM time governs the look/physics; render uses it too

  // ── Time / view control keys ──
  if (edge(VK_H) || edge(VK_OEM_2)) showHelp = !showHelp; // H / ? toggle help overlay
  if (edge(VirtualKey.VK_SPACE)) paused = !paused; // Space pause / resume
  if (edge(VK_OEM_4) || edge(VK_OEM_MINUS)) timeScaleIx = Math.max(0, timeScaleIx - 1); // [ / -  slower
  if (edge(VK_OEM_6) || edge(VK_OEM_PLUS)) timeScaleIx = Math.min(TIME_SCALES.length - 1, timeScaleIx + 1); // ] / =  faster
  if (edge(VK_OEM_PERIOD)) stepOnce = true; // .  single-step while paused
  const timeScale = TIME_SCALES[timeScaleIx]!;

  // ── Interactive camera: left-drag orbits, wheel/keys dolly, inertial glide, idle auto-orbit.
  //    Pure CPU — produces the eye/cam/viewProj/spread the cursor-unproject and render upload reuse. ──
  let camDt = (now - camPrevWall) / 1000;
  camPrevWall = now;
  if (!(camDt > 0)) camDt = 1 / 60;
  camDt = Math.min(camDt, 0.05);
  const openRaw = Math.min(1, t / 1.9);
  const spread = openRaw * openRaw * (3 - 2 * openRaw); // smoothstep opening reveal

  const m = win.getMouse();
  const leftDown = m.down || keyDownVK(VirtualKey.VK_LBUTTON);
  const rightDown = keyDownVK(VirtualKey.VK_RBUTTON);
  const middleDown = keyDownVK(VirtualKey.VK_MBUTTON);

  let userInput = false;
  let bangSuppressed = false;
  if (leftDown && !camPrevLeft) {
    dragActive = true;
    dragMoved = 0;
    dragPrevX = m.x;
    dragPrevY = m.y;
  }
  if (dragActive && leftDown) {
    const dx = m.x - dragPrevX;
    const dy = m.y - dragPrevY;
    dragPrevX = m.x;
    dragPrevY = m.y;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    if (dragMoved > CAM_CLICK_PX) {
      // past the click threshold → orbit (not a BANG)
      cam0.yaw -= dx * CAM_DRAG_SENS;
      cam0.elev += dy * CAM_DRAG_SENS;
      cam0.yawVel = (-dx * CAM_DRAG_SENS) / camDt; // leave inertia so release glides on
      cam0.elevVel = (dy * CAM_DRAG_SENS) / camDt;
      userInput = true;
    }
  }
  if (!leftDown && camPrevLeft) dragActive = false;
  if (dragMoved > CAM_CLICK_PX) bangSuppressed = true; // a dragged left press is an orbit, not a bang
  camPrevLeft = leftDown;

  const wheel = win.getWheel(); // +forward = zoom in; resets on read
  if (wheel !== 0) {
    cam0.logDistVel -= (wheel * CAM_ZOOM_SENS) / camDt;
    userInput = true;
  }
  let keyZoom = 0;
  if (keyDownVK(VK_ADD) || keyDownVK(VirtualKey.VK_UP)) keyZoom -= 1;
  if (keyDownVK(VK_SUBTRACT) || keyDownVK(VirtualKey.VK_DOWN)) keyZoom += 1;
  if (keyZoom !== 0) {
    cam0.logDistVel += keyZoom * CAM_ZOOM_SENS * 8.0;
    userInput = true;
  }

  cam0.yaw += cam0.yawVel * camDt;
  cam0.elev += cam0.elevVel * camDt;
  cam0.dist *= Math.exp(cam0.logDistVel * camDt); // log-space dolly → always positive
  cam0.yawVel *= Math.exp(-CAM_INERTIA * camDt);
  cam0.elevVel *= Math.exp(-CAM_INERTIA * camDt);
  cam0.logDistVel *= Math.exp(-CAM_ZOOM_INERTIA * camDt);
  if (cam0.resetEase > 0) {
    // R eases the camera back to default
    const k = Math.min(1, camDt * 6.0);
    cam0.elev += (CAM_DEFAULT_ELEV - cam0.elev) * k;
    cam0.dist += (CAM_DEFAULT_DIST - cam0.dist) * k;
    cam0.yawVel = cam0.elevVel = cam0.logDistVel = 0;
    cam0.resetEase = Math.max(0, cam0.resetEase - camDt / 0.6);
  }
  if (userInput) {
    cam0.idle = 0;
    cam0.autoMix = 0;
  } else cam0.idle += camDt;
  const wantAuto = cam0.idle > CAM_IDLE ? 1 : 0;
  cam0.autoMix += (wantAuto - cam0.autoMix) * Math.min(1, camDt / CAM_AUTO_FADE);
  cam0.yaw += CAM_ORBIT_RATE * cam0.autoMix * camDt; // slow auto-orbit when idle
  cam0.elev += (CAM_DEFAULT_ELEV + 0.05 * Math.sin(t * 0.05) - cam0.elev) * (cam0.autoMix * Math.min(1, camDt * 0.6));
  cam0.elev = Math.min(CAM_ELEV_MAX, Math.max(CAM_ELEV_MIN, cam0.elev));
  cam0.dist = Math.min(CAM_DIST_MAX, Math.max(CAM_DIST_MIN, cam0.dist));
  if (!Number.isFinite(cam0.yaw)) cam0.yaw = 0;
  if (!Number.isFinite(cam0.elev)) cam0.elev = CAM_DEFAULT_ELEV;
  if (!Number.isFinite(cam0.dist)) cam0.dist = CAM_DEFAULT_DIST;

  // Keep the encounter framed, but EASE the pull-back so launching a collision never snaps the camera
  // (the old code added the full pull in a single frame → a hard jolt). Smoothly track the target.
  const collPullTarget = collisionActive ? Math.min(11, 0.3 * Math.hypot(bh2.p[0], bh2.p[1], bh2.p[2])) : 0;
  collPullSmooth += (collPullTarget - collPullSmooth) * Math.min(1, camDt * 1.6); // ~0.6s ease
  const renderDist = cam0.dist + 3.0 * (1 - spread) + collPullSmooth; // reveal/collision fold into render dist only
  const eyeY = renderDist * Math.sin(cam0.elev);
  const eyeR = renderDist * Math.cos(cam0.elev);
  const eye: [number, number, number] = [Math.sin(cam0.yaw) * eyeR, eyeY, Math.cos(cam0.yaw) * eyeR];
  const cam = lookAt(eye, [0, 0, 0], [0, 1, 0]);
  const viewProj = mul4(proj, cam.m);

  // ── Cursor → world: unproject a ray through the cursor onto the disk plane y=0 using the
  //    SAME camera we render with, so the well lands exactly under the pointer. ──
  const ndcX = (m.x / clientW) * 2 - 1;
  const ndcY = 1 - (m.y / clientH) * 2;
  const fovY = (52 * Math.PI) / 180;
  const tanH = Math.tan(fovY / 2);
  // rayDir = normalize(forward + camRight*(ndcX*aspect*tanH) + camUp*(ndcY*tanH)).
  let rdx = cam.forward[0] + cam.right[0] * (ndcX * aspect * tanH) + cam.up[0] * (ndcY * tanH);
  let rdy = cam.forward[1] + cam.right[1] * (ndcX * aspect * tanH) + cam.up[1] * (ndcY * tanH);
  let rdz = cam.forward[2] + cam.right[2] * (ndcX * aspect * tanH) + cam.up[2] * (ndcY * tanH);
  const rl = Math.hypot(rdx, rdy, rdz) || 1;
  rdx /= rl;
  rdy /= rl;
  rdz /= rl;
  // The camera sits ABOVE the disk (eye.y > 0) looking down, so only a DOWNWARD ray (rdy < 0)
  // meets the y=0 plane in front of it. The well lands at the TRUE point under the cursor — we do
  // NOT clamp it to a circle. (The old radius clamp pinned the well to the r=1.7·R circle, which
  // — because a circle on the tilted disk plane projects to a curve — showed up as a curved "wall"
  // of stars near the top edge, where perspective maps screen rows to huge disk radii.) We cap only
  // the RAY LENGTH so a near-horizon ray can't produce a literal infinity; the resulting far,
  // off-screen well is physically harmless because every interaction force falls off with distance.
  let hitX = 0;
  let hitZ = 0;
  let hitValid = false;
  if (rdy < -1e-4) {
    const tHit = Math.min(-eye[1] / rdy, 1.0e4);
    hitX = eye[0] + tHit * rdx;
    hitZ = eye[2] + tHit * rdz;
    hitValid = true;
  }

  // ── How many fixed-dt sub-steps to run this frame. DT_FIXED is NEVER changed (that would alter
  //    leapfrog accuracy / conservation) — only the COUNT. paused → 0 (a true freeze you can still
  //    orbit); '.' injects one step while paused; timeScale scales the count with a fractional carry
  //    so slow-mo advances smoothly. Fast-forward is capped so a hitch can't stall the pump. ──
  let stepsThisFrame: number;
  if (paused) {
    stepsThisFrame = stepOnce ? 1 : 0;
    stepOnce = false;
  } else {
    substepAccum += SUBSTEPS * timeScale;
    stepsThisFrame = Math.floor(substepAccum);
    substepAccum -= stepsThisFrame;
    stepsThisFrame = Math.min(stepsThisFrame, SUBSTEPS * 4);
  }

  // ── Interaction mode + edge-triggered BANG (a dragged left press orbits instead, via bangSuppressed) ──
  let mode = 0; // 0 none, 1 bang, 2 implode, 3 vortex
  let strength = 0;
  let radius = 1.6;
  let cursorActive = 0;
  const bangThisFrame = leftDown && !prevLeft && !bangSuppressed; // clean press only → one-shot impulse
  if (stepsThisFrame > 0) prevLeft = leftDown; // don't consume the press on a frozen frame → fires on resume
  if (bangThisFrame && hitValid) {
    mode = 1;
    strength = 16.0;
    radius = 1.8;
    cursorActive = 1;
    bangFlash = 1.0;
  } else if (rightDown && hitValid) {
    mode = 2;
    strength = 90.0;
    radius = 2.2;
    cursorActive = 1;
  } else if (middleDown && hitValid) {
    mode = 3;
    strength = 22.0;
    radius = 2.6;
    cursorActive = 1;
  }

  // Advance the intruder black hole once this frame by the sim-time about to elapse (0 when paused).
  advanceIntruder(DT_FIXED * stepsThisFrame);

  // ── Advance the physics by stepsThisFrame fixed leapfrog steps (0 when paused) ──
  for (let step = 0; step < stepsThisFrame; step += 1) {
    // The interaction (especially the one-shot BANG) must apply on exactly one sub-step.
    const stepMode = step === 0 ? mode : mode === 1 ? 0 : mode;
    const stepActive = step === 0 ? cursorActive : mode === 1 ? 0 : cursorActive;

    simData.writeFloatLE(DT_FIXED, 0); // gParams.x dt
    simData.writeFloatLE(simTime, 4); // gParams.y time
    simData.writeFloatLE(spread, 8); // gParams.z spread (render-only)
    simData.writeFloatLE(M_HALO, 12); // gParams.w halo mass
    simData.writeFloatLE(G_CONST, 16); // gGrav.x G
    simData.writeFloatLE(M_BH, 20); // gGrav.y black-hole mass
    simData.writeFloatLE(SOFTEN, 24); // gGrav.z soft
    simData.writeFloatLE(SELF_G_GAIN, 28); // gGrav.w selfGain
    simData.writeFloatLE(VEL_DAMP, 32); // gPhys.x velDamp
    simData.writeFloatLE(MAX_ACC, 36); // gPhys.y maxAcc
    simData.writeFloatLE(MAX_SPEED, 40); // gPhys.z maxSpeed
    simData.writeFloatLE(R_HALO, 44); // gPhys.w halo radius
    simData.writeFloatLE(SOFT_BH, 48); // gBH.x black-hole softening
    simData.writeFloatLE(0, 52);
    simData.writeFloatLE(0, 56);
    simData.writeFloatLE(0, 60);
    simData.writeFloatLE(stepMode, 64); // gAct.x mode
    simData.writeFloatLE(strength, 68); // gAct.y strength
    simData.writeFloatLE(radius, 72); // gAct.z radius
    simData.writeFloatLE(0, 76);
    simData.writeFloatLE(hitX, 80); // gCursor.x
    simData.writeFloatLE(0, 84); // gCursor.y (disk plane)
    simData.writeFloatLE(hitZ, 88); // gCursor.z
    simData.writeFloatLE(stepActive, 92); // gCursor.w active
    simData.writeFloatLE(collisionActive ? bh2.p[0] : 0, 96); // gBH2.x intruder pos
    simData.writeFloatLE(collisionActive ? bh2.p[1] : 0, 100); // gBH2.y
    simData.writeFloatLE(collisionActive ? bh2.p[2] : 0, 104); // gBH2.z
    simData.writeFloatLE(collisionActive ? bh2.m : 0, 108); // gBH2.w intruder mass (0 ⇒ no force)
    gpu.updateConstantBuffer(simCb, simData);

    // 1. clear the GRID_N² density cells
    gpu.csSet(csClearGrid, { cb: [simCb], uav: [densBuf.uav!] });
    gpu.dispatch(GRID_GROUPS, GRID_GROUPS, 1);
    gpu.csSet(0n, { uav: [0n] });
    // 2. deposit each star's OWN mass onto the field (Cloud-in-Cell, atomic, fixed-point)
    gpu.csSet(csDeposit, { cb: [simCb], srv: [posBuf.srv!], uav: [densBuf.uav!] });
    gpu.dispatch(GROUPS, 1, 1);
    gpu.csSet(0n, { srv: [0n], uav: [0n] });
    // 3. de-scale cell mass → Poisson source for the relaxation
    gpu.csSet(csSource, { cb: [simCb], uav: [densBuf.uav!, srcBuf.uav!] });
    gpu.dispatch(GRID_GROUPS, GRID_GROUPS, 1);
    gpu.csSet(0n, { uav: [0n, 0n] });
    // 4. Jacobi relaxation ×JACOBI_ITERS, warm-started, ping-ponging phiRead↔phiWrite
    for (let k = 0; k < JACOBI_ITERS; k += 1) {
      gpu.csSet(csJacobi, { cb: [simCb], srv: [srcBuf.srv!, phiRead.srv!], uav: [phiWrite.uav!] });
      gpu.dispatch(GRID_GROUPS, GRID_GROUPS, 1);
      gpu.csSet(0n, { srv: [0n, 0n], uav: [0n] });
      const tmp = phiRead;
      phiRead = phiWrite;
      phiWrite = tmp; // latest solution now in phiRead
    }
    // 5. grid force field g = -∇φ (central difference), so the integrate pass can CIC-interpolate it
    gpu.csSet(csForce, { cb: [simCb], srv: [phiRead.srv!], uav: [forceBuf.uav!] });
    gpu.dispatch(GRID_GROUPS, GRID_GROUPS, 1);
    gpu.csSet(0n, { srv: [0n], uav: [0n] });
    // 6. leapfrog integrate, CIC-interpolating the matched (conservative) self-gravity force.
    gpu.csSet(csIntegrate, { cb: [simCb], srv: [forceBuf.srv!], uav: [posBuf.uav!, velBuf.uav!] });
    gpu.dispatch(GROUPS, 1, 1);
    gpu.csSet(0n, { srv: [0n], uav: [0n, 0n] });

    simTime += DT_FIXED;
  }
  dispatched = true;
  if (bangFlash > 0) bangFlash = Math.max(0, bangFlash - (DT_FIXED * stepsThisFrame) / 0.5);

  // ── Supernova scheduler: ignite a rare flash at a deterministic random disk site, then age it
  //    (the FX pass blooms + fades it). Deterministic in snIdx so SELFSHOT captures are reproducible. ──
  if (SN_ON && stepsThisFrame > 0) {
    snAge += DT_FIXED * stepsThisFrame;
    if (simTime >= snNext) {
      snIdx += 1;
      const h1 = snHash(snIdx * 12.9898),
        h2 = snHash(snIdx * 78.233 + 1.7);
      const h3 = snHash(snIdx * 37.71 + 4.1),
        h4 = snHash(snIdx * 5.31 + 9.2);
      const rr = GALAXY_RADIUS * (0.22 + 0.82 * h1);
      const ang = h2 * Math.PI * 2;
      snPos[0] = rr * Math.cos(ang);
      snPos[1] = (h3 - 0.5) * 0.1 * GALAXY_RADIUS;
      snPos[2] = rr * Math.sin(ang);
      snAge = 0;
      snNext = simTime + SN_INTERVAL * (0.5 + 1.0 * h4);
    }
  }

  // ── Energy diagnostic: sample total energy every few sim-seconds (no clicks → conservation test) ──
  if (ENERGY_PROBE && simTime >= nextProbeT) {
    nextProbeT += 4.0;
    energyProbe();
    if (simTime >= ENERGY_PROBE_T) break;
  }

  // ── Live HUD physics readout (opt-in via GAL_HUD_STATS=1): throttled, strided readback ──
  if (HUD_STATS && !SELFSHOT && !ENERGY_PROBE && now - statWallT >= STAT_INTERVAL_MS) {
    statWallT = now;
    sampleStats();
  }

  // ── Render upload (reuses the camera computed above) ──
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      rendData.writeFloatLE(viewProj[col * 4 + row]!, (row * 4 + col) * 4);
    }
  }
  rendData.writeFloatLE(0.022, 64); // spriteSize (world units)
  rendData.writeFloatLE(aspect, 68);
  rendData.writeFloatLE(t, 72);
  rendData.writeFloatLE(spread, 76); // opening reveal
  rendData.writeFloatLE(cam.right[0], 80);
  rendData.writeFloatLE(cam.right[1], 84);
  rendData.writeFloatLE(cam.right[2], 88);
  rendData.writeFloatLE(eye[0], 92); // eyeX (Doppler)
  rendData.writeFloatLE(cam.up[0], 96);
  rendData.writeFloatLE(cam.up[1], 100);
  rendData.writeFloatLE(cam.up[2], 104);
  rendData.writeFloatLE(eye[1], 108); // eyeY (Doppler)
  rendData.writeFloatLE(cam.forward[0], 112);
  rendData.writeFloatLE(cam.forward[1], 116);
  rendData.writeFloatLE(cam.forward[2], 120);
  rendData.writeFloatLE(eye[2], 124); // eyeZ (Doppler)
  gpu.updateConstantBuffer(rendCb, rendData);

  gpu.setRenderTargets([hdr.rtv!]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(hdr.rtv!, [0.004, 0.006, 0.014, 1]); // faint deep-space haze
  gpu.setBlendState(additiveBlend);
  gpu3d.setCull('none');
  gpu.vsSetShaderResources([posBuf.srv!, velBuf.srv!, srcBuf.srv!]); // t2 = live density → arm lighting
  gpu.vsSet(vsPoints, [rendCb]);
  gpu.psSet(psPoints);
  gpu3d.drawTriangles(PARTICLE_COUNT * 6);

  gpu.vsSetShaderResources([0n, 0n, 0n]);
  gpu.setBlendState(0n);
  gpu.setRenderTargets(rtvArrEmpty);

  // ── DUST pass: hdr → hdr2, attenuated + reddened by the live density grid. Bloom + composite
  //    then read dustSrc, so dark lanes don't bloom (true silhouettes). ──
  let dustSrc = hdr;
  if (DUST_ON) {
    const tanHalf = Math.tan((52 * Math.PI) / 180 / 2);
    dustData.writeFloatLE(eye[0], 0);
    dustData.writeFloatLE(eye[1], 4);
    dustData.writeFloatLE(eye[2], 8);
    dustData.writeFloatLE(0, 12);
    dustData.writeFloatLE(cam.forward[0], 16);
    dustData.writeFloatLE(cam.forward[1], 20);
    dustData.writeFloatLE(cam.forward[2], 24);
    dustData.writeFloatLE(tanHalf, 28);
    dustData.writeFloatLE(cam.right[0], 32);
    dustData.writeFloatLE(cam.right[1], 36);
    dustData.writeFloatLE(cam.right[2], 40);
    dustData.writeFloatLE(aspect, 44);
    dustData.writeFloatLE(cam.up[0], 48);
    dustData.writeFloatLE(cam.up[1], 52);
    dustData.writeFloatLE(cam.up[2], 56);
    dustData.writeFloatLE(0, 60);
    dustData.writeFloatLE(DUST_STRENGTH, 64);
    dustData.writeFloatLE(DUST_FLOOR, 68);
    dustData.writeFloatLE(DUST_GAMMA, 72);
    dustData.writeFloatLE(DUST_REDDEN, 76);
    dustData.writeFloatLE(DUST_OFFSET, 80);
    dustData.writeFloatLE(DUST_TINT, 84);
    dustData.writeFloatLE(FIELD_HALF, 88);
    dustData.writeFloatLE(1.0, 92);
    gpu.updateConstantBuffer(dustCb, dustData);
    gpu.setRenderTargets([hdr2.rtv!]);
    gpu.setViewport(clientW, clientH);
    gpu.setBlendState(0n);
    gpu.vsSet(vsFs);
    gpu.psSet(psDust, { cb: [dustCb], srv: [hdr.srv!, srcBuf.srv!], samp: [sampler] });
    gpu.drawFullscreenTriangle();
    gpu.psSet(psDust, { srv: [0n, 0n] });
    gpu.setRenderTargets(rtvArrEmpty);
    dustSrc = hdr2;
  }

  // ── NUCLEUS + LENSING + HII pass: dustSrc → the other HDR buffer. Fills the dark core with a
  //    brilliant compact accretion glow (so the central mass is LEGIBLE), bends the light around it
  //    (gravitational lensing + a faint Einstein ring), and lights the dense arm ridges with H-alpha
  //    pink + OIII cyan star-forming nebulae read from the live density field. In HDR → it blooms. ──
  if (HII_ON || CORE_INTENSITY > 0 || LENS_STRENGTH > 0) {
    const fxDst = dustSrc === hdr ? hdr2 : hdr;
    const tanHalf = Math.tan((52 * Math.PI) / 180 / 2);
    // Project the black hole (world origin) to screen UV using the SAME viewProj the scene renders
    // with. clip = viewProj·(0,0,0,1) = the matrix's 4th column (row-major store → indices 3,7,11,15).
    const cw = viewProj[15]!;
    const coreInFront = cw > 1e-4;
    const ndcx = coreInFront ? viewProj[3]! / cw : 0;
    const ndcy = coreInFront ? viewProj[7]! / cw : 0;
    const coreU = (ndcx + 1) * 0.5;
    const coreV = (1 - ndcy) * 0.5;
    const coreInt = coreInFront ? CORE_INTENSITY * (0.22 + 0.78 * spread) + bangFlash * 1.5 : 0;
    // Project the COLLISION companion (intruder black hole) to screen so the FX pass can draw its
    // visible bright nucleus. Same row-major viewProj·(p,1) projection as the core above.
    let compU = 0,
      compV = 0,
      compInt = 0;
    if (collisionActive && bh2.m > 0) {
      const px = bh2.p[0],
        py = bh2.p[1],
        pz = bh2.p[2];
      const ccw = viewProj[12]! * px + viewProj[13]! * py + viewProj[14]! * pz + viewProj[15]!;
      if (ccw > 1e-4) {
        const nx = (viewProj[0]! * px + viewProj[1]! * py + viewProj[2]! * pz + viewProj[3]!) / ccw;
        const ny = (viewProj[4]! * px + viewProj[5]! * py + viewProj[6]! * pz + viewProj[7]!) / ccw;
        compU = (nx + 1) * 0.5;
        compV = (1 - ny) * 0.5;
        compInt = CORE_INTENSITY * 0.7; // a bit dimmer than the host nucleus
      }
    }
    fxData.writeFloatLE(eye[0], 0);
    fxData.writeFloatLE(eye[1], 4);
    fxData.writeFloatLE(eye[2], 8);
    fxData.writeFloatLE(t, 12);
    fxData.writeFloatLE(cam.forward[0], 16);
    fxData.writeFloatLE(cam.forward[1], 20);
    fxData.writeFloatLE(cam.forward[2], 24);
    fxData.writeFloatLE(tanHalf, 28);
    fxData.writeFloatLE(cam.right[0], 32);
    fxData.writeFloatLE(cam.right[1], 36);
    fxData.writeFloatLE(cam.right[2], 40);
    fxData.writeFloatLE(aspect, 44);
    fxData.writeFloatLE(cam.up[0], 48);
    fxData.writeFloatLE(cam.up[1], 52);
    fxData.writeFloatLE(cam.up[2], 56);
    fxData.writeFloatLE(FIELD_HALF, 60);
    fxData.writeFloatLE(coreU, 64);
    fxData.writeFloatLE(coreV, 68);
    fxData.writeFloatLE(CORE_SPAN, 72);
    fxData.writeFloatLE(coreInt, 76);
    fxData.writeFloatLE(LENS_STRENGTH, 80);
    fxData.writeFloatLE(LENS_RADIUS, 84);
    fxData.writeFloatLE(HII_ON ? HII_STRENGTH : 0, 88);
    fxData.writeFloatLE(HII_FLOOR, 92);
    fxData.writeFloatLE(HII_GAMMA, 96);
    fxData.writeFloatLE(HII_BASE0, 100);
    fxData.writeFloatLE(1 / DISK_SCALE, 104);
    fxData.writeFloatLE(0, 108);
    fxData.writeFloatLE(compU, 112);
    fxData.writeFloatLE(compV, 116);
    fxData.writeFloatLE(CORE_SPAN * 0.7, 120);
    fxData.writeFloatLE(compInt, 124);
    // Project the active supernova to screen and fade it over ~1s (fills the FX flash slot).
    let snU = 0,
      snV = 0,
      snSpan = 0,
      snInt = 0;
    if (SN_ON && snAge < 1.8) {
      const px = snPos[0],
        py = snPos[1],
        pz = snPos[2];
      const sw = viewProj[12]! * px + viewProj[13]! * py + viewProj[14]! * pz + viewProj[15]!;
      if (sw > 1e-4) {
        snU = ((viewProj[0]! * px + viewProj[1]! * py + viewProj[2]! * pz + viewProj[3]!) / sw + 1) * 0.5;
        snV = (1 - (viewProj[4]! * px + viewProj[5]! * py + viewProj[6]! * pz + viewProj[7]!) / sw) * 0.5;
        snInt = SN_PEAK * Math.exp(-snAge * 2.6) * spread;
        snSpan = 0.009 * (1 + snAge * 3.5); // expanding shock shell
      }
    }
    fxData.writeFloatLE(snU, 128);
    fxData.writeFloatLE(snV, 132);
    fxData.writeFloatLE(snSpan, 136);
    fxData.writeFloatLE(snInt, 140);
    gpu.updateConstantBuffer(fxCb, fxData);
    gpu.setRenderTargets([fxDst.rtv!]);
    gpu.setViewport(clientW, clientH);
    gpu.setBlendState(0n);
    gpu.vsSet(vsFs);
    gpu.psSet(psFx, { cb: [fxCb], srv: [dustSrc.srv!, srcBuf.srv!], samp: [sampler] });
    gpu.drawFullscreenTriangle();
    gpu.psSet(psFx, { srv: [0n, 0n] });
    gpu.setRenderTargets(rtvArrEmpty);
    dustSrc = fxDst;
  }

  if (DEBUG_RAW) {
    gpu.setRenderTargets([dev.backBufferRTV]);
    gpu.setViewport(clientW, clientH);
    gpu.clear(dev.backBufferRTV, [0, 0, 0, 1]);
    postData.writeFloatLE(1, 0);
    postData.writeFloatLE(1, 4);
    postData.writeFloatLE(t, 8);
    postData.writeFloatLE(0, 12);
    gpu.updateConstantBuffer(postCb, postData);
    gpu.vsSet(vsFs);
    gpu.psSet(psRaw, { cb: [postCb], srv: [hdr.srv!], samp: [sampler] });
    gpu.drawFullscreenTriangle();
    gpu.psSet(psRaw, { srv: [0n] });
    drawHud(fps, timeScale, paused, showHelp);
    if (SELFSHOT && !shotTaken && t >= SELFSHOT_T) {
      const st = captureBackBuffer(dev, SELFSHOT_PATH, { gridW: 48, gridH: 22 });
      console.log(`SELFSHOT(raw) → ${SELFSHOT_PATH} nonBlack=${st.nonBlackFrac.toFixed(3)} meanLuma=${st.meanLuma.toFixed(3)}`);
      shotTaken = true;
    }
    dev.present(false);
    presented += 1;
    frames += 1;
    if (now - fpsWindowStart >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsWindowStart));
      frames = 0;
      fpsWindowStart = now;
    }
    if (durationMs > 0 && now - startTime >= durationMs) break;
    if (SELFSHOT && shotTaken) break;
    continue;
  }

  // ── Opening post ramp + BANG flash: hold exposure low / bloom knee high early so the
  //    seed never blooms to white; a LEFT-click BANG briefly lifts exposure + bloom. ──
  const postRamp = spread;
  const flash = bangFlash;
  const exposure = 0.3 + 0.58 * postRamp + 0.35 * flash;
  const bloomStrength = 0.05 + 0.42 * postRamp + 0.5 * flash;
  const bloomThreshold = 3.9 - 1.1 * postRamp - 0.9 * flash; // higher knee → only true highlights bloom (tames the white-core halo)

  // ── Bloom chain: bright pass → mip0, downsample mip0→mip1→mip2, blur each ──
  gpu.setRenderTargets([bloom[0]!.a.rtv!]);
  gpu.setViewport(bloom[0]!.w, bloom[0]!.h);
  postData.writeFloatLE(1 / clientW, 0);
  postData.writeFloatLE(1 / clientH, 4);
  postData.writeFloatLE(bloomThreshold, 8);
  postData.writeFloatLE(0, 12);
  gpu.updateConstantBuffer(postCb, postData);
  gpu.vsSet(vsFs);
  gpu.psSet(psBright, { cb: [postCb], srv: [dustSrc.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(psBright, { srv: [0n] });
  gpu.setRenderTargets(rtvArrEmpty);

  blurMip(bloom[0]!);
  for (let i = 1; i < BLOOM_LEVELS; i += 1) {
    const src = bloom[i - 1]!;
    const dst = bloom[i]!;
    gpu.setRenderTargets([dst.a.rtv!]);
    gpu.setViewport(dst.w, dst.h);
    postData.writeFloatLE(1 / src.w, 0);
    postData.writeFloatLE(1 / src.h, 4);
    postData.writeFloatLE(0, 8);
    postData.writeFloatLE(0, 12);
    gpu.updateConstantBuffer(postCb, postData);
    gpu.vsSet(vsFs);
    gpu.psSet(psDown, { cb: [postCb], srv: [src.a.srv!], samp: [sampler] });
    gpu.drawFullscreenTriangle();
    gpu.psSet(psDown, { srv: [0n] });
    gpu.setRenderTargets(rtvArrEmpty);
    blurMip(dst);
  }

  // ── Composite: HDR + bloom mips → ACES → back buffer ──
  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0, 0, 0, 1]);
  postData.writeFloatLE(exposure, 0);
  postData.writeFloatLE(bloomStrength, 4);
  postData.writeFloatLE(t, 8);
  postData.writeFloatLE(aspect, 12); // composite reads aspect for round background stars
  gpu.updateConstantBuffer(postCb, postData);
  gpu.vsSet(vsFs);
  gpu.psSet(psComposite, {
    cb: [postCb],
    srv: [dustSrc.srv!, bloom[0]!.a.srv!, bloom[1]!.a.srv!, bloom[2]!.a.srv!],
    samp: [sampler],
  });
  gpu.drawFullscreenTriangle();
  gpu.psSet(psComposite, { srv: [0n, 0n, 0n, 0n] });

  drawHud(fps, timeScale, paused, showHelp);

  // ── Self-shot: capture once the SIM time reaches SELFSHOT_T. ──
  if (SELFSHOT && !shotTaken && t >= SELFSHOT_T) {
    try {
      const st = captureBackBuffer(dev, SELFSHOT_PATH, { gridW: 48, gridH: 22 });
      console.log(`SELFSHOT → ${SELFSHOT_PATH} (simT=${t.toFixed(2)}s, ${fps} fps) nonBlack=${st.nonBlackFrac.toFixed(3)} meanLuma=${st.meanLuma.toFixed(3)}`);
    } catch (e) {
      console.log(`SELFSHOT failed: ${String(e)}`);
    }
    shotTaken = true;
  }

  dev.present(false);
  presented += 1;

  frames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (SELFSHOT && shotTaken) break;
  if (durationMs > 0 && now - startTime >= durationMs) break;
}

console.log(`Particle Galaxy finished — dispatched=${dispatched} · frames presented=${presented} · simT=${simTime.toFixed(2)}s · ${fps} fps.`);
cleanup(0);
