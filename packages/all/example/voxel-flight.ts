/**
 * Voxel Flight — fly forever over an infinite procedural world, the classic
 * Comanche "voxel-space" terrain engine reborn in pure TypeScript in your terminal.
 *
 * No triangles, no z-buffer, no GPU. Each screen COLUMN is its own little ray cast
 * straight out across a procedural heightmap: starting at the camera and marching
 * AWAY along the ground, at every step we sample a tiled fBm height+colour field,
 * project that ground point's height to a screen row, and — because we walk
 * FRONT-TO-BACK while keeping a per-column "highest pixel drawn so far" y-buffer —
 * we only ever paint the slice of column that rises ABOVE everything nearer the
 * camera. That single occlusion trick gives correct hidden-surface removal for an
 * entire landscape in O(cols × steps), and lets the march bail the instant a column
 * is full. Step size GROWS with distance (denser sampling up close, coarse far away)
 * so the cost stays flat no matter how far the horizon recedes.
 *
 * The world is an endless, seamless fBm island field (value-noise octaves, wrapped
 * on a power-of-two LUT so it tiles invisibly), shaded once per cell into a baked
 * colour LUT: a golden-hour gradient by altitude — wet sand → saturated grass →
 * bare rock → snow caps — pre-lit by a low warm sun (heightfield-gradient diffuse +
 * a soft cloud-shadow field) so the per-frame march is a pure table lookup. Distance
 * melts every column into an atmospheric haze that matches the sky, behind which a
 * painted dusk gradient, a bloomed sun disk and a banded horizon glow sit. The whole
 * frame is graded and ACES-tonemapped for a warm, non-clipping flight-sim look.
 *
 * Interactive: WASD / arrows fly (forward, back, strafe), the MOUSE looks (yaw +
 * pitch), the WHEEL changes altitude, SHIFT boosts. With no input it flies itself —
 * a smooth banking auto-pilot that banks into its turns — and hands control over the
 * instant you touch it, resuming the tour after a few idle seconds.
 *
 * Technique: Comanche voxel-space column raycasting · seamless tiled fBm height+
 *   colour LUT · per-column y-buffer occlusion (front-to-back) · distance-growing
 *   step · baked sun + cloud-shadow lighting · altitude colour ramp · atmospheric
 *   fog to a painted dusk sky · bloomed sun disk · ACES grade.
 *
 * Run: bun run packages/all/example/voxel-flight.ts
 */
import { runDemo, Term, clamp, clamp01, lerp, smoothstep, fract, aces } from './_term';

// ── Ordered dither (8×8 Bayer) ──────────────────────────────────────────────────
// 24-bit output banding shows up badly in the wide, smooth sky + haze gradients of a
// golden-hour scene. A tiny ordered-dither offset added before the 8-bit quantize
// breaks the bands into clean stipple for free (one LUT read + add per pixel). The
// matrix is stored pre-centred to [-0.5,0.5) and scaled to one quantization step.
const BAYER_N = 8;
const BAYER = new Float32Array(BAYER_N * BAYER_N);
{
  const base = [
    0, 32, 8, 40, 2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37,
    63, 31, 55, 23, 61, 29, 53, 21,
  ];
  for (let i = 0; i < 64; i++) BAYER[i] = (base[i] + 0.5) / 64 - 0.5;
}

// ── World map: a seamless, tiled fBm height + baked colour field ────────────────
// MAP is a power-of-two grid that the camera roams over forever; sampling wraps with
// a bitmask so there are no seams. Everything heavy (noise octaves, lighting, colour
// ramp) is BAKED here once in init so the per-frame raycast is pure table lookups.
const MAP_BITS = 10;                 // 1024×1024 world cells
const MAP_N = 1 << MAP_BITS;
const MAP_MASK = MAP_N - 1;
const HMAP = new Float32Array(MAP_N * MAP_N);     // height 0..1 (near, crisp)
// A heavily-smoothed copy of the heightfield used for DISTANT terrain. Far ranges seen
// edge-on compress dozens of ridges into a few rows where every local max projects to a
// 1-px picket "tooth"; bilinearly blending the sampled height toward this low-pass copy
// as distance grows melts those teeth into clean rolling skylines (a height LOD), and is
// effectively free — one extra read + lerp per march step.
const HMAP_FAR = new Float32Array(MAP_N * MAP_N);
const CMAP_R = new Uint8Array(MAP_N * MAP_N);     // baked lit colour
const CMAP_G = new Uint8Array(MAP_N * MAP_N);
const CMAP_B = new Uint8Array(MAP_N * MAP_N);

// Sun: a low, warm golden-hour key light. Direction is in world XZ + up.
const SUN_DIR_X = -0.62, SUN_DIR_Y = 0.34, SUN_DIR_Z = -0.70; // toward the sun
const SUN_LEN = Math.hypot(SUN_DIR_X, SUN_DIR_Y, SUN_DIR_Z);
const SLX = SUN_DIR_X / SUN_LEN, SLY = SUN_DIR_Y / SUN_LEN, SLZ = SUN_DIR_Z / SUN_LEN;
// Sun appears on screen along the world heading toward SUN_DIR (used for the sky/disk).
const SUN_AZ = Math.atan2(SUN_DIR_Z, SUN_DIR_X);

// ── Value-noise + fBm used only at bake time (not in the hot loop) ──────────────
const vmix = (h: number): number => {
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
// 2D value noise on the periodic lattice `period` (so the whole field tiles).
const vnoise2 = (x: number, y: number, period: number): number => {
  const xi = Math.floor(x), yi = Math.floor(y);
  let fx = x - xi, fy = y - yi;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const x0 = ((xi % period) + period) % period;
  const y0 = ((yi % period) + period) % period;
  const x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
  const hx0 = Math.imul(x0, 374761393), hx1 = Math.imul(x1, 374761393);
  const hy0 = Math.imul(y0, 668265263), hy1 = Math.imul(y1, 668265263);
  const c00 = vmix(hx0 ^ hy0), c10 = vmix(hx1 ^ hy0);
  const c01 = vmix(hx0 ^ hy1), c11 = vmix(hx1 ^ hy1);
  const a = c00 + (c10 - c00) * fx;
  const b = c01 + (c11 - c01) * fx;
  return a + (b - a) * fy;
};
// Tiled fBm over MAP_N, base feature controlled by `basePeriod` (cells across the
// map at octave 0). Higher octaves wrap on proportionally larger lattice periods so
// the sum stays perfectly periodic across the map edge. `ridged` folds each octave
// into a sharp ridge (1-|2n-1|) for mountain crests.
const fbmTiled = (x: number, y: number, basePeriod: number, octaves: number, ridged: boolean): number => {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let o = 0; o < octaves; o++) {
    const period = basePeriod * freq;
    let n = vnoise2((x / MAP_N) * period, (y / MAP_N) * period, period);
    if (ridged) { n = 1 - Math.abs(2 * n - 1); n = n * n; }
    sum += amp * n;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
};

// ── Baked altitude colour ramp (golden-hour): sand → grass → rock → snow ────────
// Returns un-lit base albedo for a normalized height h∈[0,1] into `albedo`.
const albedo = [0, 0, 0];
const sampleAlbedo = (h: number, jitter: number): void => {
  let r: number, g: number, b: number;
  if (h < 0.30) {
    // deep teal → shallow turquoise → wet sand. A deeper, more saturated open-water
    // teal reads unmistakably as WATER in the valleys (not just dark ground), brightening
    // through a tropical turquoise on the shallows before the warm beach lip.
    const k = h / 0.30;
    r = lerp(0.020, 0.58, smoothstep(0.6, 1.0, k));
    g = lerp(0.135, 0.66, smoothstep(0.36, 1.0, k));
    b = lerp(0.34, 0.56, k);
    if (k > 0.86) { // bright beach lip
      const s = smoothstep(0.86, 1.0, k);
      r = lerp(r, 0.85, s); g = lerp(g, 0.74, s); b = lerp(b, 0.49, s);
    }
  } else if (h < 0.52) {
    const k = (h - 0.30) / 0.22; // golden sand → lush saturated grass (a touch deeper)
    r = lerp(0.87, 0.15, k); g = lerp(0.74, 0.55, k); b = lerp(0.47, 0.11, k);
  } else if (h < 0.72) {
    const k = (h - 0.52) / 0.20; // grass → warm rock (deeper green dips to ochre rock)
    r = lerp(0.15, 0.53, k); g = lerp(0.55, 0.43, k); b = lerp(0.11, 0.31, k);
  } else if (h < 0.86) {
    const k = (h - 0.72) / 0.14; // rock → snowline (cool grey lift)
    r = lerp(0.51, 0.68, k); g = lerp(0.45, 0.68, k); b = lerp(0.35, 0.74, k);
  } else {
    const k = (h - 0.86) / 0.14; // snow — brilliant, faintly cool caps that crown the peaks
    r = lerp(0.78, 1.0, k); g = lerp(0.80, 1.0, k); b = lerp(0.88, 1.0, k);
  }
  // Per-cell texture jitter (deterministic) so flats aren't dead-uniform. Kept LOW
  // amplitude: heavy per-cell jitter is what dithers the flats into speckle that the
  // column raycaster smears into streaks, so a tight band keeps materials clean.
  const j = 0.92 + jitter * 0.12;
  albedo[0] = clamp01(r * j);
  albedo[1] = clamp01(g * j);
  albedo[2] = clamp01(b * j);
};

let mapBuilt = false;
const buildMap = (): void => {
  if (mapBuilt) return;
  mapBuilt = true;
  // First pass: dramatic but COHERENT mountainous heights. A broad continent fBm sets
  // the base landmass + seas; ridged fBm carves bold mountain crests that ride on top
  // where the continent is already high; a little fine detail roughens the surface.
  // The goal is legible rolling ranges and valleys (not a comb of razor-thin spikes),
  // so the ridge field is broad-scaled and lightly powered, and a smoothing pass below
  // erases the highest spatial frequencies that read as per-column noise when flown.
  for (let y = 0; y < MAP_N; y++) {
    for (let x = 0; x < MAP_N; x++) {
      // continents: 8 large rolling features across the map
      const cont = fbmTiled(x, y, 8, 5, false);
      // ridged mountains at a BROADER scale → wide massifs, not a comb of needles.
      // Fewer octaves on the ridge keeps the highest spatial frequencies (the thin
      // pickets) out of the crest, so ranges read as rounded shoulders.
      const ridge = fbmTiled(x + 137.5, y - 61.3, 7, 3, true);
      // a second, slightly finer ridge folded in only on the highest massifs adds the
      // odd sharp summit without speckling the whole field with teeth
      const ridge2 = fbmTiled(x - 211.7, y + 88.4, 13, 2, true);
      // fine roughness, very subtle (texture only — the silhouette stays smooth)
      const detail = fbmTiled(x - 9.1, y + 33.7, 36, 2, false);
      // Mountains only swell where the continent is already elevated → coastal plains
      // stay low, interiors rise into rounded ranges.
      const massif = smoothstep(0.38, 0.82, cont);
      const summit = smoothstep(0.62, 0.92, cont); // only the tallest land gets sharp tops
      let h = cont * 0.62 + ridge * massif * 0.44 + ridge2 * summit * 0.16 + (detail - 0.5) * 0.018;
      // Expand contrast for deep seas + clean shores, but keep land relief ROLLING:
      // no peak-sharpening gamma (that made needles); a mild lowland flattening keeps
      // valleys broad while ranges read as big rounded shoulders.
      h = clamp01((h - 0.20) * 1.45);
      // gentle S-curve: lowlands ease flatter, highlands ease toward a plateau cap.
      h = smoothstep(0.0, 1.0, h) * 0.5 + h * 0.5;
      HMAP[y * MAP_N + x] = clamp01(h);
    }
  }
  // Smoothing pass: a separable 5-tap blur (toroidal wrap) over the LAND only. This
  // knocks out the single-cell height jitter that projected into thin vertical pickets
  // while preserving the broad silhouette of ranges and valleys. Water is left crisp
  // so coastlines stay sharp. Three light passes for a soft, rounded relief.
  {
    const tmp = new Float32Array(MAP_N * MAP_N);
    const w0 = 0.34, w1 = 0.24, w2 = 0.09; // normalized 5-tap (0.34+2*0.24+2*0.09=1)
    for (let pass = 0; pass < 5; pass++) {
      // horizontal
      for (let y = 0; y < MAP_N; y++) {
        const r = y * MAP_N;
        for (let x = 0; x < MAP_N; x++) {
          const c = HMAP[r + x];
          if (c < 0.30) { tmp[r + x] = c; continue; } // keep shorelines/seas crisp
          const xm2 = (x - 2) & MAP_MASK, xm1 = (x - 1) & MAP_MASK;
          const xp1 = (x + 1) & MAP_MASK, xp2 = (x + 2) & MAP_MASK;
          tmp[r + x] = c * w0 + (HMAP[r + xm1] + HMAP[r + xp1]) * w1 + (HMAP[r + xm2] + HMAP[r + xp2]) * w2;
        }
      }
      // vertical
      for (let y = 0; y < MAP_N; y++) {
        const r = y * MAP_N;
        const ym2 = ((y - 2) & MAP_MASK) * MAP_N, ym1 = ((y - 1) & MAP_MASK) * MAP_N;
        const yp1 = ((y + 1) & MAP_MASK) * MAP_N, yp2 = ((y + 2) & MAP_MASK) * MAP_N;
        for (let x = 0; x < MAP_N; x++) {
          const c = tmp[r + x];
          if (c < 0.30) { HMAP[r + x] = c; continue; }
          HMAP[r + x] = c * w0 + (tmp[ym1 + x] + tmp[yp1 + x]) * w1 + (tmp[ym2 + x] + tmp[yp2 + x]) * w2;
        }
      }
    }
  }
  // Second pass: bake lighting (heightfield-gradient diffuse + cloud shadow) and the
  // altitude colour ramp into the colour LUT. World height in pixels = h*HSCALE,
  // matched by the per-frame projection.
  for (let y = 0; y < MAP_N; y++) {
    const yn = y * MAP_N;
    const ym = ((y - 1) & MAP_MASK) * MAP_N;
    const yp = ((y + 1) & MAP_MASK) * MAP_N;
    for (let x = 0; x < MAP_N; x++) {
      const xm = (x - 1) & MAP_MASK;
      const xp = (x + 1) & MAP_MASK;
      const h = HMAP[yn + x];
      // Surface normal from the height gradient (world up = +y). HSCALE controls how
      // tall the terrain stands; the bake uses the same factor as projection (HSCALE).
      const dhx = (HMAP[yn + xp] - HMAP[yn + xm]) * HSCALE * 0.5;
      const dhz = (HMAP[yp + x] - HMAP[ym + x]) * HSCALE * 0.5;
      // normal = normalize(-dhx, 1, -dhz)
      let nx = -dhx, ny = 1, nz = -dhz;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      let ndl = nx * SLX + ny * SLY + nz * SLZ;
      if (ndl < 0) ndl = 0;
      // Soften the terminator so light wraps a touch onto shaded faces (golden-hour key
      // is broad, not a hard lambert edge) — keeps shadowed slopes coloured, not black.
      ndl = ndl * 0.82 + Math.sqrt(ndl) * 0.18;
      // Cloud shadow: a soft, large-scale tiled fBm field dims sunlit ground.
      const cloud = fbmTiled(x + 400, y - 250, 6, 4, false);
      const cloudShadow = lerp(1.0, 0.62, smoothstep(0.50, 0.80, cloud));
      // Cheap large-scale ambient occlusion: valleys (below the local mean height) sit
      // in their own soft shade, ridges catch a little extra sky — adds depth & reads
      // as real relief instead of flat noise. Uses a wide height sample as the datum.
      const hNbr = (HMAP[yn + xm] + HMAP[yn + xp] + HMAP[ym + x] + HMAP[yp + x]) * 0.25;
      const ao = clamp01(0.78 + (h - hNbr) * 6.0); // concave→darker, convex→brighter
      // Baked colour.
      const jit = fract(Math.sin((x * 12.9898 + y * 78.233)) * 43758.5453);
      sampleAlbedo(h, jit);
      // Lighting: a punchy warm golden-hour key over a cool sky ambient + a faint warm
      // bounce on lit ground. Low ambient keeps colour saturated; AO models the relief.
      const sunWarmR = 1.94, sunWarmG = 1.22, sunWarmB = 0.56;
      // Cool dusk-sky fill in shadow: a touch more blue lift so shaded slopes read as
      // cool-shadowed relief (sky-lit) rather than crushing to dead black on backlit
      // faces — adds depth without bleaching the saturated sunlit midtones.
      const ambR = 0.155, ambG = 0.225, ambB = 0.44;
      const lit = ndl * cloudShadow;
      let r = albedo[0] * (ambR * ao + sunWarmR * lit);
      let g = albedo[1] * (ambG * ao + sunWarmG * lit);
      let b = albedo[2] * (ambB * ao + sunWarmB * lit);
      // Warm rim on the brightest sunlit ridges → a golden edge that pops the skyline.
      if (lit > 0.58) {
        const rim = (lit - 0.58) * 2.15;
        r += rim * 0.40; g += rim * 0.23; b += rim * 0.05;
      }
      // Slope-facing-sun amber bounce on grass/rock: warms the mid-lit faces so the
      // land glows golden-hour rather than reading flat olive in the midtones.
      if (h >= 0.30 && lit > 0.25 && lit <= 0.58) {
        const warm = (lit - 0.25) * 0.55;
        r += warm * 0.14; g += warm * 0.07;
      }
      // Water: add a flat specular sky tint + dampen the sun term (it's nearly flat),
      // plus a warm sun-glitter where the near-flat surface points at the low sun.
      if (h < 0.30) {
        const w = smoothstep(0.30, 0.0, h);
        r = lerp(r, r * 0.66 + 0.05, w);
        g = lerp(g, g * 0.66 + 0.10, w);
        b = lerp(b, b * 0.66 + 0.22, w);
        const glit = Math.pow(clamp01(ny * SLY + nx * SLX + nz * SLZ), 24) * w;
        r += glit * 0.9; g += glit * 0.62; b += glit * 0.28;
      }
      const i = yn + x;
      CMAP_R[i] = (clamp01(aces(r)) * 255) | 0;
      CMAP_G[i] = (clamp01(aces(g)) * 255) | 0;
      CMAP_B[i] = (clamp01(aces(b)) * 255) | 0;
    }
  }
  // Build HMAP_FAR: a wide separable low-pass of the final height (toroidal wrap) used
  // as the distant-LOD height. A 7-tap blur run several passes rolls the skyline so far
  // ranges read as soft massifs, not a comb of pickets. Land only — seas stay flat.
  {
    const tmp = new Float32Array(MAP_N * MAP_N);
    HMAP_FAR.set(HMAP);
    const a0 = 0.24, a1 = 0.20, a2 = 0.12, a3 = 0.06; // 7-tap (0.24+2*.20+2*.12+2*.06=1)
    for (let pass = 0; pass < 4; pass++) {
      for (let y = 0; y < MAP_N; y++) {
        const r = y * MAP_N;
        for (let x = 0; x < MAP_N; x++) {
          const xm3 = (x - 3) & MAP_MASK, xm2 = (x - 2) & MAP_MASK, xm1 = (x - 1) & MAP_MASK;
          const xp1 = (x + 1) & MAP_MASK, xp2 = (x + 2) & MAP_MASK, xp3 = (x + 3) & MAP_MASK;
          tmp[r + x] = HMAP_FAR[r + x] * a0
            + (HMAP_FAR[r + xm1] + HMAP_FAR[r + xp1]) * a1
            + (HMAP_FAR[r + xm2] + HMAP_FAR[r + xp2]) * a2
            + (HMAP_FAR[r + xm3] + HMAP_FAR[r + xp3]) * a3;
        }
      }
      for (let y = 0; y < MAP_N; y++) {
        const r = y * MAP_N;
        const ym3 = ((y - 3) & MAP_MASK) * MAP_N, ym2 = ((y - 2) & MAP_MASK) * MAP_N, ym1 = ((y - 1) & MAP_MASK) * MAP_N;
        const yp1 = ((y + 1) & MAP_MASK) * MAP_N, yp2 = ((y + 2) & MAP_MASK) * MAP_N, yp3 = ((y + 3) & MAP_MASK) * MAP_N;
        for (let x = 0; x < MAP_N; x++) {
          HMAP_FAR[r + x] = tmp[r + x] * a0
            + (tmp[ym1 + x] + tmp[yp1 + x]) * a1
            + (tmp[ym2 + x] + tmp[yp2 + x]) * a2
            + (tmp[ym3 + x] + tmp[yp3 + x]) * a3;
        }
      }
    }
  }
};

// ── Vertical scale: world height (in screen-pixel-equivalent units) per height unit.
// Tuned so ranges rise as broad rolling massifs (not towering needles) and still
// break the horizon at cruise altitude.
const HSCALE = 340;

// ── Camera state (persists; mutated by input + autopilot) ───────────────────────
const cam = {
  x: 512, z: 512,        // world position
  yaw: 0,                // heading (radians)
  pitch: 0,              // look up/down, expressed as a horizon offset in pixels
  height: 220,           // altitude above height=0 datum
  roll: 0,               // banking (visual only — shears the horizon)
};
let camInit = false;
const resetCam = (): void => {
  cam.x = 775; cam.z = 667; cam.yaw = SUN_AZ - 0.5; cam.pitch = -10; cam.height = 320; cam.roll = 0;
  camInit = true;
};

// ── Input bookkeeping ───────────────────────────────────────────────────────────
const keys = { w: false, s: false, a: false, d: false, up: false, dn: false, lf: false, rt: false, boost: false };
let lastInputT = -1e9;          // sim-time of last user input
let lastMouseSeq = -1;
let lastMouseX = -1, lastMouseY = -1;
let userControlled = false;
const ATTRACT_IDLE = 3.0;       // seconds of idle before attract resumes

// ── Horizontal supersampling (SSAA) ─────────────────────────────────────────────
// Each screen column is an INDEPENDENT ray, so neighbouring columns sample different
// world cells and bake slightly different lit colours → vertical pinstripe/comb
// streaking that the bilateral low-pass softens but can't erase. The fix: render the
// whole scene (sky + terrain + low-pass + skyline feather) into an INTERNAL buffer at
// SS× the horizontal column density, then box-average adjacent columns down into the
// engine's display buffer. We're literally rendering at the resolution that already
// looks clean (a ~300-wide render reads great at 160-wide) and averaging down, so the
// 160-wide output gets that clean render for free. Vertical density is unchanged (the
// aliasing is purely horizontal). All scratch (sbuf/ybuf/ytopF/rowSrc) is sized to the
// RENDER width and allocated only when W changes — never in the hot loop.
const SS = 2;                          // horizontal supersample factor
// Internal render buffer (RGB, RW×H) the whole pipeline draws into before downsample.
let sbuf!: Uint8Array;
let sbufLen = 0;
// Per-column y-buffer (top-most painted row per column); allocated/resized lazily.
// `ytopF` carries the sub-pixel screen row of each column's silhouette crest so the
// skyline can be feathered (anti-aliased) in a single clean post-pass. Both are sized
// to the RENDER width (RW = SS*W), one entry per supersampled column.
let ybuf!: Int32Array;
let ytopF!: Float32Array;
let ybufW = 0;
// Scratch row used by the cross-column slope low-pass: one source copy of a pixel row
// so the edge-aware horizontal blur reads un-blurred neighbours (no feedback smear).
let rowSrc!: Uint8Array;
let rowSrcW = 0;

// Sky gradient LUT, rebuilt when H changes; baked dusk sky from zenith → horizon.
// Stored as LINEAR (pre-ACES) radiance; the painter tonemaps. The horizon band is a
// muted hazy peach (NOT blown out) so distant terrain melting into it stays legible.
let SKY_R!: Float32Array, SKY_G!: Float32Array, SKY_B!: Float32Array;
// Fog target = a soft hazy blue-grey (linear). Distance melts terrain into THIS,
// then the same colour feeds the lowest sky band so ground and sky meet seamlessly.
const FOG_LR = 0.43, FOG_LG = 0.49, FOG_LB = 0.62;
let skyH = 0;
const buildSky = (H: number): void => {
  if (skyH === H && SKY_R) return;
  skyH = H;
  SKY_R = new Float32Array(H); SKY_G = new Float32Array(H); SKY_B = new Float32Array(H);
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1); // 0 top (zenith), 1 bottom (below horizon)
    const ts = smoothstep(0.0, 1.0, t);
    // Deep dusk indigo zenith → a soft violet shoulder → desaturated steel blue. A
    // gentle gamma on the climb keeps the upper third a rich, saturated indigo (the
    // dome reads as real high atmosphere) before it opens out toward the hazy horizon.
    const tg = Math.pow(ts, 0.82);
    let r = lerp(0.035, 0.30, tg);
    let g = lerp(0.065, 0.37, tg);
    let b = lerp(0.27, 0.50, tg);
    // A faint cool zenith lift — the last light of the sky dome, just off the deepest
    // indigo — gives the top band dimension instead of a dead flat cap.
    const zenith = Math.exp(-(t * t) * 7.5);
    r += zenith * 0.018; g += zenith * 0.030; b += zenith * 0.060;
    // Rosy violet shoulder mid-sky: warm anti-solar scatter that gives the dusk its
    // depth. Slightly wider + warmer than before so the band reads as a real glow.
    const violet = Math.exp(-((t - 0.40) * (t - 0.40)) * 24);
    r += violet * 0.115; g += violet * 0.030; b += violet * 0.075;
    // Blend the lower sky toward the hazy fog colour + a warm horizon lift, so the sky
    // meets the foggy distance in the same hue (no hard seam, no blowout). A stronger,
    // warmer band just above the horizon reads as scattered golden-hour light.
    const low = smoothstep(0.42, 1.0, t);
    r = lerp(r, FOG_LR + 0.24, low);
    g = lerp(g, FOG_LG + 0.09, low);
    b = lerp(b, FOG_LB - 0.05, low);
    const warmBand = smoothstep(0.78, 1.0, t); // hot peach right at the horizon
    r = lerp(r, 0.94, warmBand * 0.47);
    g = lerp(g, 0.58, warmBand * 0.47);
    b = lerp(b, 0.39, warmBand * 0.47);
    SKY_R[y] = r; SKY_G[y] = g; SKY_B[y] = b;
  }
};

const onKey = (key: string, t: number): void => {
  void t;
  lastInputT = simTimeRef.v;
  userControlled = true;
  switch (key) {
    case 'w': keys.w = true; setReleaseTimer('w'); break;
    case 's': keys.s = true; setReleaseTimer('s'); break;
    case 'a': keys.a = true; setReleaseTimer('a'); break;
    case 'd': keys.d = true; setReleaseTimer('d'); break;
    case 'up': keys.up = true; setReleaseTimer('up'); break;
    case 'down': keys.dn = true; setReleaseTimer('dn'); break;
    case 'left': keys.lf = true; setReleaseTimer('lf'); break;
    case 'right': keys.rt = true; setReleaseTimer('rt'); break;
    case 'shift': keys.boost = true; setReleaseTimer('boost'); break;
  }
};
// Terminals send key REPEATS, not press/release. We latch a key as "held" and clear
// it shortly after the last repeat — so continuous WASD reads as continuous motion.
const releaseTimers: Record<string, number> = {};
const setReleaseTimer = (k: keyof typeof keys): void => {
  releaseTimers[k] = simTimeRef.v + 0.18;
};
const expireKeys = (now: number): void => {
  for (const k in releaseTimers) {
    if (now >= releaseTimers[k]) keys[k as keyof typeof keys] = false;
  }
};

// A tiny boxed reference so onKey (defined before frame) can read sim time.
const simTimeRef = { v: 0 };

const frame = (t: Term, time: number, dt: number, _frameNo: number): void => {
  simTimeRef.v = time;
  buildMap();
  if (!camInit) resetCam();
  const W = t.W, H = t.H, buf = t.buf;
  // Render width: the supersampled column count the whole pipeline below works in. The
  // engine display buffer `buf` stays W wide; we box-average RW→W at the end.
  const RW = SS * W;
  buildSky(H);
  if (ybufW !== RW) {
    ybuf = new Int32Array(RW);
    ytopF = new Float32Array(RW);
    ybufW = RW;
  }
  if (rowSrcW !== RW) { rowSrc = new Uint8Array(RW * 3); rowSrcW = RW; }
  if (sbufLen !== RW * H * 3) { sbuf = new Uint8Array(RW * H * 3); sbufLen = RW * H * 3; }

  // ── Input → camera (live mode only; capture/bench never sees input) ────────────
  // Detect fresh mouse movement to claim control.
  if (t.mouseActive && (t.mouseSeq !== lastMouseSeq)) {
    if (lastMouseX >= 0) {
      const dxm = t.mouseX - lastMouseX;
      const dym = t.mouseY - lastMouseY;
      cam.yaw += dxm * 0.0055;
      cam.pitch = clamp(cam.pitch - dym * 1.6, -H * 0.55, H * 0.9);
      if (Math.abs(dxm) > 0 || Math.abs(dym) > 0) { userControlled = true; lastInputT = time; }
    }
    lastMouseX = t.mouseX; lastMouseY = t.mouseY;
    lastMouseSeq = t.mouseSeq;
  }
  if (t.wheel !== 0) {
    cam.height = clamp(cam.height + t.wheel * 22, 40, 900);
    t.wheel = 0; userControlled = true; lastInputT = time;
  }
  expireKeys(time);

  // Attract handoff: if the user hasn't touched anything for a while, fly the tour.
  const attract = !userControlled || (time - lastInputT) > ATTRACT_IDLE;

  if (attract) {
    // Smooth banking auto-pilot. The heading wanders so the sun sits QUARTERING off to
    // one side — its golden disk + horizon glow stay near a frame edge while the near
    // ranges catch warm side-light (never a flat backlit silhouette). Deterministic.
    const turn = 0.30 * Math.sin(time * 0.13) + 0.14 * Math.sin(time * 0.37 + 1.1);
    // Hero-peak seek: sample the heightfield across a forward arc at a near-mid look-
    // ahead and bias the heading toward the TALLEST ground there. That parks a big
    // foreground massif dead ahead so the frame reads as a hero peak with the rest of
    // the ranges receding behind it (parallax depth) — instead of a flat featureless
    // crossing. Sampled on the deterministic map, so capture/bench see it identically.
    let bestBear = 0, bestH = -1;
    for (let s = -2; s <= 2; s++) {
      const bear = cam.yaw + s * 0.26;
      const sx = cam.x + Math.cos(bear) * 470;
      const sz = cam.z + Math.sin(bear) * 470;
      const gh = HMAP[(Math.floor(sz) & MAP_MASK) * MAP_N + (Math.floor(sx) & MAP_MASK)];
      if (gh > bestH) { bestH = gh; bestBear = s * 0.26; }
    }
    // Keep the seek GENTLE and centred on the sun-quartering target so the sky/sun win
    // is never lost; the bias only nudges the heading toward the nearest hero massif.
    const targetYaw = SUN_AZ - 0.5 + turn + bestBear * 0.45;
    // ease yaw toward the serpentine target; derivative drives the visual roll
    const dyaw = (targetYaw - cam.yaw);
    cam.yaw += dyaw * Math.min(1, dt * 1.9);
    cam.roll = clamp(-dyaw * 9.0, -0.5, 0.5);
    // forward cruise
    const speed = 90;
    cam.x += Math.cos(cam.yaw) * speed * dt;
    cam.z += Math.sin(cam.yaw) * speed * dt;
    // altitude: a cruise high enough to look DOWN onto the ranges (so they read as
    // rolling lit relief, not a wall of edge-on teeth) yet low enough that the framed
    // hero peak rises boldly into the foreground. Slightly lower than before so near
    // ridges layer in front of the receding skyline. Gently breathes for a living feel.
    const baseAlt = 232 + 64 * Math.sin(time * 0.21 + 0.6);
    cam.height = lerp(cam.height, baseAlt, Math.min(1, dt * 0.8));
    // gentle look-down: horizon sits in the upper third, leaving a generous sky with
    // the sun + glow; the extra pitch reveals the layered ridges below the skyline.
    cam.pitch = lerp(cam.pitch, -0.085 * t.H + 0.024 * t.H * Math.sin(time * 0.17), Math.min(1, dt * 1.5));
  } else {
    // ── Manual flight ──
    const boost = keys.boost ? 2.2 : 1;
    const speed = 95 * boost;
    let fwd = 0, strafe = 0;
    if (keys.w || keys.up) fwd += 1;
    if (keys.s || keys.dn) fwd -= 1;
    if (keys.d || keys.rt) strafe += 1;
    if (keys.a || keys.lf) strafe -= 1;
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    cam.x += (cy * fwd - sy * strafe) * speed * dt;
    cam.z += (sy * fwd + cy * strafe) * speed * dt;
    // gently relax visual roll back to level when not auto-banking
    cam.roll = lerp(cam.roll, strafe * 0.18, Math.min(1, dt * 4));
  }

  // Terrain following with LOOK-AHEAD: lift the camera above the highest ground both
  // beneath it and a short way along the heading, so we crest oncoming ridges instead
  // of punching into a peak. Cheap: a handful of bilinear height taps.
  {
    const hx = Math.cos(cam.yaw), hz = Math.sin(cam.yaw);
    let maxGround = 0;
    for (let s = 0; s <= 4; s++) {
      const look = s * 70;                     // 0,70,…,280 world units ahead
      const gx = cam.x + hx * look, gz = cam.z + hz * look;
      const gxf = Math.floor(gx), gzf = Math.floor(gz);
      const fx = gx - gxf, fz = gz - gzf;
      const ax = gxf & MAP_MASK, az = gzf & MAP_MASK;
      const bx = (ax + 1) & MAP_MASK, bz = (az + 1) & MAP_MASK;
      const r0 = az * MAP_N, r1 = bz * MAP_N;
      const g00 = HMAP[r0 + ax], g10 = HMAP[r0 + bx];
      const g01 = HMAP[r1 + ax], g11 = HMAP[r1 + bx];
      const ga = g00 + (g10 - g00) * fx, gb = g01 + (g11 - g01) * fx;
      const gh = (ga + (gb - ga) * fz) * HSCALE;
      // weight nearer samples a touch more so a far spike doesn't overcorrect
      const gw = gh - s * 6;
      if (gw > maxGround) maxGround = gw;
    }
    const minClear = maxGround + 95;
    if (cam.height < minClear) cam.height = minClear;
  }

  // ── Build the painted sky + sun + horizon glow into the framebuffer ───────────
  // Horizon screen row: center + pitch, with a banking roll shear applied per column.
  const horizonY = H * 0.5 + cam.pitch;
  // The sun's screen column comes from the angle between camera yaw and the sun azim.
  // FOV: half-angle the columns span. A flight-sim-ish ~70° horizontal.
  const FOV = 1.18;                       // total horizontal field of view (radians)
  const halfFov = FOV * 0.5;
  // relative bearing of the sun (−π..π), wrapped
  let sunBearing = SUN_AZ - cam.yaw;
  while (sunBearing > Math.PI) sunBearing -= 2 * Math.PI;
  while (sunBearing < -Math.PI) sunBearing += 2 * Math.PI;
  const sunOnScreen = Math.abs(sunBearing) < halfFov + 0.30;
  // All screen-X quantities below live in the supersampled RENDER width (RW columns).
  const sunScreenX = RW * 0.5 + (sunBearing / halfFov) * (RW * 0.5);
  const sunScreenY = horizonY - 0.15 * H; // sun a touch higher so it clears the ridgeline
  const rollTan = Math.tan(cam.roll);
  // Disk radius scales with the frame so the sun reads the same at any resolution.
  const sunR = H * 0.052;
  const sunRInner = H * 0.040;

  // Paint each render column's sky with the roll-sheared horizon, sun disk + glow.
  for (let x = 0; x < RW; x++) {
    const xd = x / SS;                         // display-space column position
    const colShear = (xd - W * 0.5) * rollTan; // bank shears the horizon (display units)
    const horiz = horizonY + colShear;
    // Sun glow/disk geometry is tuned in DISPLAY pixels, so map the render-space column
    // delta back to display units (/SS) — the sun stays the same size + round at any SS.
    const dxs = (x - sunScreenX) / SS;
    const dxs2 = dxs * dxs;
    // A narrow vertical light pillar reflected up/down from the disk — a classic
    // low-sun "sun pillar". Falls off fast horizontally, slow vertically.
    const pillar = sunOnScreen ? Math.exp(-dxs2 * 0.010) : 0;
    let o = x * 3;
    const bx = (x & 7) * BAYER_N;
    for (let y = 0; y < H; y++) {
      // sky gradient anchored so the warm horizon band (bottom of the LUT) lands on
      // this column's horizon row; above it climbs back into the indigo zenith.
      const gi = clamp((y - horiz + H * 0.92) | 0, 0, H - 1);
      let r = SKY_R[gi], g = SKY_G[gi], b = SKY_B[gi];
      if (sunOnScreen) {
        // sun glow + disk (additive in linear space, before fog/terrain overwrite)
        const dys = y - sunScreenY;
        const dys2 = dys * dys;
        const d2 = dxs2 + dys2 * 2.0; // squash vertically a touch
        const dist = Math.sqrt(d2);
        // broad, soft, warm horizon glow band (wide hazy halo around the whole sun)
        const glow = Math.exp(-d2 * 0.00034);
        r += glow * 0.78; g += glow * 0.44; b += glow * 0.18;
        // mid bloom — golden-hour flare ring, warmer than the broad glow
        const bloom = Math.exp(-d2 * 0.0021);
        r += bloom * 1.18; g += bloom * 0.70; b += bloom * 0.24;
        // tight inner bloom — the hot lemon-white throat just outside the disc
        const core = Math.exp(-d2 * 0.0120);
        r += core * 1.7; g += core * 1.42; b += core * 0.86;
        // sun pillar: a soft vertical shaft of warm light through the disk
        const shaft = pillar * Math.exp(-dys2 * 0.00050);
        r += shaft * 0.40; g += shaft * 0.26; b += shaft * 0.10;
        // bright disk: a hot lemon-gold core that cools to amber at the limb so the
        // sun reads as a real golden-hour sun, not a flat white blob.
        const disk = smoothstep(sunR, sunRInner, dist);
        if (disk > 0) {
          const limb = clamp01(dist / sunR);        // 0 centre → 1 rim
          const warm = limb * limb;                 // amber pools at the edge
          r += disk * (3.4 - warm * 0.4);
          g += disk * (2.7 - warm * 1.1);
          b += disk * (1.6 - warm * 1.3);
        }
      }
      // Ordered dither breaks the smooth sky/haze into clean stipple (one Bayer read
      // scaled to a quantization step ≈ 1/255 in tonemapped space).
      const d = BAYER[bx + (y & 7)] * (1.4 / 255);
      sbuf[o] = (clamp01(aces(r) + d) * 255 + 0.5) | 0;
      sbuf[o + 1] = (clamp01(aces(g) + d) * 255 + 0.5) | 0;
      sbuf[o + 2] = (clamp01(aces(b) + d) * 255 + 0.5) | 0;
      o += RW * 3;
    }
  }

  // ── Voxel-space column raycast ────────────────────────────────────────────────
  // Reset the y-buffer: each column starts able to draw down to the very bottom.
  ybuf.fill(H);

  // Camera ray fan: each column's world-space heading is a lerp between the two FOV
  // edges. We march that ray in world XZ from near to far, projecting each sampled
  // ground point to a screen row and filling the column down to the y-buffer top.
  const leftA = cam.yaw - halfFov, rightA = cam.yaw + halfFov;
  const dirLX = Math.cos(leftA), dirLZ = Math.sin(leftA);
  const dirRX = Math.cos(rightA), dirRZ = Math.sin(rightA);

  // Projection scale: a ground point at distance `z` and world height `wh` projects to
  // screen row = horizon - (wh - cam.height) / z * PSCALE.
  const PSCALE = H * 0.85;
  const Z_NEAR = 8;
  const Z_FAR = 1400;
  const Z_SPAN = Z_FAR - Z_NEAR;
  // Height-LOD blend: 0 near (full crisp HMAP) → 1 far (full low-pass HMAP_FAR). Beyond
  // LOD_FAR the skyline is fully the soft copy, so distant ranges roll instead of bristle.
  const LOD_NEAR = 260, LOD_FAR = 760;
  const LOD_SPAN = LOD_FAR - LOD_NEAR;

  // Aerial-perspective haze. Distance melts terrain into a haze that is COOL blue-grey
  // away from the sun and warms toward a golden glow on the sunward side — true
  // golden-hour atmosphere, not a flat grey wall. Computed per column from the sun
  // bearing so the hot horizon sits behind the sun disk. Linear, tonemapped at fill.
  const HAZE_COOL_R = FOG_LR, HAZE_COOL_G = FOG_LG, HAZE_COOL_B = FOG_LB;
  const HAZE_WARM_R = 0.92, HAZE_WARM_G = 0.62, HAZE_WARM_B = 0.40;

  // Drifting cloud shadows (for SCALE): a slow, large-scale analytic field (sum of a
  // few sines in world XZ) sweeps across the ground over time, dimming patches a little.
  // Cheap (no noise calls — two sines and a product per march step), deterministic (pure
  // world-coord + `time`), and additive to the baked static cloud bake so the patches
  // actually MOVE, reading as drifting overcast cells that sell the size of the land.
  const cloudPhX = time * 7.0, cloudPhZ = time * 4.0; // shadows drift downwind
  const CLOUD_S1 = 0.0042, CLOUD_S2 = 0.0027;          // two spatial scales
  // Water sun-glitter drift: two phases advance the interference pattern over time so
  // the sparkle crests crawl across the swell (faster than the cloud drift, since light
  // glints flicker). Pure functions of `time` → deterministic in capture/bench.
  const glitPh = time * 1.9, glitPh2 = time * 1.35;

  for (let x = 0; x < RW; x++) {
    const tcol = x / (RW - 1);
    // world-space ray direction for this column (lerp the two FOV edges, renorm).
    // RW columns span the same FOV as W did, just at SS× density → the supersampling.
    let rdx = lerp(dirLX, dirRX, tcol);
    let rdz = lerp(dirLZ, dirRZ, tcol);
    const rl = Math.hypot(rdx, rdz) || 1;
    rdx /= rl; rdz /= rl;
    const colShear = (x / SS - W * 0.5) * rollTan; // display-space bank shear
    const horiz = horizonY + colShear;

    // Per-column haze tint: warm toward the sun azimuth, cool away (squared falloff).
    // Column bearing relative to the sun is the FOV-linear offset from the already-known
    // sun bearing — no per-column atan2 needed (keeps the column loop cheap).
    let db = sunBearing - (tcol - 0.5) * FOV;
    if (db > Math.PI) db -= 2 * Math.PI; else if (db < -Math.PI) db += 2 * Math.PI;
    const kk = clamp01(1 - Math.abs(db) / 1.1);
    const sunw = kk * kk;
    const fogLR = lerp(HAZE_COOL_R, HAZE_WARM_R, sunw);
    const fogLG = lerp(HAZE_COOL_G, HAZE_WARM_G, sunw);
    const fogLB = lerp(HAZE_COOL_B, HAZE_WARM_B, sunw);
    const fogR = (clamp01(aces(fogLR)) * 255) | 0;
    const fogG = (clamp01(aces(fogLG)) * 255) | 0;
    const fogB = (clamp01(aces(fogLB)) * 255) | 0;

    let ytop = ybuf[x]; // lowest row still paintable (start at bottom)
    let z = Z_NEAR;
    let dz = 0.7;       // finer near step (less undersampling near the camera)
    const o0 = x * 3;

    while (z < Z_FAR && ytop > 0) {
      const wx = cam.x + rdx * z;
      const wz = cam.z + rdz * z;
      // Bilinear height (smooth silhouette → no jaggy voxel stair-stepping) but a
      // NEAREST colour lookup (crisp material boundaries). The 2× extra height reads
      // are cheap next to the occlusion fill they feed.
      const wxf = Math.floor(wx), wzf = Math.floor(wz);
      const fx = wx - wxf, fz = wz - wzf;
      const ix0 = wxf & MAP_MASK, iz0 = wzf & MAP_MASK;
      const ix1 = (ix0 + 1) & MAP_MASK, iz1 = (iz0 + 1) & MAP_MASK;
      const r0 = iz0 * MAP_N, r1 = iz1 * MAP_N;
      const h00 = HMAP[r0 + ix0], h10 = HMAP[r0 + ix1];
      const h01 = HMAP[r1 + ix0], h11 = HMAP[r1 + ix1];
      const ha = h00 + (h10 - h00) * fx, hb = h01 + (h11 - h01) * fx;
      let hn = ha + (hb - ha) * fz;                 // normalized height 0..1 (crisp)
      // Distant LOD: blend toward the low-pass heightfield so far skylines roll instead
      // of bristling into 1-px teeth. Only sampled past LOD_NEAR (near loop stays cheap).
      if (z > LOD_NEAR) {
        const f00 = HMAP_FAR[r0 + ix0], f10 = HMAP_FAR[r0 + ix1];
        const f01 = HMAP_FAR[r1 + ix0], f11 = HMAP_FAR[r1 + ix1];
        const fa = f00 + (f10 - f00) * fx, fb = f01 + (f11 - f01) * fx;
        const hf = fa + (fb - fa) * fz;
        const lod = clamp01((z - LOD_NEAR) / LOD_SPAN);
        hn += (hf - hn) * lod;
      }
      const hgt = hn * HSCALE;                       // world height in screen units
      const mi = r0 + ix0;                          // nearest cell for colour
      // project: how high above the camera this point appears (keep the float for the
      // sub-pixel silhouette feather applied after the column march).
      const projYf = horiz - ((hgt - cam.height) / z) * PSCALE;
      const projY = projYf | 0;
      if (projY < ytop) {
        // Aerial perspective: haze accumulates with distance, but the haze layer is
        // shallow, so tall ridges poke up through thinner air and stay clearer than
        // distant lowlands — a depth cue that separates layered ranges. Capped below 1
        // so far ground keeps colour + texture instead of melting into a flat band.
        const fog = (z - Z_NEAR) / Z_SPAN;
        const clearTops = 1 - smoothstep(0.46, 0.86, hn) * 0.42; // high land de-hazes
        const fogA = fog * fog * 0.84 * clearTops;
        let cr = CMAP_R[mi], cg = CMAP_G[mi], cb = CMAP_B[mi];
        if (fogA < 0.62) {
          if (hn >= 0.30) {
            // Drifting cloud shadow: dim near/mid LAND in slow-moving large-scale cells.
            // Skipped once haze dominates (far ground) — the dimming would be invisible
            // there and the gate keeps the deep-far steps cheap. Shadow only darkens.
            const cf = Math.sin((wx + cloudPhX) * CLOUD_S1) * Math.sin((wz - cloudPhZ) * CLOUD_S1)
                     + 0.6 * Math.sin((wx - cloudPhZ) * CLOUD_S2 + 1.7) * Math.sin((wz + cloudPhX) * CLOUD_S2 - 0.9);
            // cf ∈ [-1.6,1.6]; shade only the troughs into soft overcast patches.
            const shade = 1 - 0.22 * smoothstep(0.15, 0.95, cf) * (1 - fogA);
            cr = (cr * shade) | 0; cg = (cg * shade) | 0; cb = (cb * shade) | 0;
          } else {
            // Animated sun-glitter on WATER (the one flat element). A high-frequency
            // interference of two sines in world XZ, DRIFTING with `time`, sharpened to
            // thin crests by a power → a field of tiny moving sparkles riding the swell.
            // Concentrated on the sunward side (sunw) where a real low-sun reflection
            // pools, and only where the surface is near-flat (deepest water reads calm).
            // Warm/gold additive, faded by fog. Deterministic: world-coord + time only.
            const calm = smoothstep(0.30, 0.20, hn);           // glints on open water, not the sand lip
            const sw = Math.sin((wx * 0.090 + wz * 0.052) + glitPh)
                     * Math.sin((wz * 0.084 - wx * 0.041) - glitPh2);
            let spark = sw * 0.5 + 0.5;                          // 0..1
            spark *= spark; spark *= spark;                     // ^4 → thin bright crests
            const gl = spark * (0.30 + 0.70 * sunw) * calm * (1 - fogA);
            cr = cr + (gl * 150) | 0;
            cg = cg + (gl * 116) | 0;
            cb = cb + (gl * 66) | 0;
            if (cr > 255) cr = 255; if (cg > 255) cg = 255; if (cb > 255) cb = 255;
          }
        }
        // Fill the vertical slice [projY, ytop) for this column.
        const top = projY < 0 ? 0 : projY;
        const ia = 1 - fogA;
        // Per-slice dither offset (Bayer keyed on column & crest row) decorrelates the
        // fog banding across neighbouring columns without a per-pixel LUT read.
        const dd = BAYER[(x & 7) * BAYER_N + (top & 7)] * 1.4;
        const rI = clamp((cr * ia + fogR * fogA + dd) | 0, 0, 255);
        const gI = clamp((cg * ia + fogG * fogA + dd) | 0, 0, 255);
        const bI = clamp((cb * ia + fogB * fogA + dd) | 0, 0, 255);
        for (let y = top; y < ytop; y++) {
          const o = o0 + y * RW * 3;
          sbuf[o] = rI; sbuf[o + 1] = gI; sbuf[o + 2] = bI;
        }
        ytop = top;
        ytopF[x] = projYf; // sub-pixel crest row (highest fill wins → the silhouette)
      }
      z += dz;
      dz += 0.020 * dz; // exponential step growth keeps far cost flat
    }
    ybuf[x] = ytop;
  }

  // ── Cross-column slope low-pass (edge-aware) ──────────────────────────────────
  // Each column is an independent ray, so neighbouring columns sample slightly
  // different world cells and bake slightly different lit colours; on filled slope
  // BODIES that reads as faint vertical streaking running down the face. A gentle
  // 5-tap horizontal blur over terrain pixels only (never sky — gated by the per-
  // column crest in ybuf) smooths those streaks. It is BILATERAL: each neighbour's
  // weight collapses across a large luma jump, so crisp material lines (shore, snow,
  // shadow terminator) and the skyline silhouette stay sharp — soften, never mush.
  // Reads from a per-row source snapshot so the blur never feeds back on itself.
  {
    let minTop = H;
    for (let x = 0; x < RW; x++) { const tp = ybuf[x]; if (tp < minTop) minTop = tp; }
    if (minTop < 0) minTop = 0;
    // 5-tap normalized weights (centre-heavy) and an edge threshold in luma units.
    const W0 = 0.40, W1 = 0.22, W2 = 0.08; // 0.40 + 2*0.22 + 2*0.08 = 1.0
    const EDGE = 26;                         // luma Δ above which a neighbour is dropped
    // SSAA does the real anti-aliasing now (the RW→W box-average below), so this
    // bilateral pass only needs to take the edge off any residual streak — a lighter
    // blend than before keeps the mountains CRISP instead of mushing them.
    const STR = 0.52;                        // blend strength toward the smoothed value
    const rowBuf = rowSrc;
    for (let y = minTop; y < H; y++) {
      const base = y * RW * 3;
      // snapshot this row's pixels so neighbour reads are un-blurred
      rowBuf.set(sbuf.subarray(base, base + RW * 3));
      for (let x = 0; x < RW; x++) {
        if (y < ybuf[x]) continue;            // sky pixel in this column — leave it
        const o = base + x * 3;
        const cr = rowBuf[x * 3], cg = rowBuf[x * 3 + 1], cb = rowBuf[x * 3 + 2];
        const cl = cr * 0.299 + cg * 0.587 + cb * 0.114;
        let wsum = W0, ar = cr * W0, ag = cg * W0, ab = cb * W0;
        // unrolled ±1, ±2 taps, each gated on being terrain + a soft bilateral falloff
        for (let s = 1; s <= 2; s++) {
          const wk = s === 1 ? W1 : W2;
          // left
          const xl = x - s;
          if (xl >= 0 && y >= ybuf[xl]) {
            const j = xl * 3;
            const lr = rowBuf[j], lg = rowBuf[j + 1], lb = rowBuf[j + 2];
            const dl = Math.abs(lr * 0.299 + lg * 0.587 + lb * 0.114 - cl);
            const w = wk * (dl >= EDGE ? 0 : 1 - dl / EDGE);
            wsum += w; ar += lr * w; ag += lg * w; ab += lb * w;
          }
          // right
          const xr = x + s;
          if (xr < RW && y >= ybuf[xr]) {
            const j = xr * 3;
            const rr = rowBuf[j], rg = rowBuf[j + 1], rb = rowBuf[j + 2];
            const dr = Math.abs(rr * 0.299 + rg * 0.587 + rb * 0.114 - cl);
            const w = wk * (dr >= EDGE ? 0 : 1 - dr / EDGE);
            wsum += w; ar += rr * w; ag += rg * w; ab += rb * w;
          }
        }
        const inv = STR / wsum, keep = 1 - STR;
        sbuf[o] = (cr * keep + ar * inv) | 0;
        sbuf[o + 1] = (cg * keep + ag * inv) | 0;
        sbuf[o + 2] = (cb * keep + ab * inv) | 0;
      }
    }
  }

  // ── Skyline anti-alias (single clean pass) ─────────────────────────────────────
  // Each render column's silhouette crest sits at a sub-pixel row; feather just that
  // ONE boundary row by blending the terrain top toward the sky directly above it by
  // the crest's sub-pixel coverage. One row per column = a continuous soft edge, never
  // the stray dots a per-step blend produces.
  for (let x = 0; x < RW; x++) {
    const top = ybuf[x];
    if (top <= 0 || top >= H) continue;           // crest off the top / no terrain
    const cov = 1 - (ytopF[x] - top);             // fractional coverage of the top cell
    if (cov >= 0.97 || cov <= 0.03) continue;     // already aligned to the grid
    const o = x * 3 + top * RW * 3;
    const sk = o - RW * 3;                          // sky pixel directly above the crest
    const ic = 1 - cov;
    sbuf[o] = (sbuf[o] * cov + sbuf[sk] * ic) | 0;
    sbuf[o + 1] = (sbuf[o + 1] * cov + sbuf[sk + 1] * ic) | 0;
    sbuf[o + 2] = (sbuf[o + 2] * cov + sbuf[sk + 2] * ic) | 0;
  }

  // ── Horizontal box-downsample RW → W (the SSAA resolve) ───────────────────────
  // Average each group of SS supersampled columns into one display column. This is
  // where the vertical pinstripe streaking dies: the per-column ray-sampling noise is
  // averaged across SS neighbouring rays, exactly as a high-width render reads clean.
  // Vertical resolution is untouched (the aliasing was purely horizontal). Integer
  // math, one pass over the display buffer, no per-frame allocation.
  for (let y = 0; y < H; y++) {
    const srcRow = y * RW * 3;
    const dstRow = y * W * 3;
    for (let x = 0; x < W; x++) {
      let sr = 0, sg = 0, sb = 0;
      const s0 = srcRow + x * SS * 3;
      for (let k = 0; k < SS; k++) {
        const j = s0 + k * 3;
        sr += sbuf[j]; sg += sbuf[j + 1]; sb += sbuf[j + 2];
      }
      const o = dstRow + x * 3;
      buf[o] = (sr / SS) | 0;
      buf[o + 1] = (sg / SS) | 0;
      buf[o + 2] = (sb / SS) | 0;
    }
  }
};

runDemo({
  title: 'Voxel Flight',
  hud: 'WASD/ARROWS FLY - MOUSE LOOK - WHEEL ALTITUDE - SHIFT BOOST',
  captureT: 6,
  mouse: true,
  targetFps: 60,
  init: () => { buildMap(); resetCam(); userControlled = false; lastInputT = -1e9; lastMouseSeq = -1; lastMouseX = -1; lastMouseY = -1; },
  frame,
});
