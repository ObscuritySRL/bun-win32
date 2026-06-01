/**
 * Torus Knot — a glossy, per-pixel ray-marched (2,3) torus knot, pure TypeScript, in the terminal.
 *
 * The classic spinning-donut reimagined for 2026: a single SOLID chrome-pearl (2,3) torus knot is
 * RAY-MARCHED per pixel against a real signed-distance field — no triangles, no point cloud, just a
 * smooth analytic surface that self-occludes perfectly and never aliases into gaps. The knot's
 * distance field is built from a coarse, once-computed centerline sampled into a uniform spatial
 * HASH GRID, so the nearest-tube distance for any point costs only a handful of cell lookups; the
 * marcher then refines with sphere-tracing and finishes with a central-difference NORMAL.
 *
 * Lighting is physically-flavoured and entirely hand-rolled: a moving warm KEY light orbits the knot
 * and casts soft penumbra SHADOWS (a second short march toward the light), a cool sky FILL fakes
 * bounce, a tight Blinn-Phong SPECULAR glints and slides across the surface as it turns, a
 * normal-driven IRIDESCENCE shifts a single refined teal-to-violet hue (never a rainbow), and an
 * occlusion term from the march iteration count darkens the crevices. The brightest speculars are
 * additively BLOOMED into soft halos; a Fresnel RIM lifts the silhouette. Behind it: a designed dark
 * radial-vignette gradient and a deterministic, gently-twinkling STARFIELD (seeded mulberry32, so a
 * capture is bit-exact). Two-axis eased rotation, perspective camera, ACES tone-map, gentle grade.
 *
 * Technique: analytic torus-knot centerline -> uniform hash-grid of tube segments -> per-pixel
 * sphere-trace of the tube SDF -> central-difference normal -> Phong (key+fill+spec) + soft shadow +
 * iteration AO + iridescence + Fresnel rim + additive specular bloom -> ACES tonemap over a vignette.
 *
 * Run: bun run packages/all/example/torus-knot.ts
 */
import { runDemo, Term, hsv, clamp, clamp01, lerp, smoothstep, aces, mulberry32, hash2, TAU } from './_term';

// ── Knot geometry ──────────────────────────────────────────────────────────────
const P = 2; // windings around the axis of symmetry
const Q = 3; // windings around the torus tube
const TUBE_R = 0.34; // glossy ribbon thickness (object space)
const SEG = 460; // centerline samples (the SDF tube is the union of these spheres-on-a-curve)

// Centerline sample positions (object space), built once.
const CX = new Float32Array(SEG);
const CY = new Float32Array(SEG);
const CZ = new Float32Array(SEG);

// Object-space bounding extent of the centerline (for grid + camera framing).
let OBJ_R = 1; // max |centerline| ; the surface reaches OBJ_R + TUBE_R

// ── Uniform spatial hash grid over the centerline (acceleration structure) ──────
// We bin each centerline sample into a coarse 3D grid so a distance query only
// scans the 3x3x3 neighbourhood of cells around the query point. Built once.
const GRID_N = 12; // cells per axis
const GRID_NN = GRID_N * GRID_N * GRID_N;
let GRID_MIN = -1.6; // world min of the grid box (cube)
let GRID_INV = 1; // 1 / cell size
// CSR (cell→samples) layout: cellStart[c]..cellStart[c+1] indexes into the
// cell-sorted, INTERLEAVED coordinate array PXYZ (x,y,z per sample). This packs
// each cell's samples contiguously so the SDF walk is a tight cache-friendly
// stride instead of a pointer-chasing linked list.
const cellStart = new Int32Array(GRID_NN + 1);
const PXYZ = new Float32Array(SEG * 3); // sorted by cell, interleaved xyz

const knotPos = (u: number, out: Float32Array, o: number): void => {
  const pu = P * u;
  const qu = Q * u;
  const r = 2 + Math.cos(qu);
  out[o] = r * Math.cos(pu);
  out[o + 1] = r * Math.sin(pu);
  out[o + 2] = Math.sin(qu);
};

const buildGeometry = (): void => {
  const tmp = new Float32Array(3);
  let maxr = 0;
  // Centerline radius ~3; rescale to ~1 so the camera framing is stable.
  const SCALE = 1 / 3;
  for (let i = 0; i < SEG; i++) {
    knotPos((i / SEG) * TAU, tmp, 0);
    const x = tmp[0] * SCALE,
      y = tmp[1] * SCALE,
      z = tmp[2] * SCALE;
    CX[i] = x;
    CY[i] = y;
    CZ[i] = z;
    const rr = Math.hypot(x, y, z);
    if (rr > maxr) maxr = rr;
  }
  OBJ_R = maxr;

  // Grid box: a cube comfortably containing the surface (centerline + tube).
  const half = maxr + TUBE_R + 0.05;
  GRID_MIN = -half;
  const cell = (2 * half) / GRID_N;
  GRID_INV = 1 / cell;

  // Per-sample cell index (temp), then counting-sort into CSR.
  const cellOf = new Int32Array(SEG);
  const counts = new Int32Array(GRID_NN);
  for (let i = 0; i < SEG; i++) {
    let gx = ((CX[i] - GRID_MIN) * GRID_INV) | 0;
    let gy = ((CY[i] - GRID_MIN) * GRID_INV) | 0;
    let gz = ((CZ[i] - GRID_MIN) * GRID_INV) | 0;
    if (gx < 0) gx = 0;
    else if (gx >= GRID_N) gx = GRID_N - 1;
    if (gy < 0) gy = 0;
    else if (gy >= GRID_N) gy = GRID_N - 1;
    if (gz < 0) gz = 0;
    else if (gz >= GRID_N) gz = GRID_N - 1;
    const c = (gz * GRID_N + gy) * GRID_N + gx;
    cellOf[i] = c;
    counts[c]++;
  }
  // Prefix sum → cellStart (exclusive); cellStart[GRID_NN] = SEG.
  let acc = 0;
  for (let c = 0; c < GRID_NN; c++) {
    cellStart[c] = acc;
    acc += counts[c];
  }
  cellStart[GRID_NN] = acc;
  // Scatter interleaved coords into cell-sorted order.
  const cursor = cellStart.slice(0, GRID_NN); // mutable write heads
  for (let i = 0; i < SEG; i++) {
    const c = cellOf[i];
    const dst = cursor[c]++;
    const o = dst * 3;
    PXYZ[o] = CX[i];
    PXYZ[o + 1] = CY[i];
    PXYZ[o + 2] = CZ[i];
  }
};

// ── Tube SDF: distance to the nearest centerline sample minus the tube radius ───
// Using a hash-grid 3x3x3 neighbourhood. To stay watertight when the query is far
// from any binned sample, we fall back to a conservative bound from the grid.
const tubeSDF = (x: number, y: number, z: number): number => {
  // Snapshot mutable module state into locals so V8 treats them as constants
  // for the duration of the (very hot) call and keeps the typed arrays unboxed.
  const gmin = GRID_MIN,
    ginv = GRID_INV;
  const N = GRID_N,
    Nm1 = N - 1;
  const start = cellStart,
    P3 = PXYZ;

  // Clamp the *search center* but remember we may be outside the box.
  let cx = ((x - gmin) * ginv) | 0;
  let cy = ((y - gmin) * ginv) | 0;
  let cz = ((z - gmin) * ginv) | 0;
  if (cx < 0) cx = 0;
  else if (cx > Nm1) cx = Nm1;
  if (cy < 0) cy = 0;
  else if (cy > Nm1) cy = Nm1;
  if (cz < 0) cz = 0;
  else if (cz > Nm1) cz = Nm1;

  let best = 1e9;
  // Expanding-ring search. Ring 1 scans the solid 3x3x3 box; each subsequent ring
  // scans ONLY the new outer shell — inner cells were already visited at a smaller
  // ring. Because each cell's samples are contiguous in PXYZ (CSR), a whole x-row
  // of cells is one flat sweep over [cellStart[row+x0], cellStart[row+x1+1]); no
  // per-cell lookup, no pointer chasing. Visited point set (and `best`) is the
  // same as the original solid-box linked-list scan.
  for (let ring = 1; ring <= N; ring++) {
    const x0 = cx - ring < 0 ? 0 : cx - ring;
    const x1 = cx + ring > Nm1 ? Nm1 : cx + ring;
    const y0 = cy - ring < 0 ? 0 : cy - ring;
    const y1 = cy + ring > Nm1 ? Nm1 : cy + ring;
    const z0 = cz - ring < 0 ? 0 : cz - ring;
    const z1 = cz + ring > Nm1 ? Nm1 : cz + ring;
    for (let iz = z0; iz <= z1; iz++) {
      const zBase = iz * N;
      const zEdge = iz - cz <= -ring || iz - cz >= ring; // this z-slice is a shell face
      for (let iy = y0; iy <= y1; iy++) {
        const rowBase = (zBase + iy) * N;
        const yEdge = iy - cy <= -ring || iy - cy >= ring;
        if (ring > 1 && !zEdge && !yEdge) {
          // Interior z/y slice of the shell: only the two x end-walls are new.
          const xa = cx - ring; // left wall (may be < x0 if clamped → skip)
          const xb = cx + ring; // right wall
          if (xa >= x0) {
            const c = rowBase + xa;
            for (let q = start[c] * 3, e = start[c + 1] * 3; q < e; q += 3) {
              const dx = x - P3[q], dy = y - P3[q + 1], dz = z - P3[q + 2];
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 < best) best = d2;
            }
          }
          if (xb <= x1 && xb !== xa) {
            const c = rowBase + xb;
            for (let q = start[c] * 3, e = start[c + 1] * 3; q < e; q += 3) {
              const dx = x - P3[q], dy = y - P3[q + 1], dz = z - P3[q + 2];
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 < best) best = d2;
            }
          }
          // Interior x range [x0 .. x1] already scanned at a smaller ring.
          continue;
        }
        // Full x-row (this slice is a shell face, or ring === 1): one flat sweep
        // over the contiguous CSR span covering cells [x0 .. x1].
        const q0 = start[rowBase + x0] * 3;
        const q1 = start[rowBase + x1 + 1] * 3;
        for (let q = q0; q < q1; q += 3) {
          const dx = x - P3[q], dy = y - P3[q + 1], dz = z - P3[q + 2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < best) best = d2;
        }
      }
    }
    // Once we have any candidate AND the ring boundary is farther than that
    // candidate, we can stop — nothing closer can live in an outer ring.
    if (best < 1e8) break;
  }
  return Math.sqrt(best) - TUBE_R;
};

// ── Starfield (deterministic) ───────────────────────────────────────────────────
let STARX!: Int32Array;
let STARY!: Int32Array;
let STARB!: Float32Array;
let STARTW!: Float32Array;
let N_STARS = 0;

const buildStars = (W: number, H: number): void => {
  N_STARS = Math.min(420, Math.floor((W * H) / 70));
  STARX = new Int32Array(N_STARS);
  STARY = new Int32Array(N_STARS);
  STARB = new Float32Array(N_STARS);
  STARTW = new Float32Array(N_STARS);
  const rnd = mulberry32(0x5eed1234);
  for (let i = 0; i < N_STARS; i++) {
    STARX[i] = (rnd() * W) | 0;
    STARY[i] = (rnd() * H) | 0;
    STARB[i] = 0.18 + rnd() * 0.85;
    STARTW[i] = rnd() * TAU;
  }
};

// Reusable scratch for the lit-pixel coordinates (for the bloom pass).
let SPEC_X!: Int32Array;
let SPEC_Y!: Int32Array;
let SPEC_I!: Float32Array;
let nSpec = 0;
// Bloom falloff LUT: a = exp(-d2*0.28) keyed by integer squared-distance d2.
// d2 ranges 0..R*R (R=4 → 16). Precomputed so the bloom pass needs no Math.exp;
// values are bit-identical to recomputing exp() with the same integer input.
const BLOOM_R = 4;
const BLOOM_EXP = new Float64Array(BLOOM_R * BLOOM_R + 1);
for (let d2 = 0; d2 <= BLOOM_R * BLOOM_R; d2++) BLOOM_EXP[d2] = Math.exp(-d2 * 0.28);
// Per-pixel hit mask (1=surface) and a snapshot of the rendered background, used
// by the edge anti-aliasing pass to soften the silhouette against what's behind it.
let HITMASK!: Uint8Array;
let BGSNAP!: Uint8Array;

runDemo({
  title: 'Torus Knot',
  hud: 'RAYMARCHED (2,3) KNOT * SOFT SHADOW * SPEC BLOOM * PURE TYPESCRIPT',
  captureT: 5,
  init: (t) => {
    buildGeometry();
    buildStars(t.W, t.H);
    SPEC_X = new Int32Array(t.W * t.H);
    SPEC_Y = new Int32Array(t.W * t.H);
    SPEC_I = new Float32Array(t.W * t.H);
    HITMASK = new Uint8Array(t.W * t.H);
    BGSNAP = new Uint8Array(t.W * t.H * 3);
  },
  frame: (t, time) => {
    const W = t.W,
      H = t.H;
    const buf = t.buf;

    // ── Background: designed radial vignette gradient (deep teal-indigo) ─────────
    const cxw = W * 0.5,
      cyw = H * 0.5;
    const invR = 1 / Math.hypot(cxw, cyw);
    const invR2 = invR * invR;
    // smoothstep(0, 1.15, rr): clamp01(rr/1.15) -> t*t*(3-2t), v = 1 - that.
    const sInv = 1 / 1.15;
    for (let y = 0; y < H; y++) {
      let o = y * W * 3;
      const dyp = (y - cyw) * invR;
      const dy2 = dyp * dyp;
      for (let x = 0; x < W; x++) {
        const dxp = (x - cxw);
        const rr = dxp * dxp * invR2 + dy2; // 0 center .. ~2 corners
        // a soft glow pool at center, falling to near-black at the edges
        let st = rr * sInv;
        if (st > 1) st = 1;
        const v = 1 - st * st * (3 - 2 * st); // 1 - smoothstep(0,1.15,rr)
        buf[o] = (5 + 9 * v) | 0;
        buf[o + 1] = (8 + 16 * v) | 0;
        buf[o + 2] = (14 + 26 * v) | 0;
        o += 3;
      }
    }
    // Stars (deterministic twinkle from sim time), behind the knot.
    for (let i = 0; i < N_STARS; i++) {
      const tw = 0.5 + 0.5 * Math.sin(time * 1.6 + STARTW[i]);
      const b = STARB[i] * tw;
      const v = (b * 150) | 0;
      t.addPixel(STARX[i], STARY[i], (v * 0.8) | 0, (v * 0.88) | 0, v);
      if (b > 0.78) {
        const g2 = (v * 0.3) | 0;
        t.addPixel(STARX[i] + 1, STARY[i], g2, g2, g2);
        t.addPixel(STARX[i] - 1, STARY[i], g2, g2, g2);
        t.addPixel(STARX[i], STARY[i] + 1, g2, g2, g2);
        t.addPixel(STARX[i], STARY[i] - 1, g2, g2, g2);
      }
    }
    // Snapshot the finished background so the edge-AA pass can blend the silhouette
    // against what's truly behind the knot (vignette + stars), not over itself.
    BGSNAP.set(buf);

    // ── Camera + two-axis eased rotation ────────────────────────────────────────
    // Eased angular drift (smooth, never linear-jittery): blend of slow harmonics.
    const ax = time * 0.45 + 0.25 * Math.sin(time * 0.21);
    const ay = time * 0.62 + 0.2 * Math.sin(time * 0.17 + 1.3);
    const sax = Math.sin(ax),
      cax = Math.cos(ax);
    const say = Math.sin(ay),
      cay = Math.cos(ay);

    // Camera looks down -Z from +CAM_Z. We march in OBJECT space by transforming
    // each ray (origin+dir) with the INVERSE rotation, which is just the transpose.
    // Pulled IN close so the knot is a bold sculptural presence filling the frame.
    const CAM_Z = 2.0;
    const aspect = t.aspect;
    // FOV tuned so the knot's bounding sphere fills ~80% of the SHORTER axis — a
    // bold, commanding sculptural presence — while keeping a clean ~10% margin on
    // every side. The (2,3) silhouette sweeps out to its full bounding-sphere reach
    // on essentially every frame, so this is the largest framing that never clips
    // the tube tips at any rotation or aspect ratio.
    const FOV = 1.128;

    // Inverse rotation (camera->object) is R^-1 = Ry(-ay) * Rx(-ax) applied to a
    // camera-space vector. We rotate by +ax/+ay forward; to go camera->object we
    // apply the transpose. Implemented inline per ray below.

    // ── Lighting setup (camera space) ───────────────────────────────────────────
    // Moving warm key light orbiting the knot.
    const klx = Math.cos(time * 0.8) * 0.85;
    const kly = 0.6 + 0.28 * Math.sin(time * 0.6);
    const klz = -0.9;
    let kll = Math.hypot(klx, kly, klz) || 1;
    const Lx = klx / kll,
      Ly = kly / kll,
      Lz = klz / kll;
    const [krr, kgg, kbb] = hsv(0.07 + 0.04 * Math.sin(time * 0.2), 0.4, 1);
    const keyR = krr / 255,
      keyG = kgg / 255,
      keyB = kbb / 255;
    // Cool sky fill from upper-left-back.
    const flx = -0.55,
      fly = 0.65,
      flz = 0.5;
    const fll = Math.hypot(flx, fly, flz);
    const Fx = flx / fll,
      Fy = fly / fll,
      Fz = flz / fll;
    const fillR = 0.26,
      fillG = 0.4,
      fillB = 0.66;

    // The light direction must be transformed to OBJECT space for shading, because
    // we shade with object-space normals. Camera->object = transpose of forward rot.
    // forward rot: v_cam = Ry(ay) * Rx(ax) * v_obj. So v_obj = Rx(-ax)*Ry(-ay)*v_cam.
    const toObj = (vx: number, vy: number, vz: number, out: Float32Array): void => {
      // Ry(-ay)
      const x1 = vx * cay - vz * say;
      const z1 = vx * say + vz * cay;
      const y1 = vy;
      // Rx(-ax)
      const y2 = y1 * cax + z1 * sax;
      const z2 = -y1 * sax + z1 * cax;
      out[0] = x1;
      out[1] = y2;
      out[2] = z2;
    };
    const oL = new Float32Array(3);
    toObj(Lx, Ly, Lz, oL);
    const oLx = oL[0],
      oLy = oL[1],
      oLz = oL[2];
    const oF = new Float32Array(3);
    toObj(Fx, Fy, Fz, oF);
    const oFx = oF[0],
      oFy = oF[1],
      oFz = oF[2];
    // View dir toward eye in camera space is +Z; in object space:
    const oV = new Float32Array(3);
    toObj(0, 0, 1, oV);
    const oVx = oV[0],
      oVy = oV[1],
      oVz = oV[2];
    // Half vector (key) in object space.
    let hx = oLx + oVx,
      hy = oLy + oVy,
      hz = oLz + oVz;
    const hl = Math.hypot(hx, hy, hz) || 1;
    hx /= hl;
    hy /= hl;
    hz /= hl;
    // Half vector (fill) — chrome reflects the cool sky, so a softer secondary
    // specular in the fill tint sells the metal far better than a single lobe.
    let hfx = oFx + oVx,
      hfy = oFy + oVy,
      hfz = oFz + oVz;
    const hfl = Math.hypot(hfx, hfy, hfz) || 1;
    hfx /= hfl;
    hfy /= hfl;
    hfz /= hfl;

    // Camera origin in object space: at (0,0,CAM_Z) in camera space.
    const oO = new Float32Array(3);
    toObj(0, 0, CAM_Z, oO);
    const box = OBJ_R + TUBE_R; // bounding sphere radius for the whole surface
    const box2 = box * box;

    // Surface reach for marching: don't march past the back of the bounding sphere.
    const projScale = (Math.min(W, H) * 0.5) / FOV;

    nSpec = 0;
    const EPS = 0.0035; // normal sampling epsilon
    const HIT = 0.004; // surface threshold
    const MAXI = 44;
    const ox = oO[0],
      oy = oO[1],
      oz = oO[2]; // ray origin (camera) in object space — same for all pixels

    // Shade a single object-space ray (already normalized). On a hit, writes the
    // linear (pre-tonemap) colour into `shadeOut` and returns the specular weight;
    // on a miss returns -1. Used by both the primary pass and the edge-AA pass.
    const shadeOut = new Float32Array(3);
    const shadeRay = (odx: number, ody: number, odz: number): number => {
      // Ray-sphere entry against the bounding sphere (centered at origin).
      const b = ox * odx + oy * ody + oz * odz;
      const c = ox * ox + oy * oy + oz * oz - box2;
      const disc = b * b - c;
      if (disc <= 0) return -1;
      const sq = Math.sqrt(disc);
      let tEnter = -b - sq;
      const tExit = -b + sq;
      if (tExit < 0) return -1;
      if (tEnter < 0) tEnter = 0;

      // Sphere-trace within [tEnter, tExit].
      let tt = tEnter;
      let hit = false;
      let iters = 0;
      for (; iters < MAXI; iters++) {
        const d = tubeSDF(ox + odx * tt, oy + ody * tt, oz + odz * tt);
        if (d < HIT) {
          hit = true;
          break;
        }
        tt += d * 0.92; // slight under-relax for the discrete-curve SDF
        if (tt > tExit) break;
      }
      if (!hit) return -1;

      // Hit point + central-difference normal.
      const hxp = ox + odx * tt;
      const hyp = oy + ody * tt;
      const hzp = oz + odz * tt;
      const dX = tubeSDF(hxp + EPS, hyp, hzp) - tubeSDF(hxp - EPS, hyp, hzp);
      const dY = tubeSDF(hxp, hyp + EPS, hzp) - tubeSDF(hxp, hyp - EPS, hzp);
      const dZ = tubeSDF(hxp, hyp, hzp + EPS) - tubeSDF(hxp, hyp, hzp - EPS);
      const nl = Math.hypot(dX, dY, dZ) || 1;
      const nxo = dX / nl,
        nyo = dY / nl,
        nzo = dZ / nl;

      // ── Soft shadow: penumbra march from the hit toward the key light ──────────
      let shadow = 1;
      {
        let st = 0.03;
        let ph = 1e9;
        const sox = hxp + nxo * 0.02,
          soy = hyp + nyo * 0.02,
          soz = hzp + nzo * 0.02;
        for (let s = 0; s < 14; s++) {
          const sd = tubeSDF(sox + oLx * st, soy + oLy * st, soz + oLz * st);
          if (sd < 0.001) {
            shadow = 0;
            break;
          }
          const y2 = (sd * sd) / (2 * ph);
          const dd = Math.sqrt(sd * sd - y2 * y2);
          const k = (14 * dd) / Math.max(0.0001, st - y2);
          if (k < shadow) shadow = k;
          ph = sd;
          st += Math.max(sd * 0.9, 0.02);
          if (st > 1.4) break;
        }
        if (shadow < 0) shadow = 0;
        else if (shadow > 1) shadow = 1;
      }

      // AO from march convergence (cheap iteration occlusion).
      const ao = clamp01(1 - iters / (MAXI * 0.85)) * 0.55 + 0.45;

      // ── Phong shading in object space ─────────────────────────────────────────
      let ndl = nxo * oLx + nyo * oLy + nzo * oLz;
      if (ndl < 0) ndl = 0;
      let ndf = nxo * oFx + nyo * oFy + nzo * oFz;
      if (ndf < 0) ndf = 0;
      let ndv = nxo * oVx + nyo * oVy + nzo * oVz;
      if (ndv < 0) ndv = 0;

      // Specular (Blinn-Phong) — a razor chrome glint riding a glossy broad sheen.
      // The mirror-tight lobe (~pow 96) is what makes it read as polished metal and
      // gives the highlight a crisp, jewel-like slide as the surface turns.
      let ndh = nxo * hx + nyo * hy + nzo * hz;
      if (ndh < 0) ndh = 0;
      const ndh2 = ndh * ndh;
      const ndh4 = ndh2 * ndh2;
      const ndh8 = ndh4 * ndh4;
      const ndh16 = ndh8 * ndh8;
      const ndh32 = ndh16 * ndh16;
      const specMirror = ndh32 * ndh32 * ndh32; // ~pow(ndh, 96) — sharp chrome star
      const specTight = ndh32; // ~pow(ndh, 32) — glossy core
      const specBroad = ndh8 * ndh2; // ~pow(ndh, 10) — soft sheen
      const specL = (specMirror * 1.5 + specTight + 0.3 * specBroad) * shadow;

      // Cool secondary specular from the sky-fill (no shadow term — soft ambient
      // reflection). A broad, gentle cool sheen plus its own sharper kick so the
      // metal catches the sky on the shadow side and never goes dead-flat.
      let ndhf = nxo * hfx + nyo * hfy + nzo * hfz;
      if (ndhf < 0) ndhf = 0;
      const ndhf2 = ndhf * ndhf;
      const ndhf4 = ndhf2 * ndhf2;
      const ndhf8 = ndhf4 * ndhf4;
      const specFill = (ndhf8 * ndhf4 + ndhf4 * ndhf4 * 0.5) * 0.7; // cool sheen + kick

      // Chrome-pearl albedo: a deep, refined teal that lifts toward a cooler steel
      // on grazing facing — a single restrained hue gliding gently, never a rainbow.
      const irid = 0.5 * nzo + 0.5 * ndv;
      const hue = 0.535 + 0.11 * irid + 0.035 * Math.sin(time * 0.3 + (hxp + hyp) * 1.3);
      let sat = 0.42 - 0.22 * (1 - ndv); // richer where it faces us, steely at the rim
      if (sat < 0.08) sat = 0.08;
      // Inlined hsv(hue, sat, 1) -> linear 0..1 (matches _term.hsv's |0 rounding
      // via the same *255|0 then /255 that the original code applied).
      let hh = hue - Math.floor(hue); // fract
      hh *= 6;
      const hi = hh | 0;
      const hf = hh - hi;
      const hvp = 1 - sat;
      const hvq = 1 - sat * hf;
      const hvt = 1 - sat * (1 - hf);
      let arr: number, agr: number, abr: number;
      switch (hi) {
        case 0: arr = 1; agr = hvt; abr = hvp; break;
        case 1: arr = hvq; agr = 1; abr = hvp; break;
        case 2: arr = hvp; agr = 1; abr = hvt; break;
        case 3: arr = hvp; agr = hvq; abr = 1; break;
        case 4: arr = hvt; agr = hvp; abr = 1; break;
        default: arr = 1; agr = hvp; abr = hvq; break;
      }
      const albR = ((arr * 255) | 0) / 255,
        albG = ((agr * 255) | 0) / 255,
        albB = ((abr * 255) | 0) / 255;

      // Fresnel: glossy rim that fattens the steel reflection toward the silhouette.
      const fr = 1 - ndv;
      const fr2 = fr * fr;
      const fres = fr2 * fr2; // pow(1-ndv, 4)
      // Crisper value separation: deeper ambient floor, punchier key, brighter spec.
      const kd = ndl * shadow;
      shadeOut[0] =
        (0.055 + keyR * kd * 2.1 + fillR * ndf * 0.9) * albR * ao + specL * keyR * 3.6 + specFill * fillR * 2.0 + fres * 0.4;
      shadeOut[1] =
        (0.085 + keyG * kd * 2.1 + fillG * ndf * 0.9) * albG * ao + specL * keyG * 3.6 + specFill * fillG * 2.0 + fres * 0.58;
      shadeOut[2] =
        (0.15 + keyB * kd * 2.1 + fillB * ndf * 0.9) * albB * ao + specL * keyB * 3.6 + specFill * fillB * 2.0 + fres * 0.9;
      return specL;
    };

    // ── Primary pass: 1 ray/pixel. Record hit colour + a hit mask for edge AA. ──
    // We build each pixel's object-space ray direction once and cache it (the
    // edge-AA pass reuses these directions for the sub-sample offsets).
    const invProjA = aspect / projScale;
    const invProj = 1 / projScale;
    const px2cam = (px: number): number => (px - cxw) * invProjA;
    const py2cam = (py: number): number => (cyw - py) * invProj;
    // Object-space ray dir = cxs*Bx + cys*By - Bz (linear in the camera ray),
    // then normalize. Bx/By/Bz are the rotated camera basis axes (computed once
    // per frame), so the per-pixel cost is 9 MACs + one normalize — no rotation.
    const Bxx = cay,
      Bxy = say * sax,
      Bxz = say * cax;
    const Byy = cax,
      Byz = -sax;
    const Bzx = -say,
      Bzy = cay * sax,
      Bzz = cay * cax;
    const dirOut = new Float32Array(3);
    const camToObjDir = (cxs: number, cys: number): void => {
      const dx = cxs * Bxx - Bzx;
      const dy = cxs * Bxy + cys * Byy - Bzy;
      const dz = cxs * Bxz + cys * Byz - Bzz;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz);
      dirOut[0] = dx * inv;
      dirOut[1] = dy * inv;
      dirOut[2] = dz * inv;
    };

    for (let py = 0; py < H; py++) {
      const cys = py2cam(py);
      const rowOff = py * W * 3;
      const maskRow = py * W;
      for (let px = 0; px < W; px++) {
        camToObjDir(px2cam(px), cys);
        const sp = shadeRay(dirOut[0], dirOut[1], dirOut[2]);
        if (sp < 0) {
          HITMASK[maskRow + px] = 0;
          continue;
        }
        HITMASK[maskRow + px] = 1;
        let lr = shadeOut[0],
          lg = shadeOut[1],
          lb = shadeOut[2];
        // Inline ACES tonemap (matches _term.aces exactly) then *255|0.
        lr = (lr * (2.51 * lr + 0.03)) / (lr * (2.43 * lr + 0.59) + 0.14);
        lg = (lg * (2.51 * lg + 0.03)) / (lg * (2.43 * lg + 0.59) + 0.14);
        lb = (lb * (2.51 * lb + 0.03)) / (lb * (2.43 * lb + 0.59) + 0.14);
        const o = rowOff + px * 3;
        buf[o] = ((lr < 0 ? 0 : lr > 1 ? 1 : lr) * 255) | 0;
        buf[o + 1] = ((lg < 0 ? 0 : lg > 1 ? 1 : lg) * 255) | 0;
        buf[o + 2] = ((lb < 0 ? 0 : lb > 1 ? 1 : lb) * 255) | 0;
        if (sp > 0.18) {
          SPEC_X[nSpec] = px;
          SPEC_Y[nSpec] = py;
          SPEC_I[nSpec] = sp;
          nSpec++;
        }
      }
    }

    // ── Edge anti-aliasing: re-sample only silhouette pixels (a hit pixel touching
    //    a miss, or vice-versa). Cast 4 jittered sub-rays, average, and blend over
    //    whatever is already there (surface colour or background). O(perimeter). ──
    const SS = 0.5; // sub-pixel offset in pixels (rotated grid)
    // Two diagonal sub-samples (rotated-grid 2x) — hoisted out of the hot loop.
    const JX0 = -SS,
      JX1 = SS,
      JY0 = SS,
      JY1 = -SS;
    const inv3 = 1 / 3;
    for (let py = 1; py < H - 1; py++) {
      const rowOff = py * W * 3;
      const maskRow = py * W;
      for (let px = 1; px < W - 1; px++) {
        const here = HITMASK[maskRow + px];
        // boundary test: any 4-neighbour differs from this pixel's hit state
        if (
          here === HITMASK[maskRow + px - 1] &&
          here === HITMASK[maskRow + px + 1] &&
          here === HITMASK[maskRow - W + px] &&
          here === HITMASK[maskRow + W + px]
        )
          continue;

        let sr = 0,
          sg = 0,
          sb = 0;
        const bo = (maskRow + px) * 3;
        // The centre sample is whatever the primary pass produced (surface colour
        // for a hit pixel, else the background); reuse it as one of three taps.
        if (here) {
          const o0 = rowOff + px * 3;
          sr += buf[o0] / 255;
          sg += buf[o0 + 1] / 255;
          sb += buf[o0 + 2] / 255;
        } else {
          sr += BGSNAP[bo] / 255;
          sg += BGSNAP[bo + 1] / 255;
          sb += BGSNAP[bo + 2] / 255;
        }
        // Two diagonal sub-samples (rotated-grid 2x) — enough to soften the stair.
        for (let k = 0; k < 2; k++) {
          camToObjDir(px2cam(px + (k === 0 ? JX0 : JX1)), py2cam(py + (k === 0 ? JY0 : JY1)));
          const sp = shadeRay(dirOut[0], dirOut[1], dirOut[2]);
          if (sp >= 0) {
            sr += aces(shadeOut[0]);
            sg += aces(shadeOut[1]);
            sb += aces(shadeOut[2]);
          } else {
            sr += BGSNAP[bo] / 255;
            sg += BGSNAP[bo + 1] / 255;
            sb += BGSNAP[bo + 2] / 255;
          }
        }
        const o = rowOff + px * 3;
        buf[o] = (sr * inv3 * 255) | 0;
        buf[o + 1] = (sg * inv3 * 255) | 0;
        buf[o + 2] = (sb * inv3 * 255) | 0;
      }
    }

    // ── Additive specular bloom: soft warm halos over the brightest glints ──────
    // A wider, gentler falloff sells the polished-chrome glints as real light
    // catching the metal as it turns — bright core, long soft skirt.
    for (let i = 0; i < nSpec; i++) {
      const sx = SPEC_X[i],
        sy = SPEC_Y[i];
      const inten = (SPEC_I[i] - 0.2) * 1.85;
      const br = keyR * inten,
        bg = keyG * inten,
        bb = keyB * inten;
      const R = BLOOM_R;
      const R2 = R * R;
      for (let dy = -R; dy <= R; dy++) {
        const dy2 = dy * dy;
        for (let dx = -R; dx <= R; dx++) {
          const d2 = dx * dx + dy2;
          if (d2 > R2) continue;
          const a = BLOOM_EXP[d2];
          t.addPixel(sx + dx, sy + dy, (br * a * 165) | 0, (bg * a * 165) | 0, (bb * a * 165) | 0);
        }
      }
    }
  },
});
