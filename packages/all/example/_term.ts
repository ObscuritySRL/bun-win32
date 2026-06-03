/**
 * _term — a pure-TypeScript, high-frame-rate TRUECOLOR terminal renderer.
 *
 * The whole console becomes a 24-bit RGB framebuffer. Each character cell draws
 * TWO stacked pixels with the Unicode upper-half-block '▀': the glyph's
 * FOREGROUND colour paints the top pixel and its BACKGROUND colour the bottom
 * pixel (`\x1b[38;2;r;g;bm` / `\x1b[48;2;r;g;bm`), so a W×R terminal renders a
 * W×(R·2) square-pixel image at full colour. Frames are emitted by a diffing
 * byte-builder that only repaints cells whose colour pair changed and only
 * re-issues an SGR escape or a cursor move when strictly necessary — so a
 * mostly-static scene costs almost nothing and a fully-animated one streams in
 * a single `process.stdout.write`. That is what keeps it comfortably above 60fps.
 *
 * Everything is here: console setup/teardown over @bun-win32/kernel32 FFI (VT
 * processing + UTF-8 code page + hidden cursor + alt-screen + autowrap-off,
 * all restored on exit), an embedded 5×7 bitmap font drawn straight into the
 * pixel buffer (so the live FPS HUD is part of the image), HSV/ACES/easing
 * helpers, a deterministic capture mode that advances a FIXED sim timestep and
 * writes a real PNG (pure-TS encoder — Bun.deflateSync wrapped in a hand-built
 * zlib container) so a frame can be inspected headlessly, and a BENCH mode that
 * reports the raw frame-production ceiling as JSON. No native addon, no deps.
 *
 * The engine is configurable so the SAME code can drive a quiet interactive CLI,
 * a text UI, a 60fps procedural scene, full-motion video, or a hyper-detailed
 * game — three orthogonal axes, all with backward-compatible defaults:
 *   • MODE — sub-cell packing. half (1×2, default, photo-grade) · quad (2×2) ·
 *     sextant (2×3) · braille (2×4). The higher modes quantise each cell to two
 *     colours + the best Unicode glyph, trading CPU for 2×/3×/4× resolution.
 *   • DIFF — exact (repaint changed cells, default) · threshold (also skip cells
 *     that drifted ≤ N per channel — huge on coherent video/game frames) · none.
 *   • DEPTH — truecolor (default) · 256 · 16. Fewer bits ⇒ far fewer bytes/frame,
 *     so a 16-colour stream reaches tens of thousands of fps on coherent content.
 * Configure via `new Term(cols, rows, { mode, diff, depth, threshold })`, the
 * DemoSpec fields, or the TERM_* env knobs below.
 *
 * Demos call `runDemo({ title, frame })`. Env knobs:
 *   DEMO_DURATION_MS=<ms>     live mode auto-exit
 *   CAPTURE_PNG=<abs path>    render one deterministic frame to PNG and exit
 *   CAPTURE_T=<seconds>       sim time to advance to before capture   (default 4)
 *   CAPTURE_FPS=<n>           fixed sim timestep for capture/bench     (default 60)
 *   CAPTURE_FRAMES=<n>        write n PNGs (path.0.png …) across [0,CAPTURE_T]
 *   TERM_COLS / TERM_ROWS     force the grid size (deterministic capture)
 *   TERM_MODE=half|quad|sextant|braille     sub-cell packing / resolution
 *   TERM_DIFF=exact|threshold|none          frame diff strategy
 *   TERM_DEPTH=truecolor|256|16             colour depth of the escapes
 *   TERM_THRESHOLD=<0..255>                 drift tolerance for TERM_DIFF=threshold
 *   BENCH=1 [BENCH_FRAMES=n]  measure frame-production FPS, print JSON, exit
 *
 * Engine/APIs: @bun-win32/kernel32 (console handle/mode/CP/title) via ../index.
 */
import { Kernel32 } from '../index';
import { STD_HANDLE } from '@bun-win32/kernel32';
import { dlopen } from 'bun:ffi';

// ── Console mode flags (kept local to avoid leaning on enum spelling) ──────────
const ENABLE_PROCESSED_OUTPUT = 0x0001;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
const CP_UTF8 = 65001;

// ── ANSI ───────────────────────────────────────────────────────────────────────
const ESC = '\x1b';
const RESET = `${ESC}[0m`;
const HIDE_CURSOR = `${ESC}[?25l`;
const SHOW_CURSOR = `${ESC}[?25h`;
const ALT_SCREEN_ON = `${ESC}[?1049h`;
// xterm mouse: 1003 = report ALL motion (hover, no button needed), 1006 = SGR
// extended coords (so columns/rows >223 work). Enabled only when a demo opts in.
const MOUSE_ON = `${ESC}[?1003h${ESC}[?1006h`;
const MOUSE_OFF = `${ESC}[?1003l${ESC}[?1006l`;
const ALT_SCREEN_OFF = `${ESC}[?1049l`;
const AUTOWRAP_OFF = `${ESC}[?7l`;
const AUTOWRAP_ON = `${ESC}[?7h`;
const HOME = `${ESC}[H`;
const CLEAR = `${ESC}[2J`;

const env = (k: string): string | undefined => {
  const v = process.env[k];
  return v === undefined || v === '' ? undefined : v;
};
const envNum = (k: string, d: number): number => {
  const v = env(k);
  const n = v === undefined ? NaN : Number(v);
  return Number.isFinite(n) ? n : d;
};

// ── Math / colour helpers (exported for demos) ─────────────────────────────────
export const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);
export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0 || 1e-9));
  return t * t * (3 - 2 * t);
};
export const fract = (x: number): number => x - Math.floor(x);
export const TAU = Math.PI * 2;

/** ACES filmic tonemap of a single linear channel (0..∞) → 0..1. */
export const aces = (x: number): number => {
  const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp01((x * (a * x + b)) / (x * (c * x + d) + e));
};

/** HSV (h in turns 0..1, s,v in 0..1) → packed [r,g,b] 0..255. */
export const hsv = (h: number, s: number, v: number): [number, number, number] => {
  h = fract(h) * 6;
  const i = Math.floor(h);
  const f = h - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));
  let r: number, g: number, b: number;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q; break;
  }
  return [(r * 255) | 0, (g * 255) | 0, (b * 255) | 0];
};

/** Deterministic 0..1 PRNG (mulberry32). */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Cheap 2D hash → 0..1. */
export const hash2 = (x: number, y: number): number => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// ── Embedded 5×7 bitmap font (human-readable source → packed at load) ──────────
// Each glyph is 7 rows × 5 columns ('#' = on). Lowercase maps to uppercase;
// unknown glyphs render blank. Rendered into the pixel buffer so the HUD is
// part of the captured image.
const G: Record<string, string[]> = {
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
  '.': ['     ', '     ', '     ', '     ', '     ', ' ##  ', ' ##  '],
  ',': ['     ', '     ', '     ', '     ', '  ## ', '  #  ', ' #   '],
  ':': ['     ', ' ##  ', ' ##  ', '     ', ' ##  ', ' ##  ', '     '],
  ';': ['     ', ' ##  ', ' ##  ', '     ', ' ##  ', '  #  ', ' #   '],
  '!': ['  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '     ', '  #  '],
  '-': ['     ', '     ', '     ', '#####', '     ', '     ', '     '],
  '+': ['     ', '  #  ', '  #  ', '#####', '  #  ', '  #  ', '     '],
  '=': ['     ', '     ', '#####', '     ', '#####', '     ', '     '],
  '/': ['    #', '    #', '   # ', '  #  ', ' #   ', '#    ', '#    '],
  '\\': ['#    ', '#    ', ' #   ', '  #  ', '   # ', '    #', '    #'],
  '*': ['     ', '# # #', ' ### ', '#####', ' ### ', '# # #', '     '],
  '%': ['##  #', '##  #', '   # ', '  #  ', ' #   ', '#  ##', '#  ##'],
  '(': ['   # ', '  #  ', ' #   ', ' #   ', ' #   ', '  #  ', '   # '],
  ')': [' #   ', '  #  ', '   # ', '   # ', '   # ', '  #  ', ' #   '],
  '[': [' ### ', ' #   ', ' #   ', ' #   ', ' #   ', ' #   ', ' ### '],
  ']': [' ### ', '   # ', '   # ', '   # ', '   # ', '   # ', ' ### '],
  '<': ['   # ', '  #  ', ' #   ', '#    ', ' #   ', '  #  ', '   # '],
  '>': [' #   ', '  #  ', '   # ', '    #', '   # ', '  #  ', ' #   '],
  '|': ['  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  _: ['     ', '     ', '     ', '     ', '     ', '     ', '#####'],
  '#': [' # # ', ' # # ', '#####', ' # # ', '#####', ' # # ', ' # # '],
  '@': [' ### ', '#   #', '# ###', '# # #', '# ###', '#    ', ' ### '],
  '&': [' ##  ', '#  # ', '#  # ', ' ##  ', '# # #', '#  # ', ' ## #'],
  "'": ['  #  ', '  #  ', '  #  ', '     ', '     ', '     ', '     '],
  '"': [' # # ', ' # # ', ' # # ', '     ', '     ', '     ', '     '],
  '°': [' ##  ', '#  # ', '#  # ', ' ##  ', '     ', '     ', '     '],
};

const GLYPH_W = 5;
const GLYPH_H = 7;
const FONT: Map<string, Uint8Array> = new Map();
for (const [ch, rows] of Object.entries(G)) {
  const bits = new Uint8Array(GLYPH_W * GLYPH_H);
  for (let y = 0; y < GLYPH_H; y++) {
    const row = rows[y] ?? '';
    for (let x = 0; x < GLYPH_W; x++) bits[y * GLYPH_W + x] = row[x] === '#' ? 1 : 0;
  }
  FONT.set(ch, bits);
}

// ── PNG encoder (pure TS, zlib-wrapped Bun.deflateSync) ────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf: Uint8Array): number => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const adler32 = (buf: Uint8Array): number => {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
};
const u32be = (n: number): Uint8Array => Uint8Array.from([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
const pngChunk = (type: string, data: Uint8Array): Uint8Array => {
  const typeBytes = Uint8Array.from([...type].map((c) => c.charCodeAt(0)));
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);
  const out = new Uint8Array(4 + body.length + 4);
  out.set(u32be(data.length), 0);
  out.set(body, 4);
  out.set(u32be(crc32(body)), 4 + body.length);
  return out;
};
/** Encode a tightly-packed W×H RGB8 buffer to a PNG byte array. */
export const encodePNG = (rgb: Uint8Array, w: number, h: number): Uint8Array => {
  // Prepend filter byte 0 to each scanline.
  const raw = new Uint8Array(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1);
  }
  const deflated = Bun.deflateSync(raw); // raw DEFLATE — wrap in a zlib container
  const zlib = new Uint8Array(2 + deflated.length + 4);
  zlib[0] = 0x78;
  zlib[1] = 0x01;
  zlib.set(deflated, 2);
  zlib.set(u32be(adler32(raw)), 2 + deflated.length);
  const ihdr = new Uint8Array(13);
  ihdr.set(u32be(w), 0);
  ihdr.set(u32be(h), 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = truecolour RGB
  const sig = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib), pngChunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const png = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    png.set(p, o);
    o += p.length;
  }
  return png;
};

// ── Render modes & encoder options ─────────────────────────────────────────────
// A character cell can pack more than the classic 1×2 upper-half-block. The
// higher modes quantise each cell to TWO colours (a foreground + a background)
// and pick the Unicode glyph whose lit sub-cells best match the pixels — trading
// a little CPU for 2×/3×/4× the spatial resolution.
//   half    1×2  upper-half-block ▀            — fastest, the default, photo-grade
//   quad    2×2  quadrant blocks  ▘▝▖▗▌▐▀▄▚▞…   — 2× horizontal detail
//   sextant 2×3  legacy sextants  (U+1FB00)    — 2×3 detail (Unicode 13)
//   braille 2×4  braille dots     (U+2800)     — 2×4 detail, fine etched look
//   ascii   1×2  luminance-ramp glyph, tinted  — classic colour-ASCII (1 char/cell)
export type TermMode = 'half' | 'quad' | 'sextant' | 'braille' | 'ascii';
// Diff strategy: exact = repaint changed cells; threshold = also skip cells whose
// colour drifted by ≤ `threshold` per channel (huge win on video/photographic
// content); none = repaint every cell every frame (robust on flaky terminals).
export type TermDiff = 'exact' | 'threshold' | 'none';
// Colour depth of the emitted escapes. Fewer bits → far fewer bytes per frame.
export type TermDepth = 'truecolor' | '256' | '16';
export interface TermOptions {
  mode?: TermMode;
  diff?: TermDiff;
  depth?: TermDepth;
  /** diff='threshold': max per-channel delta (0..255) a cell may drift before repaint. */
  threshold?: number;
}
/** [pxW, pxH] sub-pixels packed into one character cell. */
const MODE_DIMS: Record<TermMode, readonly [number, number]> = {
  half: [1, 2],
  quad: [2, 2],
  sextant: [2, 3],
  braille: [2, 4],
  ascii: [1, 2],
};

// ASCII luminance ramp (dark→bright); each cell becomes one tinted ramp glyph.
const RAMP = ' .:-=+*#%@';
const RAMP_BYTES = Array.from(RAMP, (c) => Uint8Array.of(c.charCodeAt(0)));
const RAMP_LAST = RAMP.length - 1;

const bytesOf = (s: string): Uint8Array => {
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
};

// Decimal byte sequences for 0..255 — kills the per-cell integer→string + division
// work that dominated the old colour-emit path.
const DEC: Uint8Array[] = (() => {
  const a: Uint8Array[] = new Array(256);
  for (let n = 0; n < 256; n++) a[n] = bytesOf('' + n);
  return a;
})();

// Static SGR prefixes (truecolour + 256/16-colour), copied wholesale per cell.
const B_FG_TC = bytesOf('\x1b[38;2;');
const B_BG_TC = bytesOf('\x1b[48;2;');
const B_MID_TC = bytesOf(';48;2;'); // combined fg→bg join (one escape sets both)
const B_FG_IDX = bytesOf('\x1b[38;5;');
const B_BG_IDX = bytesOf('\x1b[48;5;');
const B_MID_IDX = bytesOf(';48;5;');
const B_CSI = bytesOf('\x1b[');
const HOME_BYTES = bytesOf(HOME);

/** UTF-8 encode a single code point (≤4 bytes). */
const cpToUtf8 = (cp: number): Uint8Array => {
  if (cp < 0x80) return Uint8Array.of(cp);
  if (cp < 0x800) return Uint8Array.of(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
  if (cp < 0x10000) return Uint8Array.of(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
  return Uint8Array.of(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
};

// ── Glyph code-point tables, indexed by the lit sub-cell bitmask ───────────────
const HALF_GLYPH = cpToUtf8(0x2580); // ▀

// Quadrant blocks. bit0=TL bit1=TR bit2=BL bit3=BR.
const QUAD_CP = [0x20, 0x2598, 0x259d, 0x2580, 0x2596, 0x258c, 0x259e, 0x259b, 0x2597, 0x259a, 0x2590, 0x259c, 0x2584, 0x2599, 0x259f, 0x2588];
const QUAD_BYTES = QUAD_CP.map(cpToUtf8);

// Legacy-computing sextants (Unicode 13). bit0=TL bit1=TR bit2=ML bit3=MR bit4=BL
// bit5=BR — this matches the Unicode sextant bit-value convention exactly, so the
// glyph for mask v is U+1FB00 + v, except blank/full/left-col/right-col which
// reuse pre-existing block characters.
const sextantCp = (v: number): number => {
  if (v === 0) return 0x20; // blank
  if (v === 63) return 0x2588; // █ full
  if (v === 21) return 0x258c; // ▌ left column  (TL+ML+BL)
  if (v === 42) return 0x2590; // ▐ right column (TR+MR+BR)
  return 0x1fb00 + (v - 1 - (v > 21 ? 1 : 0) - (v > 42 ? 1 : 0));
};
const SEXT_BYTES = (() => {
  const a: Uint8Array[] = new Array(64);
  for (let v = 0; v < 64; v++) a[v] = cpToUtf8(sextantCp(v));
  return a;
})();

// Braille (U+2800). The mask IS the dot pattern, so glyph = U+2800 + mask.
const BRAILLE_BYTES = (() => {
  const a: Uint8Array[] = new Array(256);
  for (let v = 0; v < 256; v++) a[v] = cpToUtf8(0x2800 + v);
  return a;
})();

// Sub-cell index (sy*pxW+sx) → glyph bit position, per mode. Only braille's dot
// numbering is non-row-major.
const QUAD_BIT = [0, 1, 2, 3];
const SEXT_BIT = [0, 1, 2, 3, 4, 5];
const BRAILLE_BIT = [0, 3, 1, 4, 2, 5, 6, 7]; // dots 1,4,2,5,3,6,7,8

// ── Colour-depth quantisers ────────────────────────────────────────────────────
// xterm 256-colour: 6×6×6 cube (16..231) + 24-step grey ramp (232..255).
const CUBE = [0, 95, 135, 175, 215, 255];
const CH6 = new Uint8Array(256);
for (let v = 0; v < 256; v++) {
  let best = 0;
  let bd = 1e9;
  for (let i = 0; i < 6; i++) {
    const d = v - CUBE[i];
    const ad = d < 0 ? -d : d;
    if (ad < bd) {
      bd = ad;
      best = i;
    }
  }
  CH6[v] = best;
}
const quant256Exact = (r: number, g: number, b: number): number => {
  const mx = r > g ? (r > b ? r : b) : g > b ? g : b;
  const mn = r < g ? (r < b ? r : b) : g < b ? g : b;
  if (mx - mn < 8) {
    // near-grey → use the smoother 24-step grey ramp
    const gray = (r * 19595 + g * 38470 + b * 7471) >> 16;
    if (gray < 4) return 16;
    if (gray > 246) return 231;
    let lvl = (((gray - 8) / 10) + 0.5) | 0;
    if (lvl < 0) lvl = 0;
    else if (lvl > 23) lvl = 23;
    return 232 + lvl;
  }
  return 16 + 36 * CH6[r] + 6 * CH6[g] + CH6[b];
};
// Bake the (branchy) 256-colour mapping into a 15-bit LUT so the hot path is a
// single table lookup — same shape as the 16-colour LUT below.
const LUT256 = new Uint8Array(32768);
for (let r5 = 0; r5 < 32; r5++) {
  for (let g5 = 0; g5 < 32; g5++) {
    for (let b5 = 0; b5 < 32; b5++) {
      LUT256[(r5 << 10) | (g5 << 5) | b5] = quant256Exact((r5 << 3) | (r5 >> 2), (g5 << 3) | (g5 >> 2), (b5 << 3) | (b5 >> 2));
    }
  }
}
const quant256 = (r: number, g: number, b: number): number => LUT256[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
// 16-colour ANSI palette, with a 15-bit (32³) nearest-colour lookup table.
const PAL16: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0], [128, 0, 0], [0, 128, 0], [128, 128, 0], [0, 0, 128], [128, 0, 128], [0, 128, 128], [192, 192, 192],
  [128, 128, 128], [255, 0, 0], [0, 255, 0], [255, 255, 0], [0, 0, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255],
];
const LUT16 = new Uint8Array(32768);
for (let r5 = 0; r5 < 32; r5++) {
  for (let g5 = 0; g5 < 32; g5++) {
    for (let b5 = 0; b5 < 32; b5++) {
      const r = (r5 << 3) | (r5 >> 2);
      const g = (g5 << 3) | (g5 >> 2);
      const b = (b5 << 3) | (b5 >> 2);
      let best = 0;
      let bd = 1e18;
      for (let i = 0; i < 16; i++) {
        const p = PAL16[i];
        const dr = r - p[0], dg = g - p[1], db = b - p[2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      LUT16[(r5 << 10) | (g5 << 5) | b5] = best;
    }
  }
}
const quant16 = (r: number, g: number, b: number): number => LUT16[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];

/** Max per-channel |Δ| between a packed RGB and loose r,g,b — the threshold metric. */
const chDelta = (packed: number, r: number, g: number, b: number): number => {
  let d = ((packed >> 16) & 255) - r;
  let m = d < 0 ? -d : d;
  d = ((packed >> 8) & 255) - g;
  if (d < 0) d = -d;
  if (d > m) m = d;
  d = (packed & 255) - b;
  if (d < 0) d = -d;
  if (d > m) m = d;
  return m;
};

// Per-cell sub-pixel scratch (≤8 sub-pixels = braille's 2×4). buildFrame is
// synchronous and non-reentrant, so module-level scratch is safe and alloc-free.
const SUBR = new Uint8Array(8);
const SUBG = new Uint8Array(8);
const SUBB = new Uint8Array(8);
const SUBL = new Int32Array(8);

// ── The framebuffer / renderer ─────────────────────────────────────────────────
export class Term {
  readonly cols: number;
  readonly rows: number;
  // W/H/aspect/buf track the active mode and are re-derived by reconfigure(); the
  // CHARACTER-cell count (cols×rows) never changes, so the terminal layout is stable.
  W: number; // pixel grid width  = cols * pxW
  H: number; // pixel grid height = rows * pxH
  aspect: number; // W / H
  buf: Uint8Array; // RGB, length W*H*3

  // Encoder configuration (read by the HUD; switch at runtime via reconfigure()).
  mode: TermMode;
  diff: TermDiff;
  depth: TermDepth;
  threshold: number;

  // Mouse state (only populated when the demo opts in via `mouse: true`; updated
  // from xterm SGR mouse reports parsed off stdin). Coordinates are in PIXELS.
  mouseX = -1;
  mouseY = -1;
  mouseDown = false; // left button held
  mouseInside = false;
  mouseActive = false; // has any mouse event been seen this Term
  mouseSeq = 0; // increments on every mouse event (demos detect movement/idle via this)
  wheel = 0; // accumulated wheel ticks (+up / −down); demo may read and reset

  // Sub-cell packing for the active mode.
  private pxW: number;
  private pxH: number;
  private subN: number;
  private bitLayout: ReadonlyArray<number> | null; // null = half/ascii (no glyph table)
  private glyphTable: Uint8Array[] | null; // null = half/ascii

  // Per-cell diff cache. For diff='exact'/'none' these hold the last EMITTED key
  // (packed RGB for truecolour, palette index otherwise); for diff='threshold'
  // prevFg/prevBg hold the last-SENT source RGB so drift is bounded to `threshold`.
  private prevFg: Int32Array;
  private prevBg: Int32Array;
  private prevGlyph: Int32Array; // last-emitted glyph mask per cell (half: unused)
  private firstFrame = true;
  // SGR pen state — the colours the terminal currently holds (persist across frames).
  private penFg = -1;
  private penBg = -1;

  // Fast output byte buffer.
  private out = new Uint8Array(1 << 18);
  private outPos = 0;

  constructor(cols: number, rows: number, opts?: TermOptions) {
    this.mode = opts?.mode ?? 'half';
    this.diff = opts?.diff ?? 'exact';
    this.depth = opts?.depth ?? 'truecolor';
    this.threshold = opts?.threshold ?? 8;
    const [pw, ph] = MODE_DIMS[this.mode];
    this.pxW = pw;
    this.pxH = ph;
    this.subN = pw * ph;
    this.cols = cols;
    this.rows = rows;
    this.W = cols * pw;
    this.H = rows * ph;
    this.aspect = this.W / this.H;
    this.buf = new Uint8Array(this.W * this.H * 3);
    const cells = cols * rows;
    this.prevFg = new Int32Array(cells).fill(-1);
    this.prevBg = new Int32Array(cells).fill(-1);
    this.prevGlyph = new Int32Array(cells).fill(-1);
    switch (this.mode) {
      case 'quad':
        this.bitLayout = QUAD_BIT;
        this.glyphTable = QUAD_BYTES;
        break;
      case 'sextant':
        this.bitLayout = SEXT_BIT;
        this.glyphTable = SEXT_BYTES;
        break;
      case 'braille':
        this.bitLayout = BRAILLE_BIT;
        this.glyphTable = BRAILLE_BYTES;
        break;
      default:
        this.bitLayout = null;
        this.glyphTable = null;
    }
  }

  /**
   * Switch mode / diff / depth / threshold on a LIVE Term. Re-derives the pixel grid
   * (reallocating buf only when W or H changes — i.e. when the mode changes its
   * sub-cell packing) and forces a full repaint. The character-cell count (cols×rows)
   * is invariant, so the terminal layout never shifts. After a mode change the caller
   * must redraw / re-feed buf at the new t.W×t.H resolution.
   */
  reconfigure(opts: TermOptions): void {
    if (opts.mode !== undefined) this.mode = opts.mode;
    if (opts.diff !== undefined) this.diff = opts.diff;
    if (opts.depth !== undefined) this.depth = opts.depth;
    if (opts.threshold !== undefined) this.threshold = opts.threshold;
    const [pw, ph] = MODE_DIMS[this.mode];
    this.pxW = pw;
    this.pxH = ph;
    this.subN = pw * ph;
    const W = this.cols * pw;
    const H = this.rows * ph;
    if (W !== this.W || H !== this.H) {
      this.W = W;
      this.H = H;
      this.aspect = W / H;
      this.buf = new Uint8Array(W * H * 3);
    }
    switch (this.mode) {
      case 'quad':
        this.bitLayout = QUAD_BIT;
        this.glyphTable = QUAD_BYTES;
        break;
      case 'sextant':
        this.bitLayout = SEXT_BIT;
        this.glyphTable = SEXT_BYTES;
        break;
      case 'braille':
        this.bitLayout = BRAILLE_BIT;
        this.glyphTable = BRAILLE_BYTES;
        break;
      default:
        this.bitLayout = null;
        this.glyphTable = null;
    }
    this.invalidate();
  }

  // — pixel ops (bounds-checked; hot enough to inline-ish) —
  clear(r = 0, g = 0, b = 0): void {
    const buf = this.buf;
    if (r === g && g === b) {
      buf.fill(r);
      return;
    }
    for (let i = 0; i < buf.length; i += 3) {
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
    }
  }
  setPixel(x: number, y: number, r: number, g: number, b: number): void {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const i = (y * this.W + x) * 3;
    this.buf[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    this.buf[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    this.buf[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  addPixel(x: number, y: number, r: number, g: number, b: number): void {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const i = (y * this.W + x) * 3;
    const buf = this.buf;
    let nr = buf[i] + r, ng = buf[i + 1] + g, nb = buf[i + 2] + b;
    buf[i] = nr > 255 ? 255 : nr;
    buf[i + 1] = ng > 255 ? 255 : ng;
    buf[i + 2] = nb > 255 ? 255 : nb;
  }
  blendPixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H || a <= 0) return;
    if (a >= 1) return this.setPixel(x, y, r, g, b);
    const i = (y * this.W + x) * 3;
    const buf = this.buf;
    const ia = 1 - a;
    buf[i] = (buf[i] * ia + r * a) | 0;
    buf[i + 1] = (buf[i + 1] * ia + g * a) | 0;
    buf[i + 2] = (buf[i + 2] * ia + b * a) | 0;
  }
  /** Alpha-darkened rectangle (HUD plate). */
  plate(x: number, y: number, w: number, h: number, a = 0.55): void {
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) this.blendPixel(x + k, y + j, 0, 0, 0, a);
  }

  /** Draw text with the 5×7 font into the pixel buffer. Returns advance width. */
  text(px: number, py: number, str: string, r: number, g: number, b: number, scale = 1, shadow = true): number {
    let x = px;
    for (const raw of str) {
      const ch = FONT.has(raw) ? raw : FONT.has(raw.toUpperCase()) ? raw.toUpperCase() : ' ';
      const bits = FONT.get(ch)!;
      for (let gy = 0; gy < GLYPH_H; gy++) {
        for (let gx = 0; gx < GLYPH_W; gx++) {
          if (!bits[gy * GLYPH_W + gx]) continue;
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const X = x + gx * scale + sx;
              const Y = py + gy * scale + sy;
              if (shadow) this.setPixel(X + 1, Y + 1, 0, 0, 0);
              this.setPixel(X, Y, r, g, b);
            }
          }
        }
      }
      x += (GLYPH_W + 1) * scale;
    }
    return x - px;
  }
  static textWidth(str: string, scale = 1): number {
    return str.length * (GLYPH_W + 1) * scale;
  }

  // — frame emission (diff + run-length pen) —
  private ensure(n: number): void {
    if (this.outPos + n <= this.out.length) return;
    let cap = this.out.length * 2;
    while (cap < this.outPos + n) cap *= 2;
    const nb = new Uint8Array(cap);
    nb.set(this.out.subarray(0, this.outPos));
    this.out = nb;
  }
  private putByte(b: number): void {
    this.ensure(1);
    this.out[this.outPos++] = b;
  }
  private putAscii(s: string): void {
    this.ensure(s.length);
    const o = this.out;
    let p = this.outPos;
    for (let i = 0; i < s.length; i++) o[p++] = s.charCodeAt(i);
    this.outPos = p;
  }
  private _digits = new Uint8Array(12);
  private putUint(n: number): void {
    if (n < 0) n = 0;
    let len = 0;
    const d = this._digits;
    do {
      d[len++] = 48 + (n % 10);
      n = (n / 10) | 0;
    } while (n > 0);
    this.ensure(len);
    const o = this.out;
    let p = this.outPos;
    for (let i = len - 1; i >= 0; i--) o[p++] = d[i];
    this.outPos = p;
  }

  /** Append a small byte array (escape prefix, decimal, glyph) to the out buffer. */
  private putBytes(b: Uint8Array): void {
    const n = b.length;
    this.ensure(n);
    const o = this.out;
    let p = this.outPos;
    for (let i = 0; i < n; i++) o[p++] = b[i];
    this.outPos = p;
  }
  /** Append the decimal byte sequence for a colour component (0..255), table-driven. */
  private putDec(n: number): void {
    this.putBytes(DEC[n]);
  }
  /** Emit a cursor move to 1-based (row,col): ESC[row;colH. */
  private emitCursor(row: number, col: number): void {
    this.putBytes(B_CSI);
    this.putUint(row);
    this.putByte(59); // ;
    this.putUint(col);
    this.putByte(72); // H
  }
  /**
   * Emit the minimal SGR to set the pen to (fg,bg). When BOTH differ from the
   * current pen they go out as ONE combined escape (`…38;2;…;48;2;…m`), halving
   * the per-cell escape overhead vs two sequences. `fg`/`bg` are packed RGB for
   * truecolour, palette indices otherwise.
   */
  private putColor(fg: number, bg: number): void {
    const needFg = fg !== this.penFg;
    const needBg = bg !== this.penBg;
    if (!needFg && !needBg) return;
    if (this.depth === 'truecolor') {
      if (needFg) {
        this.putBytes(B_FG_TC);
        this.putDec((fg >> 16) & 255);
        this.putByte(59);
        this.putDec((fg >> 8) & 255);
        this.putByte(59);
        this.putDec(fg & 255);
        if (needBg) {
          this.putBytes(B_MID_TC);
          this.putDec((bg >> 16) & 255);
          this.putByte(59);
          this.putDec((bg >> 8) & 255);
          this.putByte(59);
          this.putDec(bg & 255);
        }
        this.putByte(109); // m
      } else {
        this.putBytes(B_BG_TC);
        this.putDec((bg >> 16) & 255);
        this.putByte(59);
        this.putDec((bg >> 8) & 255);
        this.putByte(59);
        this.putDec(bg & 255);
        this.putByte(109);
      }
    } else {
      // palette index (256 or 16 colour)
      if (needFg) {
        this.putBytes(B_FG_IDX);
        this.putDec(fg);
        if (needBg) {
          this.putBytes(B_MID_IDX);
          this.putDec(bg);
        }
        this.putByte(109);
      } else {
        this.putBytes(B_BG_IDX);
        this.putDec(bg);
        this.putByte(109);
      }
    }
    this.penFg = fg;
    this.penBg = bg;
  }

  /** Build the diffed frame into the byte buffer (no I/O). Returns byte length. */
  buildFrame(): number {
    this.outPos = 0;
    this.putBytes(HOME_BYTES);
    if (this.mode === 'half') this.emitHalf();
    else if (this.mode === 'ascii') this.emitAscii();
    else this.emitMulti();
    this.firstFrame = false;
    return this.outPos;
  }

  /**
   * Colour-ASCII path: each cell averages its 1×2 sub-pixels, picks a glyph from a
   * dark→bright luminance ramp, and tints it with the average colour over a black
   * background — the classic ASCII-video look, but in truecolor.
   */
  private emitAscii(): void {
    const { cols, rows, W, buf, prevFg, prevGlyph } = this;
    const first = this.firstFrame;
    const truecolor = this.depth === 'truecolor';
    const d256 = this.depth === '256';
    const thr = this.diff === 'threshold' ? this.threshold : -1;
    const none = this.diff === 'none';
    const emitBg = truecolor ? 0 : d256 ? quant256(0, 0, 0) : quant16(0, 0, 0); // black
    let curRow = 0;
    let curCol = 0;
    for (let r = 0; r < rows; r++) {
      const topBase = r * 2 * W * 3;
      const botBase = (r * 2 + 1) * W * 3;
      const cellBase = r * cols;
      for (let c = 0; c < cols; c++) {
        const ti = topBase + c * 3;
        const bi = botBase + c * 3;
        const rr = (buf[ti] + buf[bi]) >> 1;
        const gg = (buf[ti + 1] + buf[bi + 1]) >> 1;
        const bb = (buf[ti + 2] + buf[bi + 2]) >> 1;
        const lum = (rr * 299 + gg * 587 + bb * 114) / 1000; // 0..255
        let gi = ((lum * RAMP_LAST) / 255 + 0.5) | 0;
        if (gi < 0) gi = 0;
        else if (gi > RAMP_LAST) gi = RAMP_LAST;
        const fgRgb = (rr << 16) | (gg << 8) | bb;
        const emitFg = truecolor ? fgRgb : d256 ? quant256(rr, gg, bb) : quant16(rr, gg, bb);
        const idx = cellBase + c;
        if (!first && !none) {
          if (thr < 0) {
            if (prevGlyph[idx] === gi && prevFg[idx] === emitFg) continue;
            prevFg[idx] = emitFg;
          } else {
            const pf = prevFg[idx];
            if (prevGlyph[idx] === gi && pf >= 0 && chDelta(pf, rr, gg, bb) <= thr) continue;
            prevFg[idx] = fgRgb;
          }
        } else if (thr < 0) {
          prevFg[idx] = emitFg;
        } else {
          prevFg[idx] = fgRgb;
        }
        prevGlyph[idx] = gi;
        if (curRow !== r || curCol !== c) {
          this.emitCursor(r + 1, c + 1);
          curRow = r;
          curCol = c;
        }
        this.putColor(emitFg, emitBg);
        this.putBytes(RAMP_BYTES[gi]);
        curCol++;
        if (curCol >= cols) curRow = -1;
      }
    }
  }

  /**
   * The bytes produced by the most recent buildFrame(), as a view (no copy) over
   * the internal buffer — valid until the next buildFrame/present. Use this to
   * record frames, pipe to a socket, or write your own flush.
   */
  frameBytes(): Uint8Array {
    return this.out.subarray(0, this.outPos);
  }

  /** Classic 1×2 upper-half-block (top pixel → fg, bottom → bg). */
  private emitHalf(): void {
    // Specialise the overwhelmingly-common truecolour + exact/none case into a
    // minimal-work loop (cheap key compare → continue); palette / threshold take
    // the general path where the extra quantise/drift maths actually earns its keep.
    if (this.depth === 'truecolor' && this.diff !== 'threshold') this.emitHalfFast();
    else this.emitHalfGeneral();
  }

  /** Hottest path: half-block, truecolour, exact (or none) diff. */
  private emitHalfFast(): void {
    const { cols, rows, W, buf, prevFg, prevBg } = this;
    const skip = !this.firstFrame && this.diff !== 'none';
    let curRow = 0;
    let curCol = 0;
    for (let r = 0; r < rows; r++) {
      const topBase = r * 2 * W * 3;
      const botBase = (r * 2 + 1) * W * 3;
      const cellBase = r * cols;
      for (let c = 0; c < cols; c++) {
        const ti = topBase + c * 3;
        const bi = botBase + c * 3;
        const fgKey = (buf[ti] << 16) | (buf[ti + 1] << 8) | buf[ti + 2];
        const bgKey = (buf[bi] << 16) | (buf[bi + 1] << 8) | buf[bi + 2];
        const idx = cellBase + c;
        if (skip && prevFg[idx] === fgKey && prevBg[idx] === bgKey) continue;
        prevFg[idx] = fgKey;
        prevBg[idx] = bgKey;
        if (curRow !== r || curCol !== c) {
          this.emitCursor(r + 1, c + 1);
          curRow = r;
          curCol = c;
        }
        this.putColor(fgKey, bgKey);
        this.putBytes(HALF_GLYPH);
        curCol++;
        if (curCol >= cols) curRow = -1; // autowrap off → force a move next
      }
    }
  }

  /** General half-block path: palette depths and/or threshold diffing. */
  private emitHalfGeneral(): void {
    const { cols, rows, W, buf, prevFg, prevBg } = this;
    const first = this.firstFrame;
    const truecolor = this.depth === 'truecolor';
    const d256 = this.depth === '256';
    const thr = this.diff === 'threshold' ? this.threshold : -1;
    const none = this.diff === 'none';
    let curRow = 0;
    let curCol = 0;
    for (let r = 0; r < rows; r++) {
      const topBase = r * 2 * W * 3;
      const botBase = (r * 2 + 1) * W * 3;
      const cellBase = r * cols;
      for (let c = 0; c < cols; c++) {
        const ti = topBase + c * 3;
        const bi = botBase + c * 3;
        const tr = buf[ti], tg = buf[ti + 1], tb = buf[ti + 2];
        const br = buf[bi], bg = buf[bi + 1], bb = buf[bi + 2];
        const fgRgb = (tr << 16) | (tg << 8) | tb;
        const bgRgb = (br << 16) | (bg << 8) | bb;
        const emitFg = truecolor ? fgRgb : d256 ? quant256(tr, tg, tb) : quant16(tr, tg, tb);
        const emitBg = truecolor ? bgRgb : d256 ? quant256(br, bg, bb) : quant16(br, bg, bb);
        const idx = cellBase + c;
        if (!first && !none) {
          if (thr < 0) {
            if (prevFg[idx] === emitFg && prevBg[idx] === emitBg) continue;
            prevFg[idx] = emitFg;
            prevBg[idx] = emitBg;
          } else {
            const pf = prevFg[idx];
            const pb = prevBg[idx];
            if (pf >= 0 && pb >= 0 && chDelta(pf, tr, tg, tb) <= thr && chDelta(pb, br, bg, bb) <= thr) continue;
            prevFg[idx] = fgRgb;
            prevBg[idx] = bgRgb;
          }
        } else if (thr < 0) {
          prevFg[idx] = emitFg;
          prevBg[idx] = emitBg;
        } else {
          prevFg[idx] = fgRgb;
          prevBg[idx] = bgRgb;
        }
        if (curRow !== r || curCol !== c) {
          this.emitCursor(r + 1, c + 1);
          curRow = r;
          curCol = c;
        }
        this.putColor(emitFg, emitBg);
        this.putBytes(HALF_GLYPH);
        curCol++;
        if (curCol >= cols) curRow = -1;
      }
    }
  }

  /**
   * General path for quad/sextant/braille: gather the cell's sub-pixels, split
   * them into a bright (fg) and dark (bg) group at the mid-luma, average each
   * group, and pick the glyph whose lit sub-cells match the bright group.
   */
  private emitMulti(): void {
    const { cols, rows, W, buf, pxW, pxH, subN, prevFg, prevBg, prevGlyph } = this;
    const bitLayout = this.bitLayout!;
    const glyphTable = this.glyphTable!;
    const first = this.firstFrame;
    const truecolor = this.depth === 'truecolor';
    const d256 = this.depth === '256';
    const thr = this.diff === 'threshold' ? this.threshold : -1;
    const none = this.diff === 'none';
    const solidL = 6 * 1000; // luma span below which a cell is treated as solid
    let curRow = 0;
    let curCol = 0;
    for (let r = 0; r < rows; r++) {
      const cellBase = r * cols;
      const pyBase = r * pxH;
      for (let c = 0; c < cols; c++) {
        const pxBase = c * pxW;
        // Gather sub-pixels + per-sub luma; track min/max luma.
        let mnL = 0x7fffffff;
        let mxL = -1;
        for (let sy = 0; sy < pxH; sy++) {
          const rowOff = ((pyBase + sy) * W + pxBase) * 3;
          for (let sx = 0; sx < pxW; sx++) {
            const o = rowOff + sx * 3;
            const rr = buf[o], gg = buf[o + 1], bbv = buf[o + 2];
            const si = sy * pxW + sx;
            SUBR[si] = rr;
            SUBG[si] = gg;
            SUBB[si] = bbv;
            const l = rr * 299 + gg * 587 + bbv * 114;
            SUBL[si] = l;
            if (l < mnL) mnL = l;
            if (l > mxL) mxL = l;
          }
        }
        let fgr: number, fgg: number, fgb: number, bgr: number, bgg: number, bgb: number, mask: number;
        if (mxL - mnL < solidL) {
          // Solid cell → blank glyph, colour carried entirely by the background.
          let sr = 0, sg = 0, sb = 0;
          for (let s = 0; s < subN; s++) {
            sr += SUBR[s];
            sg += SUBG[s];
            sb += SUBB[s];
          }
          fgr = bgr = (sr / subN) | 0;
          fgg = bgg = (sg / subN) | 0;
          fgb = bgb = (sb / subN) | 0;
          mask = 0;
        } else {
          const midL = (mnL + mxL) >> 1;
          let fr = 0, fg2 = 0, fb = 0, fn = 0;
          let xr = 0, xg = 0, xb = 0, xn = 0;
          mask = 0;
          for (let s = 0; s < subN; s++) {
            if (SUBL[s] >= midL) {
              fr += SUBR[s];
              fg2 += SUBG[s];
              fb += SUBB[s];
              fn++;
              mask |= 1 << bitLayout[s];
            } else {
              xr += SUBR[s];
              xg += SUBG[s];
              xb += SUBB[s];
              xn++;
            }
          }
          fgr = (fr / fn) | 0;
          fgg = (fg2 / fn) | 0;
          fgb = (fb / fn) | 0;
          bgr = (xr / xn) | 0;
          bgg = (xg / xn) | 0;
          bgb = (xb / xn) | 0;
        }
        const fgRgb = (fgr << 16) | (fgg << 8) | fgb;
        const bgRgb = (bgr << 16) | (bgg << 8) | bgb;
        const emitFg = truecolor ? fgRgb : d256 ? quant256(fgr, fgg, fgb) : quant16(fgr, fgg, fgb);
        const emitBg = truecolor ? bgRgb : d256 ? quant256(bgr, bgg, bgb) : quant16(bgr, bgg, bgb);
        const idx = cellBase + c;
        if (!first && !none) {
          if (thr < 0) {
            if (prevGlyph[idx] === mask && prevFg[idx] === emitFg && prevBg[idx] === emitBg) continue;
            prevFg[idx] = emitFg;
            prevBg[idx] = emitBg;
          } else {
            const pf = prevFg[idx];
            const pb = prevBg[idx];
            if (prevGlyph[idx] === mask && pf >= 0 && pb >= 0 && chDelta(pf, fgr, fgg, fgb) <= thr && chDelta(pb, bgr, bgg, bgb) <= thr) continue;
            prevFg[idx] = fgRgb;
            prevBg[idx] = bgRgb;
          }
        } else if (thr < 0) {
          prevFg[idx] = emitFg;
          prevBg[idx] = emitBg;
        } else {
          prevFg[idx] = fgRgb;
          prevBg[idx] = bgRgb;
        }
        prevGlyph[idx] = mask;
        if (curRow !== r || curCol !== c) {
          this.emitCursor(r + 1, c + 1);
          curRow = r;
          curCol = c;
        }
        this.putColor(emitFg, emitBg);
        this.putBytes(glyphTable[mask]);
        curCol++;
        if (curCol >= cols) curRow = -1;
      }
    }
  }

  /** Build + flush the frame to the terminal in one write. */
  present(): void {
    this.buildFrame();
    process.stdout.write(this.out.subarray(0, this.outPos));
  }

  /** Force the next frame to fully repaint (after a resize / screen disturbance). */
  invalidate(): void {
    this.firstFrame = true;
    this.penFg = -1;
    this.penBg = -1;
    this.prevFg.fill(-1);
    this.prevBg.fill(-1);
    this.prevGlyph.fill(-1);
  }

  /** Encode the current pixel buffer to a PNG byte array. */
  toPNG(): Uint8Array {
    return encodePNG(this.buf, this.W, this.H);
  }
}

// ── Console lifecycle ──────────────────────────────────────────────────────────
interface ConsoleState {
  handle: bigint;
  savedMode: number;
  savedCp: number;
  restored: boolean;
  mouse: boolean;
}
let consoleState: ConsoleState | null = null;

const setupConsole = (title?: string, mouse = false): void => {
  Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode', 'GetConsoleOutputCP', 'SetConsoleOutputCP', 'SetConsoleTitleW', 'GetConsoleScreenBufferInfo']);
  const handle = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
  const modeBuf = Buffer.alloc(4);
  const gotMode = Kernel32.GetConsoleMode(handle, modeBuf.ptr) ? modeBuf.readUInt32LE(0) : 0;
  Kernel32.SetConsoleMode(handle, gotMode | ENABLE_PROCESSED_OUTPUT | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  const savedCp = Kernel32.GetConsoleOutputCP();
  Kernel32.SetConsoleOutputCP(CP_UTF8);
  if (title) Kernel32.SetConsoleTitleW(Buffer.from(`${title}\0`, 'utf16le').ptr);
  consoleState = { handle, savedMode: gotMode, savedCp, restored: false, mouse };
  process.stdout.write(ALT_SCREEN_ON + HIDE_CURSOR + AUTOWRAP_OFF + (mouse ? MOUSE_ON : '') + CLEAR + HOME);
};

const restoreConsole = (): void => {
  if (!consoleState || consoleState.restored) return;
  consoleState.restored = true;
  process.stdout.write((consoleState.mouse ? MOUSE_OFF : '') + RESET + AUTOWRAP_ON + SHOW_CURSOR + ALT_SCREEN_OFF);
  Kernel32.SetConsoleMode(consoleState.handle, consoleState.savedMode);
  Kernel32.SetConsoleOutputCP(consoleState.savedCp);
};

const detectSize = (): { cols: number; rows: number } => {
  let cols = envNum('TERM_COLS', NaN);
  let rows = envNum('TERM_ROWS', NaN);
  if (!Number.isFinite(cols) || !Number.isFinite(rows)) {
    const handle = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
    const csbi = Buffer.alloc(22);
    if (Kernel32.GetConsoleScreenBufferInfo(handle, csbi.ptr)) {
      const view = new DataView(csbi.buffer);
      const w = view.getInt16(14, true) - view.getInt16(10, true) + 1;
      const h = view.getInt16(16, true) - view.getInt16(12, true) + 1;
      if (!Number.isFinite(cols)) cols = w;
      if (!Number.isFinite(rows)) rows = h;
    }
  }
  if (!Number.isFinite(cols)) cols = process.stdout.columns || 120;
  if (!Number.isFinite(rows)) rows = process.stdout.rows || 40;
  // Leave the bottom row free so a final newline never scrolls the image.
  cols = Math.max(20, Math.min(cols | 0, 400));
  rows = Math.max(8, Math.min((rows | 0) - 1, 200));
  return { cols, rows };
};

/**
 * Precise frame pacing on Windows. `Bun.sleep` and the default OS timer quantize
 * to the ~15.6ms system tick, so a 16.67ms (60fps) wait rounds up to ~31ms — i.e.
 * a 60fps cap actually runs at ~30fps. A high-resolution waitable timer (Win10
 * 1803+) waits accurately without busy-spinning a core. Returns a blocking
 * wait(ms) function, or null if the high-res timer is unavailable (older Windows),
 * in which case callers fall back to Bun.sleep.
 */
export const makeFrameWaiter = (): ((ms: number) => void) | null => {
  try {
    const k = dlopen('kernel32.dll', {
      CreateWaitableTimerExW: { args: ['ptr', 'ptr', 'u32', 'u32'], returns: 'ptr' },
      SetWaitableTimer: { args: ['ptr', 'ptr', 'i32', 'ptr', 'ptr', 'i32'], returns: 'i32' },
      WaitForSingleObject: { args: ['ptr', 'u32'], returns: 'u32' },
    });
    const TIMER_ALL_ACCESS = 0x1f0003;
    const HIGH_RES = 0x2; // CREATE_WAITABLE_TIMER_HIGH_RESOLUTION
    const h = k.symbols.CreateWaitableTimerExW(null, null, HIGH_RES, TIMER_ALL_ACCESS);
    if (!h) return null;
    const due = new BigInt64Array(1);
    return (ms: number): void => {
      if (ms <= 0) return;
      due[0] = BigInt(-Math.round(ms * 1e4)); // relative, negative, 100ns units
      k.symbols.SetWaitableTimer(h, due, 0, null, null, 0);
      k.symbols.WaitForSingleObject(h, 0xffffffff);
    };
  } catch {
    return null;
  }
};

// ── Demo runtime ───────────────────────────────────────────────────────────────
export interface DemoSpec {
  title: string;
  /** Extra HUD caption shown under the FPS line (e.g. controls / credit). */
  hud?: string;
  init?: (t: Term) => void | Promise<void>;
  /**
   * Called when the terminal is resized (live mode). Receives a fresh Term of
   * the new size. If omitted, `init` is re-run. Prefer a FIXED internal sim
   * resolution that you sample to t.W/t.H each frame so resize is seamless.
   */
  resize?: (t: Term) => void | Promise<void>;
  frame: (t: Term, time: number, dt: number, frame: number) => void;
  /** Default seconds to advance before a CAPTURE_PNG. */
  captureT?: number;
  /** Live frame-rate cap (0 = uncapped, show true fps). */
  targetFps?: number;
  /** Draw the built-in FPS HUD (default true). */
  drawHud?: boolean;
  /** Handle a key press in live mode (lowercased; 'esc','space','up'…). */
  onKey?: (key: string, t: Term) => void;
  /**
   * Enable xterm mouse reporting (hover + buttons + wheel). When true, the live
   * loop populates t.mouseX/mouseY (pixels), t.mouseDown, t.mouseInside,
   * t.mouseActive, t.mouseSeq and t.wheel. Off by default so other demos leave
   * the terminal's normal mouse selection/scroll alone.
   */
  mouse?: boolean;
  /**
   * Whether 'q'/'Q' quits the demo (default true). Set false when the demo uses
   * Q as a control key — ESC and Ctrl-C ALWAYS quit regardless of this flag.
   */
  quitOnQ?: boolean;
  /**
   * Whether the spacebar toggles pause (default true). Typing demos that need
   * space as a literal character set this false and handle 'space' in onKey.
   */
  pauseOnSpace?: boolean;
  /** Sub-cell packing: 'half' (default) | 'quad' | 'sextant' | 'braille'. Env: TERM_MODE. */
  mode?: TermMode;
  /** Diff strategy: 'exact' (default) | 'threshold' | 'none'. Env: TERM_DIFF. */
  diff?: TermDiff;
  /** Colour depth: 'truecolor' (default) | '256' | '16'. Env: TERM_DEPTH. */
  depth?: TermDepth;
  /** Per-channel drift tolerance for diff='threshold' (0..255, default 8). Env: TERM_THRESHOLD. */
  threshold?: number;
}

/** Merge per-demo defaults with env overrides (env wins) into Term options. */
const resolveOptions = (spec: DemoSpec): TermOptions => {
  const pick = <T extends string>(envKey: string, valid: readonly T[], fallback: T | undefined): T | undefined => {
    const v = env(envKey) as T | undefined;
    return v !== undefined && valid.includes(v) ? v : fallback;
  };
  const mode = pick<TermMode>('TERM_MODE', ['half', 'quad', 'sextant', 'braille'], spec.mode);
  const diff = pick<TermDiff>('TERM_DIFF', ['exact', 'threshold', 'none'], spec.diff);
  const depth = pick<TermDepth>('TERM_DEPTH', ['truecolor', '256', '16'], spec.depth);
  const threshold = env('TERM_THRESHOLD') !== undefined ? envNum('TERM_THRESHOLD', 8) : spec.threshold;
  return { mode, diff, depth, threshold };
};

const drawHud = (t: Term, spec: DemoSpec, fps: number, ms: number, extra?: string): void => {
  const line1 = `${spec.title.toUpperCase()}`;
  const tag = `${t.mode.toUpperCase()}${t.diff !== 'exact' ? '/' + t.diff.toUpperCase() : ''}${t.depth !== 'truecolor' ? '/' + t.depth : ''}`;
  const line2 = `FPS ${fps.toFixed(0).padStart(3)}  ${ms.toFixed(1)}MS  ${t.W}X${t.H}  ${tag}`;
  const line3 = extra ?? spec.hud ?? '';
  const w = Math.max(Term.textWidth(line1), Term.textWidth(line2), Term.textWidth(line3)) + 6;
  const hpx = line3 ? 30 : 22;
  t.plate(2, 2, w, hpx, 0.5);
  // FPS goes green ≥60, amber 30-60, red <30 — the headline metric, legible at a glance.
  const fc: [number, number, number] = fps >= 60 ? [120, 255, 140] : fps >= 30 ? [255, 200, 90] : [255, 110, 110];
  t.text(5, 4, line1, 235, 130, 90, 1); // Anthropic-ish clay for the title
  t.text(5, 12, line2, fc[0], fc[1], fc[2], 1);
  if (line3) t.text(5, 20, line3, 150, 150, 165, 1);
};

export async function runDemo(spec: DemoSpec): Promise<void> {
  const capturePath = env('CAPTURE_PNG');
  const bench = env('BENCH') === '1';
  const captureFps = envNum('CAPTURE_FPS', 60);
  const fixedDt = 1 / captureFps;
  const opts = resolveOptions(spec);

  // ── Capture: deterministic, headless, writes PNG(s) and exits ──────────────
  if (capturePath) {
    const { cols, rows } = (() => {
      const c = envNum('TERM_COLS', 160);
      const r = envNum('TERM_ROWS', 50);
      return { cols: Math.max(20, c | 0), rows: Math.max(8, r | 0) };
    })();
    const t = new Term(cols, rows, opts);
    await spec.init?.(t);
    const captureT = envNum('CAPTURE_T', spec.captureT ?? 4);
    const nFrames = Math.max(1, envNum('CAPTURE_FRAMES', 1));
    const shots: number[] = [];
    for (let i = 0; i < nFrames; i++) shots.push(nFrames === 1 ? captureT : (captureT * i) / (nFrames - 1));
    // Snapshot the (HUD-free) sim buffer, overlay HUD only for the PNG, then restore
    // so feedback-buffer demos (fire, rain) are never polluted by the overlay.
    const writeShot = async (idx: number): Promise<void> => {
      const save = t.buf.slice();
      if (spec.drawHud !== false) drawHud(t, spec, captureFps, fixedDt * 1000, spec.hud);
      const png = t.toPNG();
      const path = nFrames === 1 ? capturePath : capturePath.replace(/(\.png)?$/i, `.${idx}.png`);
      await Bun.write(path, png);
      t.buf.set(save);
    };
    let shot = 0;
    let time = 0;
    let frame = 0;
    const total = Math.max(1, Math.round(captureT / fixedDt));
    for (let f = 0; f <= total && shot < shots.length; f++) {
      spec.frame(t, time, f === 0 ? 0 : fixedDt, frame); // advance + draw exactly once
      while (shot < shots.length && time >= shots[shot] - 1e-9) {
        await writeShot(shot);
        shot++;
      }
      time += fixedDt;
      frame++;
    }
    while (shot < shots.length) {
      await writeShot(shot);
      shot++;
    }
    process.stdout.write(`captured ${nFrames} frame(s) → ${capturePath} (${cols}x${rows} cells, ${t.W}x${t.H}px)\n`);
    return;
  }

  // ── Bench: measure frame-production ceiling, print JSON, exit ───────────────
  if (bench) {
    const cols = Math.max(20, envNum('TERM_COLS', 160) | 0);
    const rows = Math.max(8, envNum('TERM_ROWS', 50) | 0);
    const t = new Term(cols, rows, opts);
    await spec.init?.(t);
    const N = Math.max(60, envNum('BENCH_FRAMES', 600) | 0);
    // Warm up.
    for (let i = 0; i < 30; i++) {
      spec.frame(t, i * fixedDt, fixedDt, i);
      t.buildFrame();
    }
    const start = Bun.nanoseconds();
    for (let i = 0; i < N; i++) {
      spec.frame(t, i * fixedDt, fixedDt, i);
      if (spec.drawHud !== false) drawHud(t, spec, 999, fixedDt * 1000);
      t.buildFrame();
    }
    const secs = (Bun.nanoseconds() - start) / 1e9;
    const fps = N / secs;
    process.stdout.write(
      `${JSON.stringify({ demo: spec.title, fps: +fps.toFixed(1), msPerFrame: +((secs / N) * 1000).toFixed(3), frames: N, cols, rows, px: `${t.W}x${t.H}` })}\n`,
    );
    return;
  }

  // ── Live ────────────────────────────────────────────────────────────────────
  setupConsole(spec.title, spec.mouse === true);
  const { cols, rows } = detectSize();
  let t = new Term(cols, rows, opts);
  await spec.init?.(t);

  let paused = false;
  let running = true;
  const stop = (): void => {
    running = false;
  };

  const ARROWS: Record<string, string> = { A: 'up', B: 'down', C: 'right', D: 'left' };
  // Apply one SGR mouse report `\x1b[<b;col;row(M|m)` to the current Term.
  const applyMouse = (b: number, col: number, row: number, release: boolean): void => {
    const motion = (b & 32) !== 0;
    const wheel = (b & 64) !== 0;
    const button = b & 3;
    const pxw = t.W / t.cols; // sub-pixels per cell (mode-dependent)
    const pxh = t.H / t.rows;
    t.mouseX = Math.max(0, Math.min(t.W - 1, ((col - 1) * pxw) | 0));
    t.mouseY = Math.max(0, Math.min(t.H - 1, ((row - 1) * pxh) | 0));
    t.mouseInside = true;
    t.mouseActive = true;
    t.mouseSeq++;
    if (wheel) t.wheel += button === 0 ? 1 : -1;
    else if (release) t.mouseDown = false;
    else if (!motion) t.mouseDown = button === 0; // press
  };

  // Raw-mode key + mouse handling when attached to a TTY.
  const stdin = process.stdin;
  const onData = (data: Buffer): void => {
    const s = data.toString('latin1');
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      const code = s.charCodeAt(i);
      if (code === 27 && s[i + 1] === '[') {
        // CSI: mouse (\x1b[<…M/m) or arrows (\x1b[A..D)
        if (s[i + 2] === '<') {
          const m = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])/.exec(s.slice(i, i + 24));
          if (m) {
            applyMouse(+m[1], +m[2], +m[3], m[4] === 'm');
            i += m[0].length;
            continue;
          }
        }
        const arrow = ARROWS[s[i + 2]];
        if (arrow) {
          spec.onKey?.(arrow, t);
          i += 3;
          continue;
        }
        i += 2; // unknown CSI prefix — skip and keep parsing
        continue;
      }
      // ESC and Ctrl-C always quit; 'q'/'Q' quits unless the demo claims it.
      if (code === 3 || code === 27 || ((ch === 'q' || ch === 'Q') && spec.quitOnQ !== false)) {
        stop();
        return;
      }
      if (ch === ' ') {
        if (spec.pauseOnSpace !== false) paused = !paused;
        spec.onKey?.('space', t);
        i++;
        continue;
      }
      spec.onKey?.(ch.toLowerCase(), t);
      i++;
    }
  };
  let rawOn = false;
  if (stdin.isTTY) {
    try {
      stdin.setRawMode(true);
      rawOn = true;
      stdin.resume();
      stdin.on('data', onData);
    } catch {
      /* not interactive — ignore */
    }
  }

  const durationMs = envNum('DEMO_DURATION_MS', 0);
  const cap = spec.targetFps ?? 0;
  const minFrameMs = cap > 0 ? 1000 / cap : 0;
  const frameWait = minFrameMs > 0 ? makeFrameWaiter() : null;

  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) return;
    cleaned = true;
    if (rawOn) {
      try {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
      } catch {
        /* ignore */
      }
    }
    restoreConsole();
  };
  process.on('SIGINT', () => {
    stop();
  });
  process.on('exit', cleanup);
  process.on('uncaughtException', (e) => {
    cleanup();
    console.error(e);
    process.exit(1);
  });

  const t0 = Bun.nanoseconds();
  let last = t0;
  let fpsEma = 60;
  let frame = 0;
  let simTime = 0;

  try {
    while (running) {
      // Live-resize: if the terminal grew/shrank, rebuild the framebuffer to fill
      // it. Demos read t.W/t.H every frame, so the picture always fills the window.
      const sz = detectSize();
      if (sz.cols !== t.cols || sz.rows !== t.rows) {
        t = new Term(sz.cols, sz.rows, opts);
        if (spec.resize) await spec.resize(t);
        else await spec.init?.(t);
        process.stdout.write(CLEAR + HOME);
      }

      const now = Bun.nanoseconds();
      let dt = (now - last) / 1e9;
      last = now;
      if (dt > 0.1) dt = 0.1; // clamp huge stalls
      if (!paused) simTime += dt;
      const inst = dt > 0 ? 1 / dt : 999;
      fpsEma = fpsEma * 0.9 + inst * 0.1;

      spec.frame(t, simTime, paused ? 0 : dt, frame);
      if (spec.drawHud !== false) drawHud(t, spec, fpsEma, dt * 1000, paused ? `${spec.hud ?? ''}  [PAUSED]` : spec.hud);
      t.present();
      frame++;

      if (durationMs > 0 && (now - t0) / 1e6 >= durationMs) break;

      if (minFrameMs > 0) {
        const wait = minFrameMs - (Bun.nanoseconds() - now) / 1e6;
        if (wait > 0.2) {
          if (frameWait) frameWait(wait); // precise high-res wait — Bun.sleep quantizes to ~15.6ms on Windows (→ ~30fps)
          else await Bun.sleep(wait); // legacy fallback (pre-1803 Windows)
        }
      }
      // Yield via the check phase to drain stdin/resize I/O. NOT Bun.sleep(0): its
      // timer only fires on the next ~15.6ms Windows tick after the blocking wait
      // above, which would re-introduce the ~30fps quantization the timer just fixed.
      await new Promise<void>((r) => setImmediate(r));
    }
  } finally {
    cleanup();
  }
  if (env('FPS_REPORT') === '1') {
    const secs = (Bun.nanoseconds() - t0) / 1e9;
    process.stderr.write(`fps_report avg=${(frame / Math.max(1e-9, secs)).toFixed(1)} frames=${frame} secs=${secs.toFixed(2)}\n`);
  }
}
