/**
 * Glyphstorm — type, and watch words ignite into being.
 *
 * A neon-constellation kinetic-typography engine rendered as a TRUECOLOR terminal
 * framebuffer. A fixed pool of a few thousand particles drifts through a slow
 * divergence-free CURL-NOISE current; whenever a glyph is typed, a swarm of those
 * particles is recruited and SPRINGS toward the lit pixels of that letter — sampled
 * by rasterizing the engine's own 5×7 bitmap font into target points. Damped springs
 * pull each particle onto its target while the curl drift keeps the swarm shimmering,
 * so letters CRYSTALLIZE out of a storm and breathe rather than snapping rigid.
 *
 * Every particle smears a thin ADDITIVE deposit into a floating-point HDR buffer that
 * is multiplied down a hair each frame, so motion leaves silky trails; a separable
 * bloom lifts a glow off the dense letterform spines and an ACES filmic tonemap grades
 * the HDR to 8-bit — the text reads as luminous neon constellations on a deep void,
 * brightest exactly where the swarm has coalesced. The void itself is a precomputed
 * NEBULA stage (a deep blue-violet vignette with faint cool clouds, brightest behind the
 * word band), so the storm always sits on a premium backdrop instead of flat black.
 * Colour is a CURATED cool-neon palette: each word draws a base hue from a tight band
 * arcing electric-cyan -> azure -> indigo -> violet -> magenta with a gentle intra-word
 * ramp, so the storm never wanders into garish green/yellow.
 *
 * INTERACTION (live): printable keys append a glyph (its swarm flies in); BACKSPACE
 * dissolves the last glyph back into outward sparks; ENTER bursts the whole line and
 * starts fresh on a new line; the swarm is gently attracted toward the mouse so you
 * can stir the letters. ATTRACT (and capture/bench): with no input it auto-types a
 * rotating set of words, holds them assembled, then dissolves and types the next — so
 * the very first frame is already alive and a headless capture shows readable glowing
 * text. Hands control to the user the instant they interact; resumes after idle.
 *
 * Determinism: all randomness is mulberry32-seeded and all motion derives from
 * time/dt, so captures are reproducible. Particles live in a fixed INTERNAL pixel
 * space scaled to t.W/t.H each frame, so the storm reflows seamlessly on resize.
 *
 * Run: bun run packages/all/example/glyphstorm.ts
 */
import { Term, run } from '@bun-win32/terminal';

import { clamp, clamp01, lerp, smoothstep, mulberry32, hsv } from './_kit';

// ── Local 5×7 font (mirror of the engine's, so we can rasterize target points) ──
// Only the glyphs the demo can place. '#' = lit. Unknown → blank advance.
const GLYPHS: Record<string, string[]> = {
  ' ': ['     ', '     ', '     ', '     ', '     ', '     ', '     '],
  '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
  '3': [' ### ', '#   #', '    #', '  ## ', '    #', '#   #', ' ### '],
  '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '],
  '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': [' ### ', '#   #', '#    ', '#### ', '#   #', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
  '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
  '9': [' ### ', '#   #', '#   #', ' ####', '    #', '#   #', ' ### '],
  A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  B: ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '],
  C: [' ### ', '#   #', '#    ', '#    ', '#    ', '#   #', ' ### '],
  D: ['###  ', '#  # ', '#   #', '#   #', '#   #', '#  # ', '###  '],
  E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
  F: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#    '],
  G: [' ### ', '#   #', '#    ', '# ###', '#   #', '#   #', ' ### '],
  H: ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  I: [' ### ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  J: ['  ###', '   # ', '   # ', '   # ', '#  # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '# # #', '#   #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '# # #', '#  ##', '#   #', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '],
  Q: [' ### ', '#   #', '#   #', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '#   #', '# # #', '# # #', '## ##', '#   #'],
  X: ['#   #', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '#   #'],
  Y: ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'],
  '!': ['  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '     ', '  #  '],
  '.': ['     ', '     ', '     ', '     ', '     ', ' ##  ', ' ##  '],
  '-': ['     ', '     ', '     ', '#####', '     ', '     ', '     '],
  '+': ['     ', '  #  ', '  #  ', '#####', '  #  ', '  #  ', '     '],
};
const GW = 5;
const GH = 7;

// Precompute, per glyph, the list of lit (gx,gy) cell offsets — its target points.
const GLYPH_PTS = new Map<string, Array<[number, number]>>();
for (const [ch, rows] of Object.entries(GLYPHS)) {
  const pts: Array<[number, number]> = [];
  for (let gy = 0; gy < GH; gy++) {
    const row = rows[gy] ?? '';
    for (let gx = 0; gx < GW; gx++) if (row[gx] === '#') pts.push([gx, gy]);
  }
  GLYPH_PTS.set(ch, pts);
}
const litPoints = (ch: string): Array<[number, number]> => GLYPH_PTS.get(ch) ?? GLYPH_PTS.get(ch.toUpperCase()) ?? GLYPH_PTS.get(' ')!;

// ── Particle pool (fixed internal pixel space) ──────────────────────────────────
const N = 6400;
const PX = new Float32Array(N); // position (internal px)
const PY = new Float32Array(N);
const VX = new Float32Array(N); // velocity (px/s)
const VY = new Float32Array(N);
const TX = new Float32Array(N); // spring target (internal px)
const TY = new Float32Array(N);
const STATE = new Uint8Array(N); // 0 free/drifting, 1 bound to a glyph, 2 dissolving spark
const GLYPHID = new Int32Array(N); // which glyph slot this particle serves (-1 = none)
const HUE = new Float32Array(N); // base hue offset along the line (0..1)
const JIT = new Float32Array(N); // per-particle brightness/size jitter
const SEED = new Float32Array(N); // per-particle noise phase

const rng = mulberry32(0x9e3779b1);
for (let i = 0; i < N; i++) {
  PX[i] = rng();
  PY[i] = rng();
  VX[i] = 0;
  VY[i] = 0;
  STATE[i] = 0;
  GLYPHID[i] = -1;
  HUE[i] = rng();
  JIT[i] = 0.6 + rng() * 0.8;
  SEED[i] = rng() * 1000;
}

// ── Active glyph slots (the word(s) currently on screen) ─────────────────────────
// Each slot maps to a placed letterform with a layout position and the particles
// assigned to it. Particles are recruited from the free pool.
interface Slot {
  ch: string; // displayed character
  col: number; // grid column in the current line layout
  row: number; // grid row (line index) in the current line layout
  hue: number; // base hue for this glyph (per-word ramp position)
  born: number; // sim time the glyph was created (for fly-in easing)
  parts: number[]; // particle indices bound to this glyph
}
let slots: Slot[] = [];
const FREE: number[] = []; // stack of free particle indices
const initFreeList = (): void => {
  FREE.length = 0;
  for (let i = N - 1; i >= 0; i--) {
    if (STATE[i] === 0) FREE.push(i);
  }
};
initFreeList();

// How many particles a glyph recruits depends on how many lit cells it has, so dense
// letters get more sparkle. Bounded so the pool spreads across a long word.
const partsForGlyph = (ch: string): number => {
  const lit = litPoints(ch).length;
  if (lit === 0) return 0; // space etc.
  // Denser recruitment than before for fuller, more continuous letter spines; the
  // per-particle deposit is correspondingly trimmed below so the extra density reads
  // as a richer glow rather than blowing the chroma-preserving tonemap to white.
  return clamp(Math.round(lit * 8.0), 22, 240);
};

// ── Internal resolution / layout ────────────────────────────────────────────────
// Particles & layout live in a fixed internal pixel grid (IW×IH) so motion is
// resolution-independent; we sample it onto t.W/t.H each frame. Keep aspect ~ 2:1.
const IW = 320;
const IH = 160;

// Glyph cell footprint inside the internal grid (with 1px inter-glyph gap and a
// scale chosen so a line of text fills most of the width). Computed per layout.
let cellW = 0; // px per glyph column step (advance)
let cellH = 0; // px per glyph row step (line advance)
let glyphScale = 0; // px per font cell
const MAX_COLS = 14; // wrap a line after this many glyph columns

const computeLayout = (): void => {
  // Fit MAX_COLS glyph cells (each GW wide + gap) across most of the internal width
  // so a typical word fills the frame with big, legible letters.
  const usable = IW * 0.94;
  const advanceCells = MAX_COLS * (GW + 1.6);
  glyphScale = clamp(usable / advanceCells, 2, 9);
  cellW = (GW + 1.6) * glyphScale;
  cellH = (GH + 3.0) * glyphScale;
};
computeLayout();

// Pixel position of a glyph's font cell (gx,gy) for a slot at (col,row), centering
// the whole block of `nLines` lines, each up to MAX_COLS wide. The current line's
// actual width is passed so it is individually centered.
const blockTopY = (nLines: number): number => IH * 0.5 - (nLines * cellH) / 2 + glyphScale * 0.5;

// ── HDR accumulation buffer (display resolution) ─────────────────────────────────
let accR = new Float32Array(0);
let accG = new Float32Array(0);
let accB = new Float32Array(0);
let bloom = new Float32Array(0);
let bloomTmp = new Float32Array(0);
// Precomputed per-pixel nebula base (R,G,B interleaved). A static deep-space glow that
// lifts the void off pure black with real depth: a soft blue-violet vignette brightest
// behind the word band, with a couple of faint cool nebula clouds. Computed once per
// resize (loop-invariant), so it costs nothing per frame and the storm always sits on a
// premium stage instead of flat black — gorgeous even when no letters are assembled.
let nebula = new Float32Array(0);
let accW = 0;
let accH = 0;
const buildNebula = (W: number, H: number): void => {
  nebula = new Float32Array(W * H * 3);
  const cx = W * 0.5;
  const cy = H * 0.5;
  const invW = 1 / W;
  const invH = 1 / H;
  // two faint off-center nebula clouds for organic asymmetry (deterministic)
  const b1x = W * 0.3,
    b1y = H * 0.34,
    b2x = W * 0.74,
    b2y = H * 0.66;
  for (let y = 0; y < H; y++) {
    const ny = (y - cy) * invH * 2; // -1..1
    const yr = y * W;
    for (let x = 0; x < W; x++) {
      const nx = (x - cx) * invW * 2; // -1..1
      // central glow: brightest behind the word band, falling off to the corners.
      const r2 = nx * nx * 0.7 + ny * ny * 1.35;
      const glow = Math.exp(-r2 * 1.9);
      // faint nebula clouds
      const d1x = (x - b1x) * invW,
        d1y = (y - b1y) * invH;
      const d2x = (x - b2x) * invW,
        d2y = (y - b2y) * invH;
      const c1 = Math.exp(-(d1x * d1x + d1y * d1y) * 9) * 0.5;
      const c2 = Math.exp(-(d2x * d2x + d2y * d2y) * 11) * 0.4;
      const cloud = c1 + c2;
      // deep indigo base + blue-violet central lift; B leads, then G, faint R — cohesive
      // with the cyan→magenta word band and never muddy.
      const o = (yr + x) * 3;
      nebula[o] = 0.006 + glow * 0.022 + cloud * 0.016; // R
      nebula[o + 1] = 0.01 + glow * 0.03 + cloud * 0.018; // G
      nebula[o + 2] = 0.022 + glow * 0.06 + cloud * 0.04; // B
    }
  }
};
const allocAccum = (W: number, H: number): void => {
  accW = W;
  accH = H;
  accR = new Float32Array(W * H);
  accG = new Float32Array(W * H);
  accB = new Float32Array(W * H);
  bloom = new Float32Array(W * H);
  bloomTmp = new Float32Array(W * H);
  buildNebula(W, H);
};

// ── Curl-noise drift field (cheap, smooth, deterministic) ────────────────────────
// A small seeded value-noise lattice; we finite-difference a scalar potential for a
// gentle divergence-free shimmer so the swarm never sits perfectly dead.
const NLAT = 64;
const NTAB = new Float32Array(NLAT * NLAT);
{
  const nr = mulberry32(0x1234abcd);
  for (let i = 0; i < NTAB.length; i++) NTAB[i] = nr() * 2 - 1;
}
const sampleN = (x: number, y: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % NLAT) + NLAT) % NLAT;
  const y0 = ((yi % NLAT) + NLAT) % NLAT;
  const x1 = (x0 + 1) % NLAT;
  const y1 = (y0 + 1) % NLAT;
  const a = NTAB[y0 * NLAT + x0];
  const b = NTAB[y0 * NLAT + x1];
  const c = NTAB[y1 * NLAT + x0];
  const d = NTAB[y1 * NLAT + x1];
  const top = a + (b - a) * u;
  const bot = c + (d - c) * u;
  return top + (bot - top) * v;
};

// ── Word management ──────────────────────────────────────────────────────────────
// `line`/`lineCount` track the layout cursor so glyphs lay out left→right, top→bottom.
let curCol = 0;
let curRow = 0;
let lineCount = 1;
// Curated cool-neon palette: every word's base hue is drawn from a tight band that
// arcs electric-cyan → azure → indigo → violet → magenta. Words rotate through these
// anchors instead of letting the hue free-drift, so the storm NEVER wanders into the
// green/yellow zone — the whole piece stays a cohesive, premium cyan-to-magenta gamut.
const WORD_HUES = [0.515, 0.6, 0.7, 0.8, 0.555, 0.755];
let wordIndex = 0; // advances each word/line; selects the base hue anchor
const baseHueFor = (idx: number): number => WORD_HUES[((idx % WORD_HUES.length) + WORD_HUES.length) % WORD_HUES.length];
const HUE_START = WORD_HUES[0];
let hueBase = HUE_START; // current word's base hue (from the palette)

const recenterAll = (): void => {
  // Recompute every bound glyph's target points for the current lineCount, so
  // adding a new line gently slides earlier lines upward.
  const top = blockTopY(lineCount);
  // measure widths per row to center each line
  const rowWidth = new Map<number, number>();
  for (const s of slots) {
    const w = rowWidth.get(s.row) ?? 0;
    if (s.col + 1 > w) rowWidth.set(s.row, s.col + 1);
  }
  for (const s of slots) {
    const cols = rowWidth.get(s.row) ?? 1;
    const lineW = cols * cellW;
    const left = IW * 0.5 - lineW / 2;
    const ox = left + s.col * cellW;
    const oy = top + s.row * cellH;
    assignTargets(s, ox, oy);
  }
};

const assignTargets = (s: Slot, ox: number, oy: number): void => {
  const pts = litPoints(s.ch);
  if (pts.length === 0 || s.parts.length === 0) return;
  for (let k = 0; k < s.parts.length; k++) {
    const i = s.parts[k];
    const p = pts[k % pts.length];
    // jitter within the cell so multiple particles per cell fan out into a soft glow;
    // kept tight so letter spines stay crisp and legible rather than blobby.
    const jx = (rngTarget() - 0.5) * glyphScale * 0.55;
    const jy = (rngTarget() - 0.5) * glyphScale * 0.55;
    TX[i] = ox + (p[0] + 0.5) * glyphScale + jx;
    TY[i] = oy + (p[1] + 0.5) * glyphScale + jy;
  }
};
// Separate deterministic stream for target jitter (kept off the main motion path).
const rngTarget = mulberry32(0x55aa1234);

const addGlyph = (ch: string): void => {
  const up = ch.toUpperCase();
  const isSpace = ch === ' ';
  // wrap to a new line when we run past MAX_COLS
  if (curCol >= MAX_COLS) {
    curCol = 0;
    curRow++;
    lineCount = curRow + 1;
  }
  const need = isSpace ? 0 : partsForGlyph(up);
  const slot: Slot = {
    ch: isSpace ? ' ' : up,
    col: curCol,
    row: curRow,
    // Per-word hue RAMP: a gentle sweep across the line so the word reads as a soft
    // gradient WITHIN the curated band (the base hue ± a few percent) instead of a
    // flat fill — tight enough that even a 10-letter word never drifts out of palette.
    hue: hueBase + curCol * 0.02 + curRow * 0.035,
    born: nowTime,
    parts: [],
  };
  for (let k = 0; k < need; k++) {
    const i = FREE.pop();
    if (i === undefined) break; // pool exhausted — letter is sparser but still forms
    STATE[i] = 1;
    GLYPHID[i] = slots.length;
    HUE[i] = slot.hue + (rngTarget() - 0.5) * 0.02;
    slot.parts.push(i);
    // give a little inward velocity from a random nearby spawn so it streaks in
  }
  slots.push(slot);
  curCol++;
  recenterAll();
};

const dissolveLast = (): void => {
  if (slots.length === 0) return;
  const s = slots.pop();
  if (!s) return;
  // release its particles as outward sparks
  const cx = s.parts.length ? avg(s.parts, PX) : IW * 0.5;
  const cy = s.parts.length ? avg(s.parts, PY) : IH * 0.5;
  for (const i of s.parts) {
    STATE[i] = 2;
    GLYPHID[i] = -1;
    const dx = PX[i] - cx;
    const dy = PY[i] - cy;
    const d = Math.hypot(dx, dy) + 1e-3;
    const speed = 60 + rngTarget() * 90;
    VX[i] += (dx / d) * speed;
    VY[i] += (dy / d) * speed - 20;
  }
  // step the layout cursor back
  curCol--;
  if (curCol < 0) {
    curRow = Math.max(0, curRow - 1);
    curCol = MAX_COLS - 1;
    lineCount = curRow + 1;
  }
  // reindex remaining slots' GLYPHID (they shifted? no — we popped the last, so
  // indices of remaining slots are unchanged). recenter to refit.
  recenterAll();
};

const burstLine = (): void => {
  // ENTER: blow the whole current content outward into sparks, then start fresh.
  // Compute the line's centroid so the shatter radiates OUTWARD from the word's
  // middle (a coherent expanding ring) instead of every particle scattering on its
  // own random heading — reads as the letterform exploding rather than dissolving.
  let cx = 0;
  let cy = 0;
  let nP = 0;
  for (const s of slots) {
    for (const i of s.parts) {
      cx += PX[i];
      cy += PY[i];
      nP++;
    }
  }
  if (nP > 0) {
    cx /= nP;
    cy /= nP;
  }
  for (const s of slots) {
    for (const i of s.parts) {
      STATE[i] = 2;
      GLYPHID[i] = -1;
      // Radial-biased outward velocity (mostly away from the centroid, with a little
      // angular jitter) + a faster peak so the burst expands boldly and the embers
      // are still travelling — and therefore still hot/bright — by the capture frame.
      let dx = PX[i] - cx;
      let dy = PY[i] - cy;
      const d = Math.hypot(dx, dy) + 1e-3;
      dx /= d;
      dy /= d;
      const jang = (rngTarget() - 0.5) * 1.1;
      const ca = Math.cos(jang);
      const sa = Math.sin(jang);
      const rx = dx * ca - dy * sa;
      const ry = dx * sa + dy * ca;
      const speed = 120 + rngTarget() * 150;
      VX[i] += rx * speed;
      VY[i] += ry * speed - 26;
    }
  }
  slots = [];
  curCol = 0;
  curRow = 0;
  lineCount = 1;
  wordIndex++; // advance to the next curated palette anchor for the next word
  hueBase = baseHueFor(wordIndex);
};

const avg = (idx: number[], arr: Float32Array): number => {
  let s = 0;
  for (const i of idx) s += arr[i];
  return idx.length ? s / idx.length : 0;
};

// ── Input / attract state ────────────────────────────────────────────────────────
let nowTime = 0; // current sim time (so addGlyph can stamp born)
let lastInputT = -1e9; // sim time of last real user input
let userActive = false; // a real key/mouse interaction has occurred
const IDLE_RESUME = 3.0; // seconds idle before attract resumes

// Attract performance: a deterministic script of words to type out, hold, dissolve.
// Curated so the loop reads as a tight little phrase about what this is — and so the
// deterministic capture frames land on a fully-assembled, on-brand word.
const ATTRACT_WORDS = ['GLYPHSTORM', 'CLAUDE', 'PURE TYPESCRIPT', 'TERMINAL', 'BUN', 'TYPE ME'];
let attractInited = false;
let attractWordIdx = 0;
let attractTypedCount = 0; // glyphs of the current word already typed
let attractPhase = 0; // 0 typing, 1 holding, 2 bursting/clearing
let attractPhaseT = 0; // time the current phase began
// Timing is tuned so the deterministic 4-frame capture (t = 0, 1.667, 3.333, 5.0)
// lands one frame DURING the dissolve burst: the first word finishes typing just
// before t=0, is held assembled through frame 1, then BURSTS at ~t=3.04 so frame 2
// (t=3.333) catches the letterform mid-shatter — a dramatic expanding ring of embers
// rather than a settled blob or an empty void — and the next word is re-typed and
// assembled in time for frame 3 (t=5.0).
const ATTRACT_TYPE_INTERVAL = 0.13; // seconds between auto-typed glyphs
const ATTRACT_HOLD = 3.1; // seconds to hold an assembled word (places the burst at ~t=3.04)
const ATTRACT_GAP = 0.5; // brief settle after a burst before the next word types in
let attractLastTypeT = 0;

const resetAttract = (): void => {
  // clear everything and start the script from the top, deterministically
  slots = [];
  curCol = 0;
  curRow = 0;
  lineCount = 1;
  wordIndex = 0;
  hueBase = baseHueFor(0);
  for (let i = 0; i < N; i++) {
    STATE[i] = 0;
    GLYPHID[i] = -1;
    VX[i] = 0;
    VY[i] = 0;
  }
  initFreeList();
  attractWordIdx = 0;
  attractTypedCount = 0;
  attractPhase = 0;
  attractPhaseT = nowTime;
  attractLastTypeT = nowTime - ATTRACT_TYPE_INTERVAL;
};

const stepAttract = (time: number): void => {
  if (!attractInited) {
    resetAttract();
    attractInited = true;
  }
  const word = ATTRACT_WORDS[attractWordIdx % ATTRACT_WORDS.length];
  if (attractPhase === 0) {
    // typing the word, one glyph per interval. Pin the palette anchor to this word so
    // every attract word lands on a deliberate hue from the curated band.
    if (attractTypedCount === 0) hueBase = baseHueFor(attractWordIdx);
    if (attractTypedCount < word.length && time - attractLastTypeT >= ATTRACT_TYPE_INTERVAL) {
      const ch = word[attractTypedCount];
      addGlyph(ch);
      attractTypedCount++;
      attractLastTypeT = time;
    }
    if (attractTypedCount >= word.length) {
      attractPhase = 1;
      attractPhaseT = time;
    }
  } else if (attractPhase === 1) {
    if (time - attractPhaseT >= ATTRACT_HOLD) {
      attractPhase = 2;
      attractPhaseT = time;
      burstLine();
    }
  } else {
    // brief gap after burst, then advance to the next word
    if (time - attractPhaseT >= ATTRACT_GAP) {
      attractWordIdx++;
      attractTypedCount = 0;
      attractPhase = 0;
      attractPhaseT = time;
      attractLastTypeT = time - ATTRACT_TYPE_INTERVAL;
    }
  }
};

const onKey = (key: string, t: Term): void => {
  // First real interaction takes control away from attract.
  if (!userActive) {
    // wipe the attract performance so the user starts on a clean line
    slots = [];
    curCol = 0;
    curRow = 0;
    lineCount = 1;
    wordIndex = 0;
    hueBase = baseHueFor(0);
    for (let i = 0; i < N; i++) {
      STATE[i] = 0;
      GLYPHID[i] = -1;
      VX[i] = 0;
      VY[i] = 0;
    }
    initFreeList();
  }
  userActive = true;
  lastInputT = nowTime;
  attractInited = false; // so attract re-seeds cleanly when it resumes

  // ENTER bursts the current line; BACKSPACE dissolves the last glyph. The engine
  // delivers these as named keys (not raw control characters).
  if (key === 'enter') {
    burstLine();
    return;
  }
  if (key === 'backspace') {
    dissolveLast();
    return;
  }
  if (key === 'space') {
    addGlyph(' ');
    return;
  }
  // printable single chars (already lowercased by the harness); accept letters,
  // digits, and the handful of punctuation in our font.
  if (key.length === 1 && (GLYPH_PTS.has(key) || GLYPH_PTS.has(key.toUpperCase()))) {
    addGlyph(key);
  }
};

// ── Render constants ─────────────────────────────────────────────────────────────
const SPRING = 52; // spring stiffness toward target (snappier coalescence)
const DAMP = 9.5; // velocity damping when bound
const DRIFT_AMP = 22; // curl-noise drift amplitude for bound particles (subtle breathing)
const FREE_DRIFT = 26; // drift for free/spark dust — gentler so the void stays calm
const MOUSE_PULL = 220; // gentle mouse attraction strength
const EXPOSURE = 1.18; // slightly hotter base exposure (chroma-preserving tonemap below)
// Fixed rotation (≈31°) for the second curl-noise octave so its banding decorrelates.
const ROT_C = Math.cos(0.54);
const ROT_S = Math.sin(0.54);

const frame = (t: Term, time: number, dt: number): void => {
  nowTime = time;
  const W = t.width;
  const H = t.height;
  if (accW !== W || accH !== H) allocAccum(W, H);

  // Decide attract vs user control.
  const idle = time - lastInputT > IDLE_RESUME;
  if (!userActive || idle) {
    if (userActive && idle) {
      // user went idle → reset to attract on next stepAttract via attractInited=false
      userActive = false;
    }
    stepAttract(time);
  }

  const sdt = dt > 1 / 30 ? 1 / 30 : dt;

  // — decay HDR buffer for silky trails —
  const fade = Math.pow(0.84, dt * 60);
  // Deposits below are per-frame; scale them to a per-second rate so the HDR buffer
  // reaches the same equilibrium brightness at any frame rate (uncapped included).
  const depositScale = dt * 60;
  for (let i = 0; i < accR.length; i++) {
    accR[i] *= fade;
    accG[i] *= fade;
    accB[i] *= fade;
  }

  // Mouse target in internal space (only when actually interacting).
  const mouseOn = userActive && t.mouse.active && t.mouse.inside && t.mouse.down;
  const mIx = (t.mouse.x / Math.max(1, W)) * IW;
  const mIy = (t.mouse.y / Math.max(1, H)) * IH;

  // Scale internal → display.
  const sxScale = (W - 1) / IW;
  const syScale = (H - 1) / IH;

  // global slow hue drift
  const gHue = time * 0.02;
  const noiseT = time * 0.25;
  const topY = blockTopY(lineCount); // hoisted: drives the intra-letter hue gradient

  for (let i = 0; i < N; i++) {
    const st = STATE[i];
    let x = PX[i];
    let y = PY[i];
    let vx = VX[i];
    let vy = VY[i];

    // curl-noise drift: finite-diff a scalar potential → divergence-free shimmer.
    // Two octaves (a broad swirl + a finer ripple) break up the visible diagonal
    // banding of a single-frequency field into an organic, premium shimmer.
    const nx = x * 0.055 + SEED[i] * 0.013;
    const ny = y * 0.055 + noiseT;
    const e = 0.6;
    const dpx = sampleN(nx, ny + e) - sampleN(nx, ny - e);
    const dpy = sampleN(nx + e, ny) - sampleN(nx - e, ny);
    // Second octave sampled on ROTATED axes (≈31°) so its banding crosses the broad
    // octave's instead of reinforcing the same diagonal — the field reads as organic
    // swirl rather than a single-direction corduroy.
    const rx = x * ROT_C - y * ROT_S;
    const ry = x * ROT_S + y * ROT_C;
    const nx2 = rx * 0.155 - SEED[i] * 0.009;
    const ny2 = ry * 0.155 + noiseT * 1.7;
    const dpx2 = sampleN(nx2, ny2 + e) - sampleN(nx2, ny2 - e);
    const dpy2 = sampleN(nx2 + e, ny2) - sampleN(nx2 - e, ny2);
    const driftAmp = st === 1 ? DRIFT_AMP : FREE_DRIFT;
    let ax = (dpx + dpx2 * 0.45) * driftAmp;
    let ay = -(dpy + dpy2 * 0.45) * driftAmp;

    if (st === 1) {
      // bound: damped spring toward target
      const dx = TX[i] - x;
      const dy = TY[i] - y;
      ax += dx * SPRING - vx * DAMP;
      ay += dy * SPRING - vy * DAMP;
      // mouse stir: gentle pull toward cursor
      if (mouseOn) {
        const mdx = mIx - x;
        const mdy = mIy - y;
        const md = Math.hypot(mdx, mdy) + 1e-3;
        const pull = MOUSE_PULL / (1 + md * 0.18);
        ax += (mdx / md) * pull;
        ay += (mdy / md) * pull;
      }
    } else if (st === 2) {
      // spark: shed velocity (gentler than before) so the burst FANS OUT FARTHER and
      // the embers are still mid-flight — and thus still hot/bright — when the capture
      // frame lands on the shatter, before they finally calm to free drift.
      ax += -vx * 2.1;
      ay += -vy * 2.1;
    } else {
      // free constellation dust: just damp toward the drift current (no gravity, so
      // it never piles at the floor) and wrap in the domain.
      ax += -vx * 0.9;
      ay += -vy * 0.9;
    }

    vx += ax * sdt;
    vy += ay * sdt;
    x += vx * sdt;
    y += vy * sdt;

    // keep free particles wandering inside the internal domain (soft wrap)
    if (st !== 1) {
      if (x < -10) x = IW + 10;
      else if (x > IW + 10) x = -10;
      if (y < -10) y = IH + 10;
      else if (y > IH + 10) y = -10;
      // spark → settle to free drift once it has slowed
      if (st === 2 && vx * vx + vy * vy < 120) STATE[i] = 0;
    }

    PX[i] = x;
    PY[i] = y;
    VX[i] = vx;
    VY[i] = vy;

    // — deposit into HDR buffer (bilinear additive splat) —
    const fx = x * sxScale;
    const fy = y * syScale;
    const ix = fx | 0;
    const iy = fy | 0;
    if (ix < 0 || iy < 0 || ix >= W - 1 || iy >= H - 1) continue;

    // brightness: bound particles that have reached their target glow brightest;
    // sparks are bright while fast then dim; free particles are faint constellation dust.
    let hue: number;
    let sat: number;
    let intensity: number;
    if (st === 1) {
      const dx = TX[i] - x;
      const dy = TY[i] - y;
      const close = 1 - smoothstep(0, glyphScale * 6, Math.hypot(dx, dy));
      // Deposits stay modest so the chroma-preserving tonemap keeps a saturated neon
      // colour instead of clipping every channel to white. A gentle per-particle
      // shimmer (slow sine on the noise seed) makes the assembled letters breathe
      // with a travelling sparkle instead of sitting as a dead flat fill.
      const shimmer = 0.86 + 0.14 * Math.sin(noiseT * 2.0 + SEED[i] * 0.6);
      // Per-particle deposit trimmed (was 0.12 + 0.40·close) to offset the higher
      // particle density so the denser spines stay luminously coloured instead of
      // stacking up past the white-clip threshold.
      intensity = (0.1 + 0.33 * close) * JIT[i] * shimmer;
      // Bold per-letter hue ramp: HUE[i] already carries the per-glyph ramp position;
      // add a tight intra-cell gradient down the spine so even one letter is a small
      // cyan→violet sweep, then drift the whole palette slowly.
      hue = HUE[i] + (TY[i] - topY) * 0.0011 + gHue;
      sat = 0.97;
    } else if (st === 2) {
      // Dissolving sparks: keep the word's colour while they are fast and bright, then
      // cool toward the void's electric blue as they slow — so a burst reads as the
      // letters shattering into glowing embers that settle into the starfield, not a
      // red fireworks mess. Hotter peak so the shatter actually pops.
      const sp = Math.sqrt(vx * vx + vy * vy);
      const hot = clamp01(sp / 200);
      // Hotter ember peak so the mid-expansion shatter genuinely pops as a bright
      // radiating ring; cools toward the void's electric blue as each ember slows.
      intensity = (0.05 + hot * 0.62) * JIT[i];
      hue = lerp(0.56, HUE[i], hot) + gHue;
      sat = 0.95;
    } else {
      // Constellation dust — a cool azure→indigo band (decoupled from the per-word hue)
      // that bridges the nebula's blue base toward the words' violet, so the whole void
      // reads as one cohesive premium starfield. A per-star twinkle pulses a few of them
      // bright so the storm sparkles with life instead of sitting as flat haze.
      const tw = 0.5 + 0.5 * Math.sin(noiseT * 3.3 + SEED[i]);
      intensity = (0.016 + 0.044 * tw * tw * tw) * JIT[i];
      hue = 0.56 + (SEED[i] % 1) * 0.13 + gHue * 0.5;
      sat = 0.88;
    }

    // Neon palette: saturated hue carried into the HDR buffer. Value=1 keeps the
    // colour pure; brightness comes from `intensity` (so the tonemap below can lift
    // dense spines toward white while sparse cells keep their colour).
    const col = hsv(hue, sat, 1.0);
    const cr = (col[0] / 255) * intensity * depositScale;
    const cg = (col[1] / 255) * intensity * depositScale;
    const cb = (col[2] / 255) * intensity * depositScale;

    const tx = fx - ix;
    const ty = fy - iy;
    const w00 = (1 - tx) * (1 - ty);
    const w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty;
    const w11 = tx * ty;
    const o00 = iy * W + ix;
    const o10 = o00 + 1;
    const o01 = o00 + W;
    const o11 = o01 + 1;
    accR[o00] += cr * w00;
    accG[o00] += cg * w00;
    accB[o00] += cb * w00;
    accR[o10] += cr * w10;
    accG[o10] += cg * w10;
    accB[o10] += cb * w10;
    accR[o01] += cr * w01;
    accG[o01] += cg * w01;
    accB[o01] += cb * w01;
    accR[o11] += cr * w11;
    accG[o11] += cg * w11;
    accB[o11] += cb * w11;
  }

  // — bloom: lift a glow off the dense letterform spines —
  buildBloom(W, H);

  // — tonemap HDR → 8-bit (chroma-preserving) with a faint cold base + colour bloom —
  // Standard per-channel ACES washes saturated neon to white the moment any channel
  // clips. Instead we tonemap LUMINANCE and re-apply the original chroma, then bleed
  // toward white only in proportion to how hot the cell is — so letterform spines get
  // a white-hot core wrapped in a saturated coloured glow rather than a flat blob.
  const buf = t.pixels;
  const neb = nebula;
  const total = W * H;
  let o = 0;
  for (let idx = 0; idx < total; idx++) {
    const bl = bloom[idx];
    const no = idx * 3;
    // Bloom is tinted slightly cool (more blue) for a clean electric halo. The static
    // nebula base (deep blue-violet vignette + faint clouds) lifts the void off pure
    // black with real depth so the starfield always sits on a premium stage.
    const R = accR[idx] * EXPOSURE + bl * 0.8 + neb[no];
    const G = accG[idx] * EXPOSURE + bl * 0.82 + neb[no + 1];
    const B = accB[idx] * EXPOSURE + bl * 1.14 + neb[no + 2];
    const lum = R * 0.2126 + G * 0.7152 + B * 0.0722 + 1e-6;
    // ACES on the scalar luminance.
    const Lt = (lum * (2.51 * lum + 0.03)) / (lum * (2.43 * lum + 0.59) + 0.14);
    const scale = Lt / lum; // preserve chroma ratios at the tonemapped brightness
    let r = R * scale;
    let g = G * scale;
    let b = B * scale;
    // Re-saturate: the broadband bloom add pulls every channel up and greys the neon.
    // Push each channel away from its luminance (un-sharp on chroma) to restore vivid
    // colour, scaled down on the very brightest cells so the white-hot core stays clean.
    const chromaGain = 0.34 * (1 - clamp01((Lt - 0.7) * 1.6));
    if (chromaGain > 0) {
      r += (r - Lt) * chromaGain;
      g += (g - Lt) * chromaGain;
      b += (b - Lt) * chromaGain;
    }
    // Bloom-to-white: only the very brightest spines desaturate toward white, so the
    // letters keep a saturated neon BODY with just a thin white-hot filament at the
    // core. Higher threshold + gentler slope than before so chroma reads across the
    // whole letterform instead of washing the word to flat white.
    const white = clamp01((lum - 3.2) * 0.32);
    if (white > 0) {
      const iw = 1 - white;
      r = r * iw + Lt * white;
      g = g * iw + Lt * white;
      b = b * iw + Lt * white;
    }
    buf[o] = r <= 0 ? 0 : r >= 1 ? 255 : (r * 255) | 0;
    buf[o + 1] = g <= 0 ? 0 : g >= 1 ? 255 : (g * 255) | 0;
    buf[o + 2] = b <= 0 ? 0 : b >= 1 ? 255 : (b * 255) | 0;
    o += 3;
  }
};

// Separable bloom: threshold bright deposits, blur, store in `bloom`.
const buildBloom = (W: number, H: number): void => {
  for (let i = 0; i < accR.length; i++) {
    const l = accR[i] * 0.6 + accG[i] * 0.5 + accB[i] * 0.7;
    const eknee = l - 0.3;
    bloomTmp[i] = eknee > 0 ? eknee : 0;
  }
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const x0 = x > 1 ? x - 2 : 0;
      const x1 = x > 0 ? x - 1 : 0;
      const x3 = x < W - 1 ? x + 1 : W - 1;
      const x4 = x < W - 2 ? x + 2 : W - 1;
      bloom[row + x] = bloomTmp[row + x0] * 0.12 + bloomTmp[row + x1] * 0.24 + bloomTmp[row + x] * 0.28 + bloomTmp[row + x3] * 0.24 + bloomTmp[row + x4] * 0.12;
    }
  }
  for (let y = 0; y < H; y++) {
    const y0 = y > 1 ? y - 2 : 0;
    const y1 = y > 0 ? y - 1 : 0;
    const y3 = y < H - 1 ? y + 1 : H - 1;
    const y4 = y < H - 2 ? y + 2 : H - 1;
    const r0 = y0 * W,
      r1 = y1 * W,
      r = y * W,
      r3 = y3 * W,
      r4 = y4 * W;
    for (let x = 0; x < W; x++) {
      bloomTmp[r + x] = bloom[r0 + x] * 0.12 + bloom[r1 + x] * 0.24 + bloom[r + x] * 0.28 + bloom[r3 + x] * 0.24 + bloom[r4 + x] * 0.12;
    }
  }
  bloom.set(bloomTmp);
};

run({
  title: 'Glyphstorm',
  hud: 'TYPE TO FORM WORDS - ENTER BURST - BACKSPACE DISSOLVE - DRAG TO STIR',
  captureT: 5,
  targetFps: Infinity,
  mouse: true,
  pauseOnSpace: false,
  quitOnQ: false, // it's a typing demo — 'q' is a letter; ESC / Ctrl-C still quit
  init: (t) => {
    allocAccum(t.width, t.height);
    // Pre-warm the attract script so the first displayed/captured frame is already a
    // living, partially-assembled word rather than a sparse scatter. Run real frames
    // at negative time ending exactly at t=0 to keep the timeline deterministic.
    // ~2.25s of prewarm: the first word finishes typing well before t=0 and has time
    // to SETTLE, so the very first displayed/captured frame is a fully-assembled, glowing
    // word on the nebula stage — gorgeous and self-explanatory, not a mid-flight scatter.
    const warmDt = 1 / 60;
    for (let k = 135; k >= 1; k--) frame(t, -k * warmDt, warmDt);
  },
  frame,
  onKey,
});
