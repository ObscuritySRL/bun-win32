/**
 * chromascii — a real-time, full-colour ASCII 3D renderer pushed to the limit.
 *
 * Every CELL is a tiny raymarcher. A gallery of CLEAN, ICONIC 3D solids — a
 * SPHERE (planet), a TORUS (donut), a (2,3) TORUS KNOT, a ROUNDED CUBE and the
 * CLAUDE SPARK — is shown one at a time on a slow turntable and cycled with a
 * brief eased dissolve between them, so the subject is always instantly
 * recognisable instead of an abstract morphing blob. The selected SDF is
 * sphere-traced with bounded steps, shaded by three CHROMATIC lights (warm amber
 * key, cool teal fill, magenta rim) against the surface normal, supersampled 2×2
 * only on edges, then resolved to a fine luminance→glyph density ramp. A Sobel
 * pass over the resolved luminance finds silhouettes and creases and OVERLAYS
 * directional line glyphs (/ \ | - _ ( )) for an inked-contour engraving. Each
 * cell's colour is the actual lit RGB of the three lights — per-channel
 * ACES-tonemapped, then its hue/saturation are read back out of that RGB so a
 * teal-lit face reads teal and a magenta rim reads magenta. The form sits in a
 * soft radial colour pool so it never floats in a dead-black void, under a large
 * shape LABEL and a one-line subtitle.
 *
 * LIVE: drag rotates the camera, wheel zooms, [ ] cycle the glyph ramp, p/P cycle
 * the colour palette, e toggles the contour ink, n/N (or ←/→) change the shape.
 * ATTRACT: a slow turntable that auto-cycles the gallery, so a capture always
 * lands on a fully shaded, contoured, multicoloured, RECOGNISABLE solid.
 */
import { CharTerm, runText } from '@bun-win32/terminal';
import type { RGB } from '@bun-win32/terminal';

import { aces, clamp01, hsv, smoothstep } from './_kit';

// ── Glyph density ramps (dark → bright). Cycled with [ ]. ────────────────────────
const RAMPS: string[] = [
  ' .:-=+*#%@',
  ' .,:;irsXA253hMHGS#9B&@',
  ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  ' ░▒▓█',
  ' .oO0@',
];
const RAMP_CODE: Int32Array[] = RAMPS.map((s) => {
  const a = new Int32Array(s.length);
  let i = 0;
  for (const c of s) a[i++] = c.codePointAt(0) ?? 32;
  return a.subarray(0, i);
});

// Directional contour glyphs indexed by quantised gradient angle (0..7 = 8 dirs).
const EDGE_BY_DIR: number[] = [
  0x007c, // | vertical edge (grad horizontal)
  0x002f, // / diagonal
  0x005f, // _ horizontal-ish low
  0x005c, // \ diagonal
  0x007c, // |
  0x002f, // /
  0x002d, // - horizontal edge (grad vertical)
  0x005c, // \
];
const PAREN_L = 0x0028; // (
const PAREN_R = 0x0029; // )

// Quantise a 2D gradient (gx,gy) to one of 8 octants WITHOUT atan2 — pure sign +
// magnitude comparisons. Same index that round(atan2(gy,gx)/45°)&7 would return.
const TAN225 = 0.41421356;
const TAN675 = 2.41421356;
// Narrower axis bands for the OUTER silhouette only, so a gently-curving top run
// resolves to flowing diagonals instead of a mechanical -/_ ruler.
const TAN1125 = 0.19891237;
const TAN7875 = 5.02733949;
const octantBands = (gx: number, gy: number, tlo: number, thi: number): number => {
  const ax = gx < 0 ? -gx : gx;
  const ay = gy < 0 ? -gy : gy;
  let band: number;
  if (ay <= ax * tlo) band = 0;
  else if (ay <= ax * thi) band = 1;
  else band = 2;
  if (gx >= 0) {
    if (gy >= 0) return band; // 0,1,2
    return band === 0 ? 0 : band === 1 ? 7 : 6; // x+,y-  → 0/7/6
  }
  if (gy >= 0) return band === 0 ? 4 : band === 1 ? 3 : 2; // x-,y+ → 4/3/2
  return band === 0 ? 4 : band === 1 ? 5 : 6; // x-,y- → 4/5/6
};
const octant = (gx: number, gy: number): number => octantBands(gx, gy, TAN225, TAN675);
const octantSil = (gx: number, gy: number): number => octantBands(gx, gy, TAN1125, TAN7875);

// ── Colour palettes: three coloured lights so each face reads a distinct hue. ────
interface Palette {
  name: string;
  hueBase: number;
  hueSpan: number;
  sat: number;
  warm: RGB; // key-light tint
  fill: RGB; // fill-light tint
  rim: RGB; // rim-light tint
}
const PALETTES: Palette[] = [
  { name: 'EMBER', hueBase: 0.04, hueSpan: 0.50, sat: 0.92, warm: [1.0, 0.55, 0.18], fill: [0.10, 0.55, 0.95], rim: [1.0, 0.30, 0.62] },
  { name: 'NEON', hueBase: 0.52, hueSpan: 0.60, sat: 0.98, warm: [0.15, 0.95, 1.0], fill: [0.65, 0.18, 1.0], rim: [0.30, 1.0, 0.45] },
  { name: 'JADE', hueBase: 0.34, hueSpan: 0.46, sat: 0.88, warm: [0.45, 1.0, 0.55], fill: [0.12, 0.45, 0.85], rim: [1.0, 0.85, 0.30] },
  { name: 'GOLD', hueBase: 0.10, hueSpan: 0.34, sat: 0.86, warm: [1.0, 0.78, 0.30], fill: [0.30, 0.45, 0.90], rim: [1.0, 0.40, 0.22] },
  { name: 'PLASMA', hueBase: 0.80, hueSpan: 0.70, sat: 0.97, warm: [1.0, 0.30, 0.62], fill: [0.25, 0.50, 1.0], rim: [1.0, 0.80, 0.28] },
];

const PI = Math.PI;
const TWO_PI = 2 * PI;

// 4×4 ordered (Bayer) dither, normalised to (-0.5..0.5).
const BAYER4 = new Float32Array([
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
].map((v) => v / 16 - 0.5));

interface Scene {
  cols: number;
  rows: number;
  ssx: number;
  ssy: number;
  lum: Float32Array;
  dep: Float32Array;
  hue: Float32Array;
  satv: Float32Array;
  valv: Float32Array;
  hit: Uint8Array;
  gx: Float32Array;
  gy: Float32Array;
  chit: Uint8Array;
  cdep: Float32Array;
}

const SS = 2; // 2×2 supersample per cell

// Camera / interaction state (module-level, reset only on init).
let yaw = 0.0;
let pitch = -0.22;
let zoom = 1.0;
let rampIdx = 0;
let paletteIdx = 0;
let inkOn = 1;

let dragging = false;
let dragPrevX = -1;
let dragPrevY = -1;

let scene: Scene | null = null;

let keyTouched = false;
let interactT = -1e9;

// Manual shape override (when the user presses n/N). -1 = follow the auto-cycle.
let shapeOverride = -1;
// Sim-time at which a manual shape change happened, to drive a dissolve from it.
let shapeChangeT = -1e9;

const buildScene = (t: CharTerm): Scene => {
  const cols = t.columns;
  const rows = t.rows;
  const ssx = cols * SS;
  const ssy = rows * SS;
  return {
    cols,
    rows,
    ssx,
    ssy,
    lum: new Float32Array(cols * rows),
    dep: new Float32Array(cols * rows),
    hue: new Float32Array(cols * rows),
    satv: new Float32Array(cols * rows),
    valv: new Float32Array(cols * rows),
    hit: new Uint8Array(cols * rows),
    gx: new Float32Array(cols),
    gy: new Float32Array(rows),
    chit: new Uint8Array(cols * rows),
    cdep: new Float32Array(cols * rows),
  };
};

// ── The gallery of iconic solids ─────────────────────────────────────────────────
// Each is a clean, STABLE SDF in a normalised frame (reach ≈ 1). The whole point
// of this round is legibility: no morph, no metaball wobble — just a recognisable
// solid on a turntable. Index → SDF + label below.
const SHAPE_SPHERE = 0;
const SHAPE_TORUS = 1;
const SHAPE_KNOT = 2;
const SHAPE_CUBE = 3;
const SHAPE_SPARK = 4;
const SHAPE_COUNT = 5;
const SHAPE_NAMES = ['SPHERE', 'TORUS', 'TORUS KNOT', 'ROUNDED CUBE', 'CLAUDE SPARK'];

// Per-frame world→model rotation (set in renderFrame). The form is presented at a
// per-shape hero orientation plus a gentle shared "rock" so it reads as a turning
// 3D solid without ever rotating a flat shape (torus/spark) edge-on or a cube to
// an ambiguous corner-on view. Stored as a 3×3 matrix; sceneSDF applies it.
let m00 = 1, m01 = 0, m02 = 0;
let m10 = 0, m11 = 1, m12 = 0;
let m20 = 0, m21 = 0, m22 = 1;
// Active shape index + (during a dissolve) the previous shape and 0..1 blend.
let shapeA = SHAPE_SPHERE;
let shapeB = SHAPE_SPHERE;
let shapeMix = 0; // 0 = pure A, 1 = pure B

// Sphere with a subtle equatorial groove so a featureless ball still reads as a
// turning 3D planet (the groove gives the contour ink and shading something to
// catch as it rotates), but stays unmistakably a sphere.
const SPH_R = 0.92;
const sdSphere = (x: number, y: number, z: number): number => {
  const r = Math.sqrt(x * x + y * y + z * z);
  let d = r - SPH_R;
  // A shallow great-circle groove on the equator (|y| small) — purely cosmetic.
  const groove = 0.018 - 0.018 * smoothstep(0.0, 0.10, Math.abs(y));
  d += groove;
  return d;
};

// Classic donut: torus of major R, tube r, lying in the xz-plane.
const TOR_R = 0.62;
const TOR_T = 0.30;
const sdTorus = (x: number, y: number, z: number): number => {
  const q = Math.sqrt(x * x + z * z) - TOR_R;
  return Math.sqrt(q * q + y * y) - TOR_T;
};

// Clean (2,3) torus knot tube — the legible analytic form, no morph/twist drift.
const KNT_R = 0.60; // major ring radius
const KNT_R2 = 0.30; // knot path radius about the ring
const KNT_TUBE = 0.165;
const KNT_P = 2;
const KNT_Q = 3;
const sdKnot = (x: number, y: number, z: number): number => {
  const R = KNT_R;
  const p = KNT_P, q = KNT_Q;
  let a = Math.atan2(z, x);
  const seg = TWO_PI / p;
  const k = Math.round(a / seg);
  a -= k * seg;
  const ca = Math.cos(a), sa = Math.sin(a);
  const xr = x * ca + z * sa;
  const zr = -x * sa + z * ca;
  const rad = xr - R;
  const phase = (q / p) * (a + k * seg);
  const cx2 = KNT_R2 * Math.cos(phase);
  const cy2 = KNT_R2 * Math.sin(phase);
  const dx = rad - cx2;
  const dy = y - cy2;
  return Math.sqrt(dx * dx + dy * dy + zr * zr) - KNT_TUBE;
};

// Rounded cube: box SDF with a corner round, slightly under unit so it sits in
// the bounding sphere with margin.
const CUBE_H = 0.60; // half-extent
const CUBE_RND = 0.07; // corner round — small, so the edges read as crisp planes
const sdCube = (x: number, y: number, z: number): number => {
  const qx = (x < 0 ? -x : x) - CUBE_H;
  const qy = (y < 0 ? -y : y) - CUBE_H;
  const qz = (z < 0 ? -z : z) - CUBE_H;
  const mx = qx > 0 ? qx : 0;
  const my = qy > 0 ? qy : 0;
  const mz = qz > 0 ? qz : 0;
  const outside = Math.sqrt(mx * mx + my * my + mz * mz);
  const inside = Math.min(Math.max(qx, Math.max(qy, qz)), 0);
  return outside + inside - CUBE_RND;
};

const smin = (a: number, b: number, k: number): number => {
  const h = clamp01(0.5 + (0.5 * (b - a)) / k);
  return b * (1 - h) + a * h - k * h * (1 - h);
};

// Claude spark — the four-pointed star (sparkle) as a chunky 3D solid. Each of the
// four points is a tapered "petal": distance to the spike axis with a radius that
// shrinks from a fat base at the centre to a small rounded tip, given real
// out-of-plane thickness so it is a solid star, not a razor plate. A round core
// fills the middle and the smooth-union (smin) of the four petals carves the
// gently CONCAVE edges between adjacent points that make the Anthropic spark read
// instantly. The petals are kept blunt-tipped (a min tip radius) so the sphere
// tracer reliably lands on them and they never vanish to invisible threads.
const SPK_L = 1.00; // tip reach along each axis
const SPK_BASE = 0.40; // half-width of a petal at the centre
const SPK_TIP = 0.05; // half-width at the tip (blunt, so the marcher catches it)
const SPK_THK = 0.26; // out-of-plane half-thickness (z)
// One petal along +`along` (also mirrored to -along by using |along|). `perp` is
// the in-plane perpendicular; `z` the depth. Distance to a tapered round capsule.
const petal = (along: number, perp: number, z: number): number => {
  const a = along < 0 ? -along : along;
  // Clamp along-axis to the petal span; past the tip we measure to the tip cap.
  const t = a > SPK_L ? SPK_L : a;
  const frac = t / SPK_L; // 0 at centre → 1 at tip
  const rad = SPK_BASE + (SPK_TIP - SPK_BASE) * frac; // tapering radius
  const overshoot = a - t; // >0 only beyond the tip
  // Distance to the tapered axis (in-plane perp + depth), minus the local radius.
  return Math.sqrt(perp * perp + z * z + overshoot * overshoot) - rad;
};
const sdSpark = (x: number, y: number, z: number): number => {
  // Four petals along ±x and ±y, smooth-unioned for concave inter-point valleys.
  const px = petal(x, y, z);
  const py = petal(y, x, z);
  let d = smin(px, py, 0.22);
  // Solid round core so the centre never pinches.
  const core = Math.sqrt(x * x + y * y + z * z) - 0.34;
  d = smin(d, core, 0.18);
  // Clamp the whole star to a thin slab in z so it stays a recognisable flat star
  // rather than a blobby cross (intersection with |z| ≤ SPK_THK).
  const slab = (z < 0 ? -z : z) - SPK_THK;
  return d > slab ? d : slab;
};

// Evaluate one shape's SDF by index, in MODEL space already de-spun by the caller.
const shapeSDF = (s: number, x: number, y: number, z: number): number => {
  switch (s) {
    case SHAPE_SPHERE: return sdSphere(x, y, z);
    case SHAPE_TORUS: return sdTorus(x, y, z);
    case SHAPE_KNOT: return sdKnot(x, y, z);
    case SHAPE_CUBE: return sdCube(x, y, z);
    default: return sdSpark(x, y, z);
  }
};

// Bounding sphere enclosing every gallery solid (the spark reaches ≈0.96 on-axis;
// pad a touch for the rounding/normal epsilon).
const BSPHERE = 1.12;
const BSPHERE2 = BSPHERE * BSPHERE;

// Full scene SDF in WORLD space: de-spin into model space, then evaluate the
// active shape — or, during a dissolve, a blend of the two. The blend is a plain
// distance lerp; both shapes are convex-ish solids of similar scale so it stays a
// clean, legible dissolve for the ~0.6s it runs, and is skipped entirely (one SDF
// call) the >90% of the time we're on a single shape.
const sceneSDF = (x: number, y: number, z: number): number => {
  // World → model: apply the per-frame rotation matrix.
  const mx = m00 * x + m01 * y + m02 * z;
  const my = m10 * x + m11 * y + m12 * z;
  const mz = m20 * x + m21 * y + m22 * z;
  if (shapeMix <= 0.001) return shapeSDF(shapeA, mx, my, mz);
  if (shapeMix >= 0.999) return shapeSDF(shapeB, mx, my, mz);
  const da = shapeSDF(shapeA, mx, my, mz);
  const db = shapeSDF(shapeB, mx, my, mz);
  return da + (db - da) * shapeMix;
};

// Build the world→model rotation for a shape at a given rock phase. Each shape has
// a hero orientation; the rock makes the form visibly turn without ever hiding its
// identity. Most shapes rock about y (a turntable); the flat SPARK instead spins
// gently in its own plane (about z) so the four-point star always faces the camera
// and twinkles rather than turning edge-on.
//   • SPHERE — rotation-invariant; rock spins the cosmetic equator groove.
//   • TORUS  — tilted ~38° about x so the hole reads as a clean 3/4 donut view.
//   • KNOT   — tilted a little about x so the over/under crossings are legible.
//   • CUBE   — a 3/4 view: ~36° about y + ~24° about x so three faces show.
//   • SPARK  — held face-on with a slow in-plane (z) twinkle + a slight tilt.
const setModelRotation = (shape: number, rock: number): void => {
  if (shape === SHAPE_SPARK) {
    // Rz(spin) then a small fixed Rx tilt for depth. World→model = (Rx*Rz).
    const az = rock * 0.5; // gentle in-plane twinkle
    const cz = Math.cos(az), sz = Math.sin(az);
    const tx = 0.22;
    const cx = Math.cos(tx), sx = Math.sin(tx);
    // Rz: [ cz -sz 0 ; sz cz 0 ; 0 0 1 ]; Rx: [1 0 0; 0 cx -sx; 0 sx cx]
    // R = Rx*Rz:
    m00 = cz;        m01 = -sz;       m02 = 0;
    m10 = cx * sz;   m11 = cx * cz;   m12 = -sx;
    m20 = sx * sz;   m21 = sx * cz;   m22 = cx;
    return;
  }
  let tiltX = 0; // radians about x (down-tilt: positive lifts the top toward viewer)
  let baseY = 0; // radians about y baked into the hero pose
  let yAmp = 1.0; // how much the shared rock applies
  switch (shape) {
    case SHAPE_TORUS: tiltX = 0.66; yAmp = 1.0; break;
    case SHAPE_KNOT: tiltX = 0.30; baseY = 0.2; yAmp = 1.0; break;
    case SHAPE_CUBE: tiltX = 0.42; baseY = 0.62; yAmp = 0.6; break;
    default: tiltX = 0.0; yAmp = 1.0; break; // sphere
  }
  const ay = baseY + rock * yAmp;
  const cy = Math.cos(ay), sy = Math.sin(ay);
  const cx = Math.cos(tiltX), sx = Math.sin(tiltX);
  // R = Rx(tiltX) * Ry(ay):
  m00 = cy;        m01 = 0;    m02 = sy;
  m10 = sx * sy;   m11 = cx;   m12 = -sx * cy;
  m20 = -cx * sy;  m21 = sx;   m22 = cx * cy;
};

// Lighting directions (normalised, world space): warm key upper-right, cool fill
// left/front, magenta rim as a confined lower-right side accent.
const L0x = 0.58, L0y = 0.66, L0z = 0.48; // key (warm)
const L1x = -0.82, L1y = 0.18, L1z = 0.54; // fill (cool)
const L2x = 0.66, L2y = -0.44, L2z = -0.32; // rim (magenta)

runText({
  title: 'chromascii — colour ASCII 3D renderer',
  hud: 'DRAG ORBIT · WHEEL ZOOM · n SHAPE · [ ] RAMP · p PALETTE · e INK',
  captureT: 5,
  targetFps: 0, // uncapped
  mouse: true,
  init: (t: CharTerm) => {
    scene = buildScene(t);
    yaw = 0;
    pitch = -0.22;
    zoom = 1.0;
    rampIdx = 0;
    paletteIdx = 0;
    inkOn = 1;
    interactT = -1e9;
    dragging = false;
    dragPrevX = -1;
    dragPrevY = -1;
    shapeOverride = -1;
    shapeChangeT = -1e9;
  },
  resize: (t: CharTerm) => {
    scene = buildScene(t);
  },
  onKey: (key: string, t: CharTerm) => {
    void t;
    if (key === '[') rampIdx = (rampIdx + RAMPS.length - 1) % RAMPS.length;
    else if (key === ']') rampIdx = (rampIdx + 1) % RAMPS.length;
    else if (key === 'p' || key === 'down') paletteIdx = (paletteIdx + 1) % PALETTES.length;
    else if (key === 'P' || key === 'up') paletteIdx = (paletteIdx + PALETTES.length - 1) % PALETTES.length;
    else if (key === 'e' || key === ' ' || key === 'space') inkOn = inkOn ? 0 : 1;
    else if (key === '+' || key === '=') zoom = Math.min(2.4, zoom * 1.08);
    else if (key === '-' || key === '_') zoom = Math.max(0.55, zoom / 1.08);
    else if (key === 'n' || key === 'right') cycleShape(1);
    else if (key === 'N' || key === 'left') cycleShape(-1);
    keyTouched = true;
  },
  frame: (t: CharTerm, time: number) => {
    const sc = scene && scene.cols === t.columns && scene.rows === t.rows ? scene : (scene = buildScene(t));
    renderFrame(t, sc, time);
  },
});

// Advance the manual shape override by ±1 (wrapping) and start a dissolve from it.
function cycleShape(dir: number): void {
  const cur = shapeOverride < 0 ? shapeA : shapeOverride;
  shapeOverride = (cur + dir + SHAPE_COUNT) % SHAPE_COUNT;
  // shapeChangeT is set in renderFrame from `time` (frame has it; onKey doesn't).
  pendingShapeChange = true;
}
let pendingShapeChange = false;

// Auto-cycle cadence: each shape holds, then a brief dissolve to the next.
const SHAPE_HOLD = 6.0; // seconds a shape is shown
const SHAPE_FADE = 0.9; // seconds of dissolve between shapes
const SHAPE_PERIOD = SHAPE_HOLD + SHAPE_FADE;

const renderFrame = (t: CharTerm, sc: Scene, time: number): void => {
  // ── Interaction: mouse drag orbit + wheel zoom (LIVE only) ────────────────────
  if (t.mouse.wheel !== 0) {
    zoom = Math.max(0.55, Math.min(2.4, zoom * Math.pow(1.12, t.mouse.wheel)));
    t.mouse.wheel = 0;
    interactT = time;
  }
  if (t.mouse.down && t.mouse.inside) {
    if (!dragging) {
      dragging = true;
      dragPrevX = t.mouse.x;
      dragPrevY = t.mouse.y;
    } else {
      const dx = t.mouse.x - dragPrevX;
      const dy = t.mouse.y - dragPrevY;
      dragPrevX = t.mouse.x;
      dragPrevY = t.mouse.y;
      yaw += dx * 0.045;
      pitch += dy * 0.05;
      pitch = Math.max(-1.35, Math.min(1.35, pitch));
    }
    interactT = time;
  } else {
    dragging = false;
  }
  if (pendingShapeChange) {
    shapeChangeT = time;
    pendingShapeChange = false;
  }
  if (keyTouched) {
    interactT = time;
    keyTouched = false;
  }

  // ── Attract: idle for >3s (or capture/bench) → drive a turntable ──────────────
  const idle = time - interactT;
  const attract = idle > 3.0;

  let camYaw = yaw;
  let camPitch = pitch;
  let camZoom = zoom;
  if (attract) {
    // A flattering, near-static 3/4 camera with only a gentle sway — the TURNTABLE
    // motion lives in the model rock below, so a flat shape (spark/torus) is never
    // rotated edge-on by a full camera orbit. The form clearly turns; it never
    // becomes unreadable.
    camYaw = yaw + 0.42 + 0.16 * Math.sin(time * 0.23);
    camPitch = -0.20 + 0.08 * Math.sin(time * 0.19);
    camZoom = 1.46 + 0.09 * Math.sin(time * 0.21);
  }

  // ── Shape selection + dissolve (deterministic, time-driven) ───────────────────
  if (shapeOverride >= 0) {
    // Manual mode: dissolve once from the previously-shown shape to the chosen one.
    const fade = clamp01((time - shapeChangeT) / SHAPE_FADE);
    if (fade >= 1) {
      shapeA = shapeOverride;
      shapeB = shapeOverride;
      shapeMix = 0;
    } else {
      // shapeA holds whatever was on screen when the key was pressed.
      shapeB = shapeOverride;
      shapeMix = smoothstep(0, 1, fade);
    }
  } else {
    // Auto gallery cadence.
    const cyc = time / SHAPE_PERIOD;
    const idxF = Math.floor(cyc);
    const cur = ((idxF % SHAPE_COUNT) + SHAPE_COUNT) % SHAPE_COUNT;
    const nxt = (cur + 1) % SHAPE_COUNT;
    const phase = (cyc - idxF) * SHAPE_PERIOD; // seconds into this slot
    shapeA = cur;
    if (phase < SHAPE_HOLD) {
      shapeB = cur;
      shapeMix = 0;
    } else {
      shapeB = nxt;
      shapeMix = smoothstep(0, 1, (phase - SHAPE_HOLD) / SHAPE_FADE);
    }
  }
  // The label always names the shape we are dissolving TOWARD once past halfway.
  const labelShape = shapeMix > 0.5 ? shapeB : shapeA;

  // Model TURNTABLE rock: a slow, continuous oscillation about the up-axis so the
  // form visibly turns (revealing its 3D structure) but always returns to — and
  // dwells near — its hero orientation. Range ≈ ±0.85 rad: enough to swing a cube
  // through its faces and roll a torus/knot, never enough to edge-on a flat shape.
  const rock = 0.85 * Math.sin(time * 0.40);
  setModelRotation(labelShape, rock);

  // ── Camera basis ──────────────────────────────────────────────────────────────
  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  const cy = Math.cos(camYaw), sy = Math.sin(camYaw);
  const D = 3.0 / camZoom;
  const camX = D * cp * sy;
  const camY = D * sp;
  const camZ = D * cp * cy;
  let fwdX = -camX, fwdY = -camY, fwdZ = -camZ;
  const fl = 1 / Math.sqrt(fwdX * fwdX + fwdY * fwdY + fwdZ * fwdZ);
  fwdX *= fl; fwdY *= fl; fwdZ *= fl;
  let rX = fwdZ;
  let rY = 0;
  let rZ = -fwdX;
  const rl = 1 / Math.sqrt(rX * rX + rY * rY + rZ * rZ + 1e-9);
  rX *= rl; rY *= rl; rZ *= rl;
  const uX = fwdY * rZ - fwdZ * rY;
  const uY = fwdZ * rX - fwdX * rZ;
  const uZ = fwdX * rY - fwdY * rX;

  const cols = sc.cols;
  const rows = sc.rows;
  const ssx = sc.ssx;
  const ssy = sc.ssy;
  const aspect = cols / (rows * 2.0);
  const fov = 1.15;

  const lum = sc.lum;
  const dep = sc.dep;
  const hue = sc.hue;
  const satv = sc.satv;
  const valv = sc.valv;
  const hit = sc.hit;

  const pal = PALETTES[paletteIdx];

  // ── Adaptive raymarch: coarse 1-ray-per-cell pass drives selective 2×2 SS ──────
  const N = cols * rows;
  for (let i = 0; i < N; i++) {
    lum[i] = 0; dep[i] = 0; hue[i] = 0; satv[i] = 0; valv[i] = 0; hit[i] = 0;
  }

  const invSSx = 1 / ssx;
  const invSSy = 1 / ssy;
  const ssArea = 1 / (SS * SS);
  const chit = sc.chit;
  const cdep = sc.cdep;

  const marchRay = (dirX: number, dirY: number, dirZ: number): number => {
    const tca = -(camX * dirX + camY * dirY + camZ * dirZ);
    const ox = camX + dirX * tca, oy = camY + dirY * tca, oz = camZ + dirZ * tca;
    const closest2 = ox * ox + oy * oy + oz * oz;
    if (closest2 > BSPHERE2) return -1;
    const half = Math.sqrt(BSPHERE2 - closest2);
    let tRay = tca - half;
    if (tRay < 0.01) tRay = 0.01;
    const maxT = tca + half + 0.05;
    for (let s = 0; s < 40; s++) {
      const px = camX + dirX * tRay;
      const py = camY + dirY * tRay;
      const pz = camZ + dirZ * tRay;
      const d = sceneSDF(px, py, pz);
      if (d < 0.004) return tRay;
      const f = d > 0.16 ? 0.99 : 0.86;
      tRay += d * f;
      if (tRay > maxT) return -1;
    }
    return -1;
  };

  const shadeHit = (
    dirX: number, dirY: number, dirZ: number, hitT: number, ci: number, w: number,
  ): void => {
    const hx = camX + dirX * hitT;
    const hy = camY + dirY * hitT;
    const hz = camZ + dirZ * hitT;
    const e = 0.012;
    const d1 = sceneSDF(hx + e, hy - e, hz - e);
    const d2 = sceneSDF(hx - e, hy - e, hz + e);
    const d3 = sceneSDF(hx - e, hy + e, hz - e);
    const d4 = sceneSDF(hx + e, hy + e, hz + e);
    const nx = d1 - d2 - d3 + d4;
    const ny = -d1 - d2 + d3 + d4;
    const nz = -d1 + d2 - d3 + d4;
    const nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz + 1e-12);
    const Nx = nx * nl, Ny = ny * nl, Nz = nz * nl;

    const vx = -dirX, vy = -dirY, vz = -dirZ;

    const ndl0raw = Nx * L0x + Ny * L0y + Nz * L0z;
    const ndl0 = Math.max(0, 0.18 + 0.82 * ndl0raw);
    const ndl1raw = Nx * L1x + Ny * L1y + Nz * L1z;
    const ndl1 = Math.max(0, 0.42 + 0.58 * ndl1raw) * 0.95;
    const ndl2 = Math.max(0, Nx * L2x + Ny * L2y + Nz * L2z);
    let hX = L0x + vx, hY2 = L0y + vy, hZ = L0z + vz;
    const hl = 1 / Math.sqrt(hX * hX + hY2 * hY2 + hZ * hZ + 1e-9);
    hX *= hl; hY2 *= hl; hZ *= hl;
    let sp0 = Nx * hX + Ny * hY2 + Nz * hZ;
    if (sp0 < 0) sp0 = 0;
    sp0 *= sp0; sp0 *= sp0; sp0 *= sp0; sp0 *= sp0; sp0 *= sp0; // ^32
    const spec = sp0 * 1.1;

    const ndv = Math.max(0, Nx * vx + Ny * vy + Nz * vz);
    const fr0 = 1 - ndv;
    const fr2 = fr0 * fr0;
    const fres = fr2 * fr2;

    const ndl2t = ndl2 * ndl2 * ndl2;
    const kw = 1.0 * ndl0, kf = 1.0 * ndl1, kr = 0.34 * ndl2t + fres * 0.22;
    let rr = kw * pal.warm[0] + kf * pal.fill[0] + kr * pal.rim[0] + spec;
    let gg = kw * pal.warm[1] + kf * pal.fill[1] + kr * pal.rim[1] + spec;
    let bb = kw * pal.warm[2] + kf * pal.fill[2] + kr * pal.rim[2] + spec;
    rr += 0.05; gg += 0.07; bb += 0.13;

    const tr = aces(rr * 1.25), tg = aces(gg * 1.25), tb = aces(bb * 1.25);

    const L = 0.299 * tr + 0.587 * tg + 0.114 * tb;

    const dn = clamp01((hitT - (D - 1.7)) / 3.4);

    const mx = tr > tg ? (tr > tb ? tr : tb) : tg > tb ? tg : tb;
    const mn = tr < tg ? (tr < tb ? tr : tb) : tg < tb ? tg : tb;
    const chroma = mx - mn;
    let hh: number;
    if (chroma < 1e-4) hh = pal.hueBase;
    else if (mx === tr) hh = ((tg - tb) / chroma) / 6;
    else if (mx === tg) hh = (2 + (tb - tr) / chroma) / 6;
    else hh = (4 + (tr - tg) / chroma) / 6;
    if (hh < 0) hh += 1;
    hh = hh + pal.hueSpan * 0.12 * (Ny * 0.5 + 0.5) - 0.04 * dn;
    const satFromRgb = mx > 1e-4 ? chroma / mx : 0;
    const ss = clamp01(0.35 + 0.65 * satFromRgb) * pal.sat;

    lum[ci] += L * w;
    dep[ci] += dn * w;
    hue[ci] += hh * w;
    satv[ci] += (ss * (1 - 0.6 * clamp01(spec))) * w;
    valv[ci] += clamp01(mx * 1.05) * w;
  };

  const cellNdcY = (row: number): number => (1 - 2 * ((row + 0.5) / rows)) / fov;
  const cellNdcX = (col: number): number => ((2 * ((col + 0.5) / cols) - 1) * aspect) / fov;

  // ── Pass A: coarse centre sample per cell → occupancy + depth ─────────────────
  for (let row = 0; row < rows; row++) {
    const ndcY = cellNdcY(row);
    const rowBase = row * cols;
    for (let col = 0; col < cols; col++) {
      const ci = rowBase + col;
      const ndcX = cellNdcX(col);
      let dirX = fwdX + rX * ndcX + uX * ndcY;
      let dirY = fwdY + rY * ndcX + uY * ndcY;
      let dirZ = fwdZ + rZ * ndcX + uZ * ndcY;
      const dl = 1 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
      dirX *= dl; dirY *= dl; dirZ *= dl;
      const hitT = marchRay(dirX, dirY, dirZ);
      if (hitT < 0) {
        chit[ci] = 0;
        cdep[ci] = 1;
      } else {
        chit[ci] = 1;
        cdep[ci] = clamp01((hitT - (D - 1.7)) / 3.4);
      }
    }
  }

  // ── Pass B: resolve each cell, supersampling only the boundary band ───────────
  for (let row = 0; row < rows; row++) {
    const ndcYc = cellNdcY(row);
    const rowBase = row * cols;
    for (let col = 0; col < cols; col++) {
      const ci = rowBase + col;
      const ch0 = chit[ci];
      const cu = row > 0 ? chit[ci - cols] : ch0;
      const cd = row < rows - 1 ? chit[ci + cols] : ch0;
      const clf = col > 0 ? chit[ci - 1] : ch0;
      const crt = col < cols - 1 ? chit[ci + 1] : ch0;
      let boundary = ch0 !== cu || ch0 !== cd || ch0 !== clf || ch0 !== crt;
      if (!boundary && ch0 === 1) {
        const d0 = cdep[ci];
        const du = row > 0 ? cdep[ci - cols] : d0;
        const dd = row < rows - 1 ? cdep[ci + cols] : d0;
        const dl2 = col > 0 ? cdep[ci - 1] : d0;
        const dr2 = col < cols - 1 ? cdep[ci + 1] : d0;
        const gxd = dl2 - dr2, gyd = du - dd;
        if (gxd * gxd + gyd * gyd > 0.0016) boundary = true;
      }

      if (ch0 === 0 && !boundary) {
        dep[ci] = 1;
        continue;
      }

      if (!boundary) {
        const ndcX = cellNdcX(col);
        let dirX = fwdX + rX * ndcX + uX * ndcYc;
        let dirY = fwdY + rY * ndcX + uY * ndcYc;
        let dirZ = fwdZ + rZ * ndcX + uZ * ndcYc;
        const dl = 1 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        dirX *= dl; dirY *= dl; dirZ *= dl;
        const hitT = marchRay(dirX, dirY, dirZ);
        if (hitT < 0) { dep[ci] = 1; continue; }
        shadeHit(dirX, dirY, dirZ, hitT, ci, 1);
        hit[ci] = SS * SS;
        continue;
      }

      let hitCount = 0;
      for (let sj = 0; sj < SS; sj++) {
        const ndcY = (1 - 2 * ((row * SS + sj + 0.5) * invSSy)) / fov;
        for (let si = 0; si < SS; si++) {
          const ndcX = ((2 * ((col * SS + si + 0.5) * invSSx) - 1) * aspect) / fov;
          let dirX = fwdX + rX * ndcX + uX * ndcY;
          let dirY = fwdY + rY * ndcX + uY * ndcY;
          let dirZ = fwdZ + rZ * ndcX + uZ * ndcY;
          const dl = 1 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
          dirX *= dl; dirY *= dl; dirZ *= dl;
          const hitT = marchRay(dirX, dirY, dirZ);
          if (hitT < 0) { dep[ci] += ssArea; continue; }
          shadeHit(dirX, dirY, dirZ, hitT, ci, ssArea);
          hitCount++;
        }
      }
      hit[ci] = hitCount;
    }
  }

  // ── Compose into the character grid ───────────────────────────────────────────
  t.clear(2, 2, 5);
  const ramp = RAMP_CODE[rampIdx];
  const rampMax = ramp.length - 1;

  const cxh = (cols - 1) * 0.5;
  const cyh = (rows - 1) * 0.5;
  const invCx = 1 / (cxh + 1e-6);
  const invCy = 1 / (cyh + 1e-6);
  const gxArr = sc.gx;
  const gyArr = sc.gy;
  for (let x = 0; x < cols; x++) {
    const u = (x - cxh) * invCx;
    const f = 1 - u * u;
    gxArr[x] = f > 0 ? f : 0;
  }
  for (let y = 0; y < rows; y++) {
    const v = (y - cyh) * invCy;
    const f = 1 - v * v;
    gyArr[y] = f > 0 ? f : 0;
  }
  const glowR = pal.warm[0] * 0.42 + pal.fill[0] * 0.30 + pal.rim[0] * 0.28;
  const glowG = pal.warm[1] * 0.42 + pal.fill[1] * 0.30 + pal.rim[1] * 0.28;
  const glowB = pal.warm[2] * 0.42 + pal.fill[2] * 0.30 + pal.rim[2] * 0.28;
  for (let y = 0; y < rows; y++) {
    const rowBase = y * cols;
    const gyv = gyArr[y];
    for (let x = 0; x < cols; x++) {
      const ci = rowBase + x;
      const isHit = hit[ci] > 0;
      if (!isHit) {
        let glow = gxArr[x] * gyv;
        glow = glow * glow * (3 - 2 * glow);
        const bgr = (5 + 58 * glow * glowR) | 0;
        const bgg = (5 + 56 * glow * glowG) | 0;
        const bgb = (12 + 50 * glow * glowB) | 0;
        t.put(x, y, ' ', [40, 40, 50], [bgr, bgg, bgb]);
        continue;
      }
      const bgr = 4, bgg = 4, bgb = 10;

      const L = lum[ci];
      const dith = BAYER4[((y & 3) << 2) | (x & 3)] * 1.5;
      let gi = (clamp01(L * 1.25) * rampMax + 0.5 + dith) | 0;
      if (gi < 0) gi = 0; else if (gi > rampMax) gi = rampMax;

      const hh = hue[ci];
      const ssN = clamp01(satv[ci]);
      let vv = valv[ci];
      vv = clamp01(0.24 + 0.92 * vv);
      const col = hsv(hh, ssN, vv);

      const dn = dep[ci];
      const bgDim = 1 - 0.5 * dn;
      const bg: RGB = [
        (col[0] * 0.10 * bgDim + bgr * 0.5) | 0,
        (col[1] * 0.10 * bgDim + bgg * 0.5) | 0,
        (col[2] * 0.12 * bgDim + bgb * 0.6) | 0,
      ];

      let cpch = ramp[gi];
      let useBold = L > 0.6;

      if (inkOn && x > 0 && x < cols - 1 && y > 0 && y < rows - 1) {
        const up = (y - 1) * cols + x, dn2 = (y + 1) * cols + x;
        const lf = y * cols + (x - 1), rt = y * cols + (x + 1);
        const i00 = lumOrFar(lum, hit, (y - 1) * cols + (x - 1));
        const i01 = lumOrFar(lum, hit, up);
        const i02 = lumOrFar(lum, hit, (y - 1) * cols + (x + 1));
        const i10 = lumOrFar(lum, hit, lf);
        const i12 = lumOrFar(lum, hit, rt);
        const i20 = lumOrFar(lum, hit, (y + 1) * cols + (x - 1));
        const i21 = lumOrFar(lum, hit, dn2);
        const i22 = lumOrFar(lum, hit, (y + 1) * cols + (x + 1));
        const gx = i00 + 2 * i10 + i20 - i02 - 2 * i12 - i22;
        const gy = i00 + 2 * i01 + i02 - i20 - 2 * i21 - i22;
        const mag2 = gx * gx + gy * gy;
        const onEdge = hit[up] === 0 || hit[dn2] === 0 || hit[lf] === 0 || hit[rt] === 0;
        const inkIt = onEdge ? mag2 > 0.09 : mag2 > 0.38;
        if (inkIt) {
          const dir = onEdge ? octantSil(gx, gy) : octant(gx, gy);
          cpch = EDGE_BY_DIR[dir];
          useBold = true;
          if (onEdge) {
            if (dir === 0 || dir === 4) {
              cpch = hit[rt] === 0 ? PAREN_R : PAREN_L;
            } else if (dir === 2 || dir === 6) {
              const stepLeft = (hit[lf - cols] === 0) !== (hit[lf + cols] === 0);
              const stepRight = (hit[rt - cols] === 0) !== (hit[rt + cols] === 0);
              if (stepLeft || stepRight) cpch = 0x007e; // ~
            }
            col[0] = Math.min(255, (col[0] * 0.72 + 96) | 0);
            col[1] = Math.min(255, (col[1] * 0.72 + 98) | 0);
            col[2] = Math.min(255, (col[2] * 0.72 + 108) | 0);
          } else {
            col[0] = Math.min(255, (col[0] * 0.88 + 44) | 0);
            col[1] = Math.min(255, (col[1] * 0.88 + 46) | 0);
            col[2] = Math.min(255, (col[2] * 0.88 + 52) | 0);
          }
        }
      }
      t.put(x, y, cpch, col, bg, useBold);
    }
  }

  // ── Title chrome: a big shape LABEL + one-line subtitle (top-left), drawn AFTER
  // the form so it sits cleanly above it. Uses a 5×7 block-letter routine so the
  // shape name reads from across the room — that's what makes a newcomer "get it".
  drawTitle(t, SHAPE_NAMES[labelShape], pal);

  // ── Bottom status bar (FPS/HUD owned by engine top-right) ─────────────────────
  const pal2 = PALETTES[paletteIdx];
  const status = ` ${attract ? 'GALLERY' : 'LIVE'}  shape ${labelShape + 1}/${SHAPE_COUNT}  ramp ${rampIdx + 1}/${RAMPS.length}  ${pal2.name}  ink ${inkOn ? 'ON' : 'OFF'}  zoom ${camZoomLabel(camZoom)} `;
  if (rows > 1) {
    const by = rows - 1;
    t.fillRect(0, by, cols, 1, [10, 10, 16]);
    t.text(1, by, clip(status, cols - 2), [200, 205, 220], [10, 10, 16], true);
  }
};

// ── Big block-letter label (5×7 cells per glyph) for the shape name + subtitle ───
// A compact uppercase/space/digit/() font drawn with '█' cells so the name is huge
// and legible. Returns nothing — writes straight into the CharTerm.
const BIG_W = 5;
const BIG_H = 7;
const BIG_FONT: Record<string, string[]> = {
  ' ': ['     ', '     ', '     ', '     ', '     ', '     ', '     '],
  A: [' ███ ', '█   █', '█   █', '█████', '█   █', '█   █', '█   █'],
  B: ['████ ', '█   █', '████ ', '█   █', '█   █', '█   █', '████ '],
  C: [' ████', '█    ', '█    ', '█    ', '█    ', '█    ', ' ████'],
  D: ['████ ', '█   █', '█   █', '█   █', '█   █', '█   █', '████ '],
  E: ['█████', '█    ', '████ ', '█    ', '█    ', '█    ', '█████'],
  H: ['█   █', '█   █', '█   █', '█████', '█   █', '█   █', '█   █'],
  K: ['█   █', '█  █ ', '█ █  ', '██   ', '█ █  ', '█  █ ', '█   █'],
  L: ['█    ', '█    ', '█    ', '█    ', '█    ', '█    ', '█████'],
  N: ['█   █', '██  █', '█ █ █', '█ █ █', '█  ██', '█   █', '█   █'],
  O: [' ███ ', '█   █', '█   █', '█   █', '█   █', '█   █', ' ███ '],
  P: ['████ ', '█   █', '█   █', '████ ', '█    ', '█    ', '█    '],
  R: ['████ ', '█   █', '█   █', '████ ', '█ █  ', '█  █ ', '█   █'],
  S: [' ████', '█    ', '█    ', ' ███ ', '    █', '    █', '████ '],
  T: ['█████', '  █  ', '  █  ', '  █  ', '  █  ', '  █  ', '  █  '],
  U: ['█   █', '█   █', '█   █', '█   █', '█   █', '█   █', ' ███ '],
};

const drawTitle = (t: CharTerm, name: string, pal: Palette): void => {
  // Skip the giant label on tiny grids — fall back to a single bright line.
  const fitsBig = t.columns >= 60 && t.rows >= 18;
  // Title colour: a warm-cream lifted from the palette key for cohesion.
  const tc: RGB = [
    Math.min(255, (180 + pal.warm[0] * 60) | 0),
    Math.min(255, (185 + pal.warm[1] * 55) | 0),
    Math.min(255, (200 + pal.warm[2] * 45) | 0),
  ];
  const shadow: RGB = [6, 7, 14];
  const subColor: RGB = [120, 132, 158];
  const SUBTITLE = 'REAL-TIME 3D · COLOUR ASCII RAYMARCHER';

  if (!fitsBig) {
    if (t.rows > 2) {
      t.text(1, 0, name, tc, undefined, true);
    }
    return;
  }

  // Big label: lay out the glyphs with a 1-cell gap, centred horizontally, near
  // the top. A 1-cell drop shadow gives it weight over the busy raymarched field.
  const glyphAdv = BIG_W + 1;
  const labelW = name.length * glyphAdv - 1;
  const x0 = Math.max(1, ((t.columns - labelW) / 2) | 0);
  const y0 = 1;

  // Soft top vignette so the title + subtitle always read cleanly even when the
  // form rises behind them (small grids). A graded shade — strong at the very top,
  // fading out below the subtitle — keeps it elegant rather than a hard black bar.
  const bannerH = y0 + BIG_H + 2;
  for (let by = 0; by < bannerH && by < t.rows; by++) {
    const a = 0.62 * (1 - by / bannerH);
    if (a > 0.02) t.shadeRect(0, by, t.columns, 1, 3, 4, 9, a);
  }
  for (let li = 0; li < name.length; li++) {
    const rows = BIG_FONT[name[li]] ?? BIG_FONT[' '];
    const gx = x0 + li * glyphAdv;
    for (let gy = 0; gy < BIG_H; gy++) {
      const row = rows[gy];
      for (let cx = 0; cx < BIG_W; cx++) {
        if (row[cx] === '█') {
          // Soft drop shadow one cell down-right for legibility on bright forms.
          t.put(gx + cx + 1, y0 + gy + 1, '█', shadow, undefined, false);
        }
      }
    }
  }
  for (let li = 0; li < name.length; li++) {
    const rows = BIG_FONT[name[li]] ?? BIG_FONT[' '];
    const gx = x0 + li * glyphAdv;
    for (let gy = 0; gy < BIG_H; gy++) {
      const row = rows[gy];
      for (let cx = 0; cx < BIG_W; cx++) {
        if (row[cx] === '█') t.put(gx + cx, y0 + gy, '█', tc, undefined, true);
      }
    }
  }
  // Subtitle, centred under the label.
  const subX = Math.max(1, ((t.columns - SUBTITLE.length) / 2) | 0);
  const subY = y0 + BIG_H + 1;
  if (subY < t.rows - 1) t.text(subX, subY, SUBTITLE, subColor, undefined, false);
};

const lumOrFar = (lum: Float32Array, hit: Uint8Array, idx: number): number =>
  hit[idx] > 0 ? lum[idx] : 0;

const camZoomLabel = (z: number): string => {
  const v = Math.round(z * 100) / 100;
  return v.toFixed(2);
};

const clip = (s: string, n: number): string => (s.length <= n ? s : s.slice(0, n));
