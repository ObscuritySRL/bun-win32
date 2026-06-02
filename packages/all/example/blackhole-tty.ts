/**
 * Black Hole TTY — a gravitationally-lensed Schwarzschild black hole, the
 * Interstellar look, rendered per-pixel in pure TypeScript in your terminal.
 *
 * Every pixel is a camera ray. Instead of integrating a geodesic, the ray is bent
 * by a single CLOSED-FORM deflection: a ray that passes the hole with impact
 * parameter b is rotated, in its own plane, toward the centre by an angle
 * α ≈ 2·Rs / b  (the weak-field light-bending law, softened near the shadow). That
 * one cheap rotation does all the heavy lifting:
 *
 *   • the deep STARFIELD behind the hole smears into Einstein-ring arcs that wrap
 *     the black silhouette,
 *   • the thin equatorial ACCRETION DISK is sampled TWICE — once along the bent
 *     ray and once along its mirror partner reflected through the hole — so the
 *     FAR side of the disk arcs UP and OVER the top of the shadow (the iconic halo)
 *     while the near side sweeps under it,
 *   • a razor-thin PHOTON RING ignites where the deflection diverges at the shadow
 *     edge.
 *
 * The disk is graded by temperature (white-hot inner → amber → ember outer), lit
 * by relativistic DOPPLER BEAMING (the side rotating toward us is brighter and
 * bluer, the receding side dimmer and redder) and textured with swirling fbm. The
 * whole HDR scene is bloomed with a cheap separable blur and ACES-tonemapped. A
 * slowly precessing camera gives parallax and lets the halo breathe.
 *
 * Resolution is DECOUPLED from the terminal: the lensed scene is ray-marched into
 * a fixed-area internal HDR buffer (adaptive sample budget for ≥120 bench fps) and
 * bilinearly resampled to fill any window size, so it reflows on live resize.
 *
 * INTERACTIVE: click-drag to orbit the camera (drag horizontally to swing the
 * azimuth, vertically to tilt the inclination — the point you grab follows the
 * cursor); the scroll wheel (or +/−) dollies in and out; the arrow keys nudge; and
 * 'r' eases the view back to the default framing. A flick of the drag throws the
 * orbit into an eased spin, and once you let go it HOLDS your angle with only a
 * gentle drift so the scene stays alive. Before you ever touch it — and in any
 * headless capture — it runs the original cinematic auto-orbit, so the screenshot
 * is unchanged. Mouse tracking is real xterm SGR reporting parsed off stdin by the
 * ./_term engine (terminal mouse, in pure TypeScript).
 *
 * Technique: closed-form gravitational lensing · dual-ray disk lensing (near/halo)
 *   · analytic photon ring · Doppler-beamed temperature disk · fbm turbulence ·
 *   separable bloom · ACES tonemap · decoupled internal buffer + bilinear upsample
 *   · drag-to-orbit camera with flick momentum + idle drift.
 *
 * Run: bun run packages/all/example/blackhole-tty.ts   (drag orbit · wheel zoom · R reset · ESC/q quit)
 */
import { runDemo, Term, clamp, clamp01, lerp, smoothstep, aces, TAU } from './_term';

// ── Internal render scale ───────────────────────────────────────────────────────
// The lensing march is the cost driver, so it runs at a fixed PIXEL BUDGET and is
// bilinearly upsampled to t.W×t.H. ~19k internal pixels holds ≥120 fps at 160×50
// while staying crisp; the budget is split to match the live aspect each frame.
const RENDER_BUDGET = 19000;        // internal HDR pixels ray-marched per frame
const MIN_RW = 96;                  // never drop below this internal width

// ── Black-hole geometry (in units of Schwarzschild radius Rs = 1) ───────────────
const SHADOW_R = 2.6;               // apparent shadow / photon-sphere radius (impact b)
const PHOTON_R = SHADOW_R;          // photon ring sits at the shadow edge
const DISK_IN = 3.0;                // disk inner radius (just outside the ISCO look)
const DISK_OUT = 11.5;              // disk outer radius
const DEFLECT = 2.0 * SHADOW_R;     // α ≈ DEFLECT / b lensing strength (tuned, not literal 2Rs)
// Hoisted shadow-radius scalars used in the per-pixel shader (compile-time constants).
const SHADOW_MIN_B = SHADOW_R * 0.85;   // deflection clamp floor
const SHADOW_GRAZE_HI = SHADOW_R * 2.4; // grazing window upper b
const SHADOW_GRAZE_W = SHADOW_R * 1.5;  // grazing window width
const SHADOW_GRAZE_LO = SHADOW_R * 0.55;// grazing lower b gate
const SHADOW_DIM = SHADOW_R * 2.2;      // sky-dim falloff scale

// ── HDR scene + bloom buffers (allocated in init/resize) ───────────────────────
let scn!: Float32Array;             // internal HDR scene, RW*RH*3
let blm!: Float32Array;             // bloom ping buffer
let blmT!: Float32Array;            // bloom pong buffer
let bright!: Float32Array;          // bright-pass extract
let comp!: Float32Array;            // scn + bloomGain*blmT, premixed once for bilinear
let RW = 0, RH = 0;                 // internal render dims

// ── Bilinear upsample column LUT (invariant across rows; rebuilt on W/RW change) ─
let upW = 0, upRW = 0;
let colI0!: Int32Array;            // x0*3 base offset per output column
let colI1!: Int32Array;            // x1*3 base offset per output column
let colWx!: Float32Array;          // fractional x weight per output column
let colVx!: Float32Array;          // vignette x term (x/W-0.5) per column


// ── Precomputed disk temperature LUT (radius-normalised → emissive RGB) ─────────
const LUT_N = 256;
const DISK_R = new Float32Array(LUT_N);
const DISK_G = new Float32Array(LUT_N);
const DISK_B = new Float32Array(LUT_N);
{
  // Blackbody-ish ramp: inner edge ~ white with a faint blue bias, mid amber,
  // outer a deep ember red. Kept restrained — no neon, a designed sunset palette.
  for (let i = 0; i < LUT_N; i++) {
    const x = i / (LUT_N - 1);        // 0 = inner (hot), 1 = outer (cool)
    let r: number, g: number, b: number;
    if (x < 0.18) {
      const k = x / 0.18;
      r = lerp(1.00, 1.00, k); g = lerp(0.97, 0.86, k); b = lerp(0.92, 0.58, k); // blue-white → warm white
    } else if (x < 0.5) {
      const k = (x - 0.18) / 0.32;
      r = lerp(1.00, 1.00, k); g = lerp(0.86, 0.62, k); b = lerp(0.58, 0.22, k); // warm white → amber
    } else {
      const k = (x - 0.5) / 0.5;
      r = lerp(1.00, 0.74, k); g = lerp(0.62, 0.20, k); b = lerp(0.22, 0.06, k); // amber → ember
    }
    DISK_R[i] = r; DISK_G[i] = g; DISK_B[i] = b;
  }
}

// ── fbm value noise (cheap, for disk turbulence) ────────────────────────────────
const vhash = (x: number, y: number, z: number): number => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
// Final mix shared by every corner hash (matches vhash exactly, bit-for-bit).
const vmix = (h: number): number => {
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const vnoise = (x: number, y: number, z: number): number => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let fx = x - xi, fy = y - yi, fz = z - zi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  // Per-axis imul terms are shared by 4 corners each → compute the 6 once, not 24.
  const x0 = Math.imul(xi, 374761393), x1 = Math.imul(xi + 1, 374761393);
  const y0h = Math.imul(yi, 668265263), y1h = Math.imul(yi + 1, 668265263);
  const z0h = Math.imul(zi, 2147483647), z1h = Math.imul(zi + 1, 2147483647);
  const c000 = vmix(x0 ^ y0h ^ z0h), c100 = vmix(x1 ^ y0h ^ z0h);
  const c010 = vmix(x0 ^ y1h ^ z0h), c110 = vmix(x1 ^ y1h ^ z0h);
  const c001 = vmix(x0 ^ y0h ^ z1h), c101 = vmix(x1 ^ y0h ^ z1h);
  const c011 = vmix(x0 ^ y1h ^ z1h), c111 = vmix(x1 ^ y1h ^ z1h);
  const xa = c000 + (c100 - c000) * fx, xb = c010 + (c110 - c010) * fx;
  const xc = c001 + (c101 - c001) * fx, xd = c011 + (c111 - c011) * fx;
  const ya = xa + (xb - xa) * fy, yb = xc + (xd - xc) * fy;
  return ya + (yb - ya) * fz;
};
const fbm = (x: number, y: number, z: number): number => {
  let a = 0.5, s = 0;
  for (let o = 0; o < 3; o++) { s += a * vnoise(x, y, z); x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; }
  return s;
};

// ── Init / resize: size the internal buffer to the budget at the live aspect ────
const initBuffers = (t: Term): void => {
  const aspect = t.aspect;          // W / H of the pixel grid
  // Choose RW so RW*RH ≈ RENDER_BUDGET and RW/RH ≈ aspect (square internal pixels).
  let rw = Math.round(Math.sqrt(RENDER_BUDGET * aspect));
  rw = Math.max(MIN_RW, rw);
  let rh = Math.max(40, Math.round(rw / aspect));
  RW = rw; RH = rh;
  scn = new Float32Array(RW * RH * 3);
  blm = new Float32Array(RW * RH * 3);
  blmT = new Float32Array(RW * RH * 3);
  bright = new Float32Array(RW * RH * 3);
  comp = new Float32Array(RW * RH * 3);
  upW = 0; upRW = 0;                 // force bilinear column LUT rebuild
};

// ── Deep-space background: O(1) procedural starfield + nebula in a direction ────
// The catalogue-free trick (à la the GPU shader): map the ray direction to spherical
// (azimuth, elevation), lay a cell grid over it, and only the cell the ray lands in
// can host a star — so each pixel touches a constant handful of cells regardless of
// star count, and the field still WARPS correctly because we evaluate it along the
// LENSED direction. Returns linear RGB into bgR[0..2].
const bgR = [0, 0, 0];
// hash a cell → 0..1
const ch = (cx: number, cy: number, salt: number): number => {
  let h = Math.imul(cx | 0, 374761393) ^ Math.imul(cy | 0, 668265263) ^ Math.imul(salt | 0, 2654435761);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
// Same hash as ch() but with the per-cell (cx,cy) imul precombined into `base`,
// so the up-to-four hashes a single cell needs share one imul pair. Bit-identical.
const chSalt = (base: number, salt: number): number => {
  let h = base ^ Math.imul(salt | 0, 2654435761);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const sampleBackground = (dx: number, dy: number, dz: number, time: number): void => {
  // Faint cold nebula from fbm at two scales — keeps the void from being dead flat.
  // Every nebula term carries `neb` as a factor, so when the coarse layer clamps to
  // zero the whole nebula is zero AND the fine `n2` is dead weight — skip its fbm.
  // Bit-identical: the skipped branch only fires where the output would be 0 anyway.
  const n1 = fbm(dx * 2.6 + 11, dy * 2.6 - 4, dz * 2.6 + 7);
  const neb = clamp01(n1 * 1.25 - 0.42);
  let r = 0, g = 0, b = 0;
  if (neb > 0) {
    const n2 = fbm(dx * 6.0 - 9, dy * 6.0 + 3, dz * 6.0 - 2);
    const neb2 = clamp01(n2 * 1.3 - 0.5);
    r = neb * 0.045 + neb2 * neb * 0.05;
    g = neb * 0.06 + neb2 * neb * 0.02;
    b = neb * 0.13 + neb2 * neb * 0.07;
  }

  // spherical coords of the (lensed) ray direction
  const az = Math.atan2(dz, dx);                 // -π..π
  const el = Math.asin(clamp(dy, -1, 1));        // -π/2..π/2
  // Two density layers of stars; check the 3×3 cell neighbourhood so points never
  // get clipped at cell seams. Each layer touches 9 cells → constant work.
  for (let L = 0; L < 2; L++) {
    const scale = 26.0 * (1 + L * 1.9);
    const gx = az * scale, gy = el * scale;
    const cx0 = Math.floor(gx), cy0 = Math.floor(gy);
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const cx = cx0 + ox, cy = cy0 + oy;
        const base = Math.imul(cx | 0, 374761393) ^ Math.imul(cy | 0, 668265263);
        const seed = chSalt(base, L * 131 + 7);
        if (seed < 0.82) continue;                // sparse: ~18% of cells host a star
        // star position inside the cell + its size/colour
        const sxp = cx + chSalt(base, 31 + L);
        const syp = cy + chSalt(base, 53 + L);
        const ddx = gx - sxp, ddy = gy - syp;
        const d2 = ddx * ddx + ddy * ddy;
        // Early-out before the exp/sin: the radial Gaussian's peak multiplier is at
        // most 2.1 (mag=1), so exp(-d2·30)·2.1 < 0.004 whenever d2 ≥ 0.22 — those
        // cells would unconditionally fail the `core < 0.004` test below, so skipping
        // them here (avoiding exp, sin, two hashes, three lerps) is bit-identical.
        if (d2 >= 0.22) continue;
        const mag = (seed - 0.82) / 0.18;          // 0..1 brightness within the layer
        const core = Math.exp(-d2 * 30.0) * (0.4 + 1.7 * mag * mag);
        if (core < 0.004) continue;
        const tw = 0.74 + 0.26 * Math.sin(time * 2.0 + seed * 60.0);
        const inten = core * tw * (1.0 - L * 0.28);
        const hue = chSalt(base, 97 + L);
        r += inten * lerp(1.0, 0.72, hue);
        g += inten * lerp(0.86, 0.84, hue);
        b += inten * lerp(0.62, 1.0, hue);
      }
    }
  }
  bgR[0] = r; bgR[1] = g; bgR[2] = b;
};

// ── Accretion-disk emission at in-plane radius r, azimuth phi, with a Doppler
//    factor (>0 approaching → brighter/bluer). Returns linear RGB into outDisk. ──
const outDisk = [0, 0, 0];
const sampleDisk = (r: number, phi: number, doppler: number, time: number): void => {
  const t = clamp01((r - DISK_IN) / (DISK_OUT - DISK_IN));
  // Radial brightness: a hot, sharp inner lip and a long graceful falloff toward the
  // cool rim. The high exponent keeps the band reading as a thin, defined disk.
  const onset = smoothstep(0, 0.06, t);
  const radial = onset * Math.pow(1 - t, 2.4);
  // Swirling fbm bands; arms wind with radius and shear with time → living plasma.
  const swirl = phi * 2.0 - time * 0.55 - Math.log(r) * 2.6;
  let turb = fbm(Math.cos(swirl) * 2.3, Math.sin(swirl) * 2.3, r * 0.4 + time * 0.05);
  turb = 0.62 + 0.78 * turb;
  // Temperature colour from LUT (inner hot).
  const li = (t * (LUT_N - 1)) | 0;
  let cr = DISK_R[li], cg = DISK_G[li], cb = DISK_B[li];
  // Hot inner lip just outside the photon ring.
  const inner = smoothstep(0.10, 0.0, t);
  // Doppler beaming: a strong relativistic boost on the side rotating toward us,
  // and a steep dimming on the receding side; colour shifts bluer / redder too.
  // The asymmetry is the signature of a real relativistic disk, so push it hard:
  // the approaching limb blazes blue-white, the receding limb sinks to a dim ember.
  const blu = clamp01(0.5 + 0.5 * doppler);          // 0 = receding, 1 = approaching
  const beam = blu * blu;
  const boost = 0.06 + 4.0 * beam * blu;             // steep beaming asymmetry (≈ blu^3)
  cr = lerp(cr * 1.30, cr * 0.74, blu);
  cg = lerp(cg * 0.92, cg * 1.04, blu);
  cb = lerp(cb * 0.50, cb * 1.55, blu);
  let bri = radial * turb * boost;
  bri += inner * 2.2 * (0.4 + boost * 0.3);          // blazing inner lip
  outDisk[0] = cr * bri * 1.8;
  outDisk[1] = cg * bri * 1.8;
  outDisk[2] = cb * bri * 1.8;
};

// ── The lensed ray shader: writes linear HDR into scn for one internal pixel ────
// Camera basis is recomputed per frame; this is the inner loop, kept allocation-free.
let camRoX = 0, camRoY = 0, camRoZ = 0;     // ray origin (camera position)
let fwdX = 0, fwdY = 0, fwdZ = 0;           // forward
let rgtX = 0, rgtY = 0, rgtZ = 0;           // right
let upX = 0, upY = 0, upZ = 0;              // up
// disk plane basis: the disk lies in a plane with normal nrm; in-plane axes a,b.
let nrmX = 0, nrmY = 0, nrmZ = 0;
let dax = 0, day = 0, daz = 0;              // in-plane axis A (phi=0 direction)
let dbx = 0, dby = 0, dbz = 0;              // in-plane axis B
// camera → hole vector (= -camRo), constant per frame, hoisted out of shadePixel
let chx = 0, chy = 0, chz = 0;

// ── Interactive orbit camera ────────────────────────────────────────────────────
// Drag orbits (azim/elev), wheel or +/− dollies (dist), a flick imparts momentum,
// idle adds a gentle drift, and 'r' eases back to the default framing. Until the
// FIRST interaction (and in any headless capture, which has no mouse/keys) the
// camera runs the original cinematic auto-orbit verbatim, so the screenshot is
// byte-for-byte unchanged. Pixel deltas hit the angles DIRECTLY so dragging stays
// responsive even when the sim is paused (dt = 0); momentum/drift/zoom use dt.
const AZIM0 = 0;                          // default azimuth seed
const ELEV0 = 0.135;                      // default inclination (~7.7°, near-edge-on)
const DIST0 = 18.0;                       // default dolly distance
const ELEV_LIMIT = 1.45;                  // clamp |elev| to ~83°; near ±90° the basis gimbal-locks (roll/flip)
const DIST_MIN = 13.0, DIST_MAX = 45.0;   // keep the camera outside the disk, never uselessly far
const DRAG_AZIM = 0.006;                  // radians of orbit per horizontal pixel dragged
const DRAG_ELEV = 0.006;                  // radians of tilt per vertical pixel dragged
const MOMENTUM_DECAY = 2.2;               // e-folding rate (1/s) of the post-flick spin
const MOMENTUM_MAX = 4.0;                 // cap the flung angular velocity (rad/s)
const IDLE_DRIFT_DELAY = 2.5;             // seconds of stillness before the gentle drift resumes
const IDLE_DRIFT_RATE = 0.05;            // radians/s of idle azimuthal drift
const KEY_AZIM_STEP = 0.08;               // arrow-key azimuth nudge (radians)
const KEY_ELEV_STEP = 0.05;               // arrow-key inclination nudge (radians)
const ZOOM_WHEEL = 0.86;                  // dist *= this per wheel tick toward the viewer (zoom in)
const ZOOM_KEY = 0.90;                    // dist *= this per +/− key (zoom in)

let camAzim = AZIM0, camElev = ELEV0;     // live camera angles (manual mode)
let camDist = DIST0, tgtDist = DIST0;     // live distance eased toward the zoom target
let velAzim = 0;                          // post-flick angular momentum (rad/s)
let everInteracted = false;               // has the user touched it yet?
let lastInteractT = 0;                    // sim-time of the last interaction
let dragging = false;                     // left button was held last frame
let prevMX = 0, prevMY = 0;               // previous mouse pixel pos (for the drag delta)
let resetting = false;                    // easing back toward the default framing
// onKey → frame hand-off accumulators (written between frames, consumed once per frame)
let kbAzim = 0, kbElev = 0;               // pending arrow-key nudges
let kbZoom = 0;                           // pending +/− zoom steps (net; + = in)
let pendingReset = false;                 // 'r' pressed

// Intersect a (origin+dir·s) ray with the disk plane (through origin, normal nrm),
// writing the emissive disk colour into acc3 and the hit distance into hitT.
const acc3 = [0, 0, 0];
let hitT = 0;
const sampleDiskAlongRay = (
  ox: number, oy: number, oz: number,
  dirx: number, diry: number, dirz: number,
  time: number,
): boolean => {
  const denom = dirx * nrmX + diry * nrmY + dirz * nrmZ;
  if (Math.abs(denom) < 1e-5) return false;
  // plane passes through the hole at the world origin → t = -(o·n)/(d·n)
  const tHit = -(ox * nrmX + oy * nrmY + oz * nrmZ) / denom;
  if (tHit <= 0) return false;
  const hx = ox + dirx * tHit, hy = oy + diry * tHit, hz = oz + dirz * tHit;
  const r = Math.sqrt(hx * hx + hy * hy + hz * hz);
  if (r < DISK_IN || r > DISK_OUT) return false;
  hitT = tHit;
  // azimuth in the disk plane
  const pa = hx * dax + hy * day + hz * daz;
  const pb = hx * dbx + hy * dby + hz * dbz;
  const phi = Math.atan2(pb, pa);
  // Orbital velocity (counter-clockwise) is the disk tangent: d/dphi of
  // (cos·A + sin·B) = -sin·A + cos·B. Doppler = its projection on the view ray.
  const pab = 1 / Math.max(1e-6, Math.sqrt(pa * pa + pb * pb));
  const sphi = pb * pab;
  const cphi = pa * pab;
  const tx = -sphi * dax + cphi * dbx;
  const ty = -sphi * day + cphi * dby;
  const tz = -sphi * daz + cphi * dbz;
  // view direction from hit point toward camera
  const vx = camRoX - hx, vy = camRoY - hy, vz = camRoZ - hz;
  const vlen = 1 / Math.sqrt(vx * vx + vy * vy + vz * vz);
  // orbital speed grows toward the centre (Keplerian-ish) → stronger beaming inside
  const speed = Math.min(0.92, 1.5 / Math.sqrt(r));
  const doppler = (tx * vx + ty * vy + tz * vz) * vlen * speed;
  sampleDisk(r, phi, doppler, time);
  acc3[0] = outDisk[0]; acc3[1] = outDisk[1]; acc3[2] = outDisk[2];
  return true;
};

// ── Render one internal pixel (ix,iy) → scn ────────────────────────────────────
const shadePixel = (ix: number, iy: number, time: number): void => {
  // NDC in [-1,1], square pixels (internal buffer is already aspect-correct).
  const ndcx = (ix + 0.5) / RW * 2 - 1;
  const ndcy = ((iy + 0.5) / RH * 2 - 1) * (RH / RW); // keep vertical scale square
  // Primary ray direction.
  let dx = fwdX + rgtX * ndcx + upX * ndcy;
  let dy = fwdY + rgtY * ndcx + upY * ndcy;
  let dz = fwdZ + rgtZ * ndcx + upZ * ndcy;
  let inv = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz);
  dx *= inv; dy *= inv; dz *= inv;

  // ── closed-form lensing ──
  // Impact parameter: perpendicular distance from the hole (at origin) to the ray.
  // ox = camera, the hole is at 0. Component of (-cam) along dir, then reject.
  const cx = chx, cy = chy, cz = chz;                       // camera → hole vector (hoisted)
  const along = cx * dx + cy * dy + cz * dz;
  const perpx = cx - along * dx, perpy = cy - along * dy, perpz = cz - along * dz;
  const b = Math.sqrt(perpx * perpx + perpy * perpy + perpz * perpz);

  // Direction from the ray toward the hole (the bend direction), unit.
  let blen = b > 1e-6 ? 1 / b : 0;
  const bx = perpx * blen, by = perpy * blen, bz = perpz * blen;

  // Deflection angle α ≈ DEFLECT / b, capped so it stays finite at the shadow.
  // Rays inside the shadow impact are captured (pure black).
  const captured = b < SHADOW_R && along > 0;

  // Bend the primary ray toward the hole by α: rotate dir within the (dir,b) plane.
  const alpha = DEFLECT / Math.max(b, SHADOW_MIN_B);
  const ca = Math.cos(alpha), sa = Math.sin(alpha);
  // rotate dir toward bDir: dir' = dir·cos + bDir·sin
  let ldx = dx * ca + bx * sa;
  let ldy = dy * ca + by * sa;
  let ldz = dz * ca + bz * sa;
  inv = 1 / Math.sqrt(ldx * ldx + ldy * ldy + ldz * ldz);
  ldx *= inv; ldy *= inv; ldz *= inv;

  let r = 0, g = 0, bl = 0;

  // ── DISK: two contributions give the iconic split image. ──
  //  (1) STRAIGHT ray → the geometrically-correct disk crossings: the NEAR side
  //      sweeps in FRONT of (and below) the shadow; a crossing BEHIND the hole is
  //      kept only when it isn't swallowed by the shadow disc (b > SHADOW_R).
  //  (2) BENT ray → the lensed image: light grazing the shadow is pulled around so
  //      the FAR rim of the disk arcs UP and OVER the top — the Interstellar halo.
  if (!captured) {
    // (1) direct disk (straight, un-bent ray).
    if (sampleDiskAlongRay(camRoX, camRoY, camRoZ, dx, dy, dz, time)) {
      const front = hitT < along;                     // in front of the hole?
      if (front || b > SHADOW_R) {
        r += acc3[0]; g += acc3[1]; bl += acc3[2];
      }
    }
    // (2) lensed disk (bent ray) — the over-the-top halo + secondary arcs. Gate to
    // rays grazing the shadow with a SHARPER, narrower falloff so the far rim reads as
    // a crisp bright band arcing over the top, not a fattened, smeared torus.
    const grazing = smoothstep(0, 1, clamp01((SHADOW_GRAZE_HI - b) / SHADOW_GRAZE_W));
    if (grazing > 0.01 && b > SHADOW_GRAZE_LO) {
      if (sampleDiskAlongRay(camRoX, camRoY, camRoZ, ldx, ldy, ldz, time)) {
        const w = 0.95 * grazing;
        r += acc3[0] * w; g += acc3[1] * w; bl += acc3[2] * w;
      }
      // a further-bent secondary image lifts the very top of the far rim into a thin
      // bright crown right above the photon ring.
      const alpha2 = alpha * 1.9;
      const c2 = Math.cos(alpha2), s2 = Math.sin(alpha2);
      let sdx = dx * c2 + bx * s2, sdy = dy * c2 + by * s2, sdz = dz * c2 + bz * s2;
      const si = 1 / Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
      sdx *= si; sdy *= si; sdz *= si;
      if (sampleDiskAlongRay(camRoX, camRoY, camRoZ, sdx, sdy, sdz, time)) {
        const w = 0.42 * grazing * grazing;
        r += acc3[0] * w; g += acc3[1] * w; bl += acc3[2] * w;
      }
    }
  }

  // ── PHOTON RING: a razor-thin, perfectly circular annulus of light orbiting the
  //    shadow edge — the brightest, sharpest feature, defining the silhouette. It is
  //    the photons that loop the hole, so it carries the SAME relativistic Doppler
  //    asymmetry as the disk: the limb whose orbital motion sweeps toward us blazes,
  //    the receding limb fades to a faint thread. ──
  if (!captured && along > 0) {
    const ringD = b - PHOTON_R;
    // A genuinely thin core (sharp Gaussian) plus a faint, tight outer thread — no
    // fat halo. The disk supplies the broad glow; the ring stays a defined line.
    const ring = Math.exp(-ringD * ringD * 26.0) + 0.18 * Math.exp(-ringD * ringD * 5.0);
    if (ring > 0.002) {
      // Project the ray's point of closest approach into the disk plane to find which
      // limb of the ring this pixel is on, then beam it like the disk's orbit.
      const px = -bx, py = -by, pz = -bz;              // outward radial in the bend plane
      const pa = px * dax + py * day + pz * daz;
      const pb = px * dbx + py * dby + pz * dbz;
      const plen = Math.sqrt(pa * pa + pb * pb);
      let beam = 1.0;
      if (plen > 1e-5) {
        const cphi = pa / plen, sphi = pb / plen;
        // orbital tangent (counter-clockwise) at this azimuth, projected on view ray
        const tx = -sphi * dax + cphi * dbx;
        const ty = -sphi * day + cphi * dby;
        const tz = -sphi * daz + cphi * dbz;
        const dop = clamp01(0.5 + 0.5 * (tx * fwdX + ty * fwdY + tz * fwdZ) * 1.6);
        beam = 0.22 + 2.6 * dop * dop;                 // dim receding thread → blazing limb
      }
      // colour shifts cooler/bluer on the bright (approaching) limb
      const warm = clamp01(2.0 - beam);
      r += ring * beam * (1.05 + 0.45 * warm);
      g += ring * beam * 1.02;
      bl += ring * beam * (1.25 - 0.55 * warm);
    }
  }

  // ── BACKGROUND: starfield + nebula along the lensed ray (so the sky warps) ──
  if (!captured) {
    sampleBackground(ldx, ldy, ldz, time);
    // light far from the hole passes nearly straight; near the shadow it dims into
    // the ring (gravitational redshift hint).
    const dim = clamp01((b - SHADOW_R) / SHADOW_DIM);
    const sky = 0.35 + 0.65 * smoothstep(0, 1, dim);
    r += bgR[0] * sky; g += bgR[1] * sky; bl += bgR[2] * sky;
  }

  const o = (iy * RW + ix) * 3;
  scn[o] = r; scn[o + 1] = g; scn[o + 2] = bl;
};

// ── Separable bloom on the internal buffer (bright-pass → H blur → V blur) ──────
const W5 = [0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216];
const doBloom = (): void => {
  const N = RW * RH * 3;
  // bright pass: keep only HDR-bright energy
  for (let i = 0; i < N; i += 3) {
    const lr = scn[i], lg = scn[i + 1], lb = scn[i + 2];
    const lum = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
    const k = smoothstep(0.7, 1.8, lum);
    bright[i] = lr * k; bright[i + 1] = lg * k; bright[i + 2] = lb * k;
  }
  // horizontal blur bright → blm
  const span = 2;
  for (let y = 0; y < RH; y++) {
    const row = y * RW;
    for (let x = 0; x < RW; x++) {
      const o = (row + x) * 3;
      let sr = bright[o] * W5[0], sg = bright[o + 1] * W5[0], sb = bright[o + 2] * W5[0];
      for (let k = 1; k < 5; k++) {
        const off = k * span;
        const xl = x - off >= 0 ? x - off : 0;
        const xr = x + off < RW ? x + off : RW - 1;
        const ol = (row + xl) * 3, or = (row + xr) * 3;
        const w = W5[k];
        sr += (bright[ol] + bright[or]) * w;
        sg += (bright[ol + 1] + bright[or + 1]) * w;
        sb += (bright[ol + 2] + bright[or + 2]) * w;
      }
      blm[o] = sr; blm[o + 1] = sg; blm[o + 2] = sb;
    }
  }
  // vertical blur blm → blmT
  for (let y = 0; y < RH; y++) {
    for (let x = 0; x < RW; x++) {
      const o = (y * RW + x) * 3;
      let sr = blm[o] * W5[0], sg = blm[o + 1] * W5[0], sb = blm[o + 2] * W5[0];
      for (let k = 1; k < 5; k++) {
        const off = k * span;
        const yl = y - off >= 0 ? y - off : 0;
        const yr = y + off < RH ? y + off : RH - 1;
        const ol = (yl * RW + x) * 3, or = (yr * RW + x) * 3;
        const w = W5[k];
        sr += (blm[ol] + blm[or]) * w;
        sg += (blm[ol + 1] + blm[or + 1]) * w;
        sb += (blm[ol + 2] + blm[or + 2]) * w;
      }
      blmT[o] = sr; blmT[o + 1] = sg; blmT[o + 2] = sb;
    }
  }
};

// ── Per-frame ──────────────────────────────────────────────────────────────────
const frame = (t: Term, time: number, dt: number, _frameNo: number): void => {
  const W = t.W, H = t.H;
  if (RW === 0) initBuffers(t);

  // ── camera: an interactive orbit camera. The DEFAULT (untouched) pose is the
  //    original slow azimuthal orbit at a LOW elevation so we view the equatorial
  //    disk nearly edge-on — that near-grazing angle is what makes the far side of
  //    the disk lens up and over the top of the shadow (the halo). Drag/scroll/keys
  //    take that pose over; until then (and in any headless capture) it auto-orbits
  //    exactly as before, so the screenshot is unchanged. ──
  const autoAzim = time * 0.075;
  const autoElev = 0.135 + 0.055 * Math.sin(time * 0.19);   // ~5°–11° eased inclination bob
  const autoDist = 18.0 + 1.4 * Math.sin(time * 0.12);

  // Drain the keyboard accumulators (written by onKey between frames) and the wheel.
  const keyAzim = kbAzim, keyElev = kbElev, keyZoom = kbZoom, doReset = pendingReset;
  kbAzim = 0; kbElev = 0; kbZoom = 0; pendingReset = false;
  const wheel = t.wheel; t.wheel = 0;

  // Drag deltas from the (opted-in) mouse: anchor on press, accumulate while held.
  const down = t.mouseDown && t.mouseInside;
  let dragAzim = 0, dragElev = 0;
  if (down && !dragging) { prevMX = t.mouseX; prevMY = t.mouseY; velAzim = 0; }   // press: anchor, no jump, fresh flick
  else if (down && dragging) {
    dragAzim = (t.mouseX - prevMX) * DRAG_AZIM;
    dragElev = (t.mouseY - prevMY) * DRAG_ELEV;
    prevMX = t.mouseX; prevMY = t.mouseY;
  }
  dragging = down;

  const anyInput = down || wheel !== 0 || keyAzim !== 0 || keyElev !== 0 || keyZoom !== 0 || doReset;

  if (anyInput && !everInteracted) {
    // First touch: seed the manual state from the live auto pose so nothing jumps.
    camAzim = autoAzim; camElev = autoElev; camDist = autoDist; tgtDist = autoDist;
    everInteracted = true;
  }

  if (!everInteracted) {
    // Untouched / headless: original cinematic auto-orbit, verbatim.
    camAzim = autoAzim; camElev = autoElev; camDist = autoDist; tgtDist = autoDist;
  } else {
    if (anyInput) lastInteractT = time;

    // Orbit by drag — applied DIRECTLY (responsive even when paused, dt = 0). Grab
    // feel: the point you hold trails the cursor (drag right → the scene swings right).
    if (dragAzim !== 0 || dragElev !== 0) {
      camAzim += dragAzim;
      camElev += dragElev;
      if (dt > 1e-4) velAzim = clamp(dragAzim / dt, -MOMENTUM_MAX, MOMENTUM_MAX); // carry the flick
    }
    // Arrow-key fine nudges.
    camAzim += keyAzim;
    camElev += keyElev;

    // Reset request: ease back toward the default framing.
    if (doReset) { resetting = true; velAzim = 0; }

    // Zoom: wheel + keys fold into the eased target distance (+tick = toward viewer).
    if (wheel !== 0) tgtDist *= Math.pow(ZOOM_WHEEL, wheel);
    if (keyZoom !== 0) tgtDist *= Math.pow(ZOOM_KEY, keyZoom);
    tgtDist = clamp(tgtDist, DIST_MIN, DIST_MAX);

    if (resetting) {
      // Ease azimuth (shortest angular path), inclination, and distance to default.
      const dA = ((AZIM0 - camAzim + Math.PI) % TAU + TAU) % TAU - Math.PI;
      const k = 1 - Math.exp(-dt * 3.0);
      camAzim += dA * k;
      camElev += (ELEV0 - camElev) * k;
      tgtDist = DIST0;
      if (Math.abs(dA) < 0.01 && Math.abs(ELEV0 - camElev) < 0.01) resetting = false;
      if (down || keyAzim !== 0 || keyElev !== 0) resetting = false;  // user grabbed back
    } else if (!down) {
      // Post-flick momentum, then a gentle idle drift once it has settled.
      camAzim += velAzim * dt;
      velAzim *= Math.exp(-dt * MOMENTUM_DECAY);
      if (Math.abs(velAzim) < 1e-3) velAzim = 0;
      if (velAzim === 0 && time - lastInteractT > IDLE_DRIFT_DELAY) camAzim += IDLE_DRIFT_RATE * dt;
    }

    // Smooth dolly toward the zoom target.
    camDist += (tgtDist - camDist) * (1 - Math.exp(-dt * 6.0));

    // Clamps: stay clear of the ±90° gimbal-lock pole and outside the disk volume.
    camElev = clamp(camElev, -ELEV_LIMIT, ELEV_LIMIT);
    camDist = clamp(camDist, DIST_MIN, DIST_MAX);
  }

  const azim = camAzim, elev = camElev, dist = camDist;
  const cp = Math.cos(elev), sp = Math.sin(elev);
  camRoX = Math.cos(azim) * dist * cp;
  camRoZ = Math.sin(azim) * dist * cp;
  camRoY = sp * dist;
  chx = -camRoX; chy = -camRoY; chz = -camRoZ;          // camera → hole, hoisted for shadePixel

  // forward = toward origin
  let fx = -camRoX, fy = -camRoY, fz = -camRoZ;
  let fl = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
  fwdX = fx * fl; fwdY = fy * fl; fwdZ = fz * fl;
  // right = normalize(cross(worldUp, forward)), worldUp=(0,1,0) → (fwdZ, 0, -fwdX)
  let rx = fwdZ, ry = 0, rz = -fwdX;
  let rl = 1 / Math.sqrt(rx * rx + ry * ry + rz * rz);
  rgtX = rx * rl; rgtY = ry * rl; rgtZ = rz * rl;
  // up = cross(forward, right)
  upX = fwdY * rgtZ - fwdZ * rgtY;
  upY = fwdZ * rgtX - fwdX * rgtZ;
  upZ = fwdX * rgtY - fwdY * rgtX;

  // Field of view: scale the right/up by tan(fov/2) so the hole frames nicely.
  const fov = 0.62;
  rgtX *= fov; rgtY *= fov; rgtZ *= fov;
  upX *= fov; upY *= fov; upZ *= fov;

  // ── disk plane basis: the accretion disk lies in the equatorial XZ-plane with a
  //    fixed world-up normal. Keeping it fixed (and orbiting the CAMERA instead)
  //    gives a rock-steady disk whose lensed halo glides as the camera circles. ──
  nrmX = 0; nrmY = 1; nrmZ = 0;
  dax = 1; day = 0; daz = 0;       // in-plane axis A (phi = 0)
  dbx = 0; dby = 0; dbz = 1;       // in-plane axis B (phi = 90°)

  // ── ray-march the internal scene ──
  for (let y = 0; y < RH; y++) {
    for (let x = 0; x < RW; x++) shadePixel(x, y, time);
  }

  // ── bloom ──
  doBloom();

  // ── composite + tonemap, bilinearly upsampling internal → t.buf ──
  const buf = t.buf;
  const sxs = RW / W, sys = RH / H;
  const bloomGain = 1.5;

  // Premix scene + bloom ONCE per internal texel (instead of 4× per output pixel
  // inside the bilinear tap). Bit-identical: each tap still reads scn[i]+gain*blmT[i].
  {
    const N = RW * RH * 3;
    for (let i = 0; i < N; i++) comp[i] = scn[i] + bloomGain * blmT[i];
  }

  // (Re)build the per-column bilinear + vignette LUT only when the geometry changes.
  if (upW !== W || upRW !== RW) {
    if (!colI0 || colI0.length !== W) {
      colI0 = new Int32Array(W); colI1 = new Int32Array(W);
      colWx = new Float32Array(W); colVx = new Float32Array(W);
    }
    for (let x = 0; x < W; x++) {
      let fxv = (x + 0.5) * sxs - 0.5;
      if (fxv < 0) fxv = 0; else if (fxv > RW - 1) fxv = RW - 1;
      const x0 = fxv | 0, x1 = x0 + 1 < RW ? x0 + 1 : x0;
      colI0[x] = x0 * 3; colI1[x] = x1 * 3; colWx[x] = fxv - x0;
      colVx[x] = x / W - 0.5;
    }
    upW = W; upRW = RW;
  }

  for (let y = 0; y < H; y++) {
    // source y (clamped sample coords for bilinear)
    let fyv = (y + 0.5) * sys - 0.5;
    if (fyv < 0) fyv = 0; else if (fyv > RH - 1) fyv = RH - 1;
    const y0 = fyv | 0, y1 = y0 + 1 < RH ? y0 + 1 : y0;
    const wy = fyv - y0;
    const rowy0 = y0 * RW * 3, rowy1 = y1 * RW * 3;
    const vy = (y / H - 0.5), vyy = vy * vy;
    for (let x = 0; x < W; x++) {
      const cx0 = colI0[x], cx1 = colI1[x], wx = colWx[x];
      const i00 = rowy0 + cx0, i10 = rowy0 + cx1;
      const i01 = rowy1 + cx0, i11 = rowy1 + cx1;
      const w00 = (1 - wx) * (1 - wy), w10 = wx * (1 - wy), w01 = (1 - wx) * wy, w11 = wx * wy;
      // premixed scene+bloom, bilinear
      let rl = comp[i00] * w00 + comp[i10] * w10 + comp[i01] * w01 + comp[i11] * w11;
      let gl = comp[i00 + 1] * w00 + comp[i10 + 1] * w10 + comp[i01 + 1] * w01 + comp[i11 + 1] * w11;
      let bl = comp[i00 + 2] * w00 + comp[i10 + 2] * w10 + comp[i01 + 2] * w01 + comp[i11 + 2] * w11;

      // vignette (darkens the corners → focus on the hole)
      const vx = colVx[x];
      const vig = 1 - 0.9 * (vx * vx + vyy);
      rl *= vig; gl *= vig; bl *= vig;

      // ACES tonemap → 0..1
      let rr = aces(rl), rg = aces(gl), rb = aces(bl);
      // Cinematic split-tone: cool teal in the shadows, warm amber in the highlights
      // — a restrained colour grade that ties the palette together.
      const lum = rr * 0.2126 + rg * 0.7152 + rb * 0.0722;
      const shadow = (1 - lum) * (1 - lum);            // weight toward darks
      const high = lum * lum;                          // weight toward brights
      rr = clamp01(rr + high * 0.045 - shadow * 0.012);
      rg = clamp01(rg + high * 0.018 + shadow * 0.006);
      rb = clamp01(rb - high * 0.03 + shadow * 0.03);
      // gentle filmic contrast
      rr = clamp01((rr - 0.5) * 1.06 + 0.5);
      rg = clamp01((rg - 0.5) * 1.06 + 0.5);
      rb = clamp01((rb - 0.5) * 1.06 + 0.5);

      const o = (y * W + x) * 3;
      buf[o] = (rr * 255) | 0;
      buf[o + 1] = (rg * 255) | 0;
      buf[o + 2] = (rb * 255) | 0;
    }
  }
};

runDemo({
  title: 'Black Hole TTY',
  hud: 'DRAG ORBIT - WHEEL/+- ZOOM - ARROWS NUDGE - R RESET',
  captureT: 7,
  mouse: true,
  init: (t) => { RW = 0; initBuffers(t); },
  resize: (t) => { RW = 0; initBuffers(t); },
  // Camera control: arrows nudge the orbit, +/− dolly, 'r' resets. The wheel and
  // drag are read straight off the Term each frame; these accumulate between frames.
  onKey: (k) => {
    if (k === 'left') kbAzim -= KEY_AZIM_STEP;
    else if (k === 'right') kbAzim += KEY_AZIM_STEP;
    else if (k === 'up') kbElev += KEY_ELEV_STEP;
    else if (k === 'down') kbElev -= KEY_ELEV_STEP;
    else if (k === 'r') pendingReset = true;
    else if (k === '+' || k === '=') kbZoom += 1;   // zoom in
    else if (k === '-' || k === '_') kbZoom -= 1;   // zoom out
  },
  frame,
});
