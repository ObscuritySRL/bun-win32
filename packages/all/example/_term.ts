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
 * Demos call `runDemo({ title, frame })`. Env knobs:
 *   DEMO_DURATION_MS=<ms>     live mode auto-exit
 *   CAPTURE_PNG=<abs path>    render one deterministic frame to PNG and exit
 *   CAPTURE_T=<seconds>       sim time to advance to before capture   (default 4)
 *   CAPTURE_FPS=<n>           fixed sim timestep for capture/bench     (default 60)
 *   CAPTURE_FRAMES=<n>        write n PNGs (path.0.png …) across [0,CAPTURE_T]
 *   TERM_COLS / TERM_ROWS     force the grid size (deterministic capture)
 *   BENCH=1 [BENCH_FRAMES=n]  measure frame-production FPS, print JSON, exit
 *
 * Engine/APIs: @bun-win32/kernel32 (console handle/mode/CP/title) via ../index.
 */
import { Kernel32 } from '../index';
import { STD_HANDLE } from '@bun-win32/kernel32';

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

// ── The framebuffer / renderer ─────────────────────────────────────────────────
export class Term {
  readonly cols: number;
  readonly rows: number;
  readonly W: number; // pixel grid width  = cols
  readonly H: number; // pixel grid height = rows*2
  readonly aspect: number; // W / H
  readonly buf: Uint8Array; // RGB, length W*H*3

  // Mouse state (only populated when the demo opts in via `mouse: true`; updated
  // from xterm SGR mouse reports parsed off stdin). Coordinates are in PIXELS.
  mouseX = -1;
  mouseY = -1;
  mouseDown = false; // left button held
  mouseInside = false;
  mouseActive = false; // has any mouse event been seen this Term
  mouseSeq = 0; // increments on every mouse event (demos detect movement/idle via this)
  wheel = 0; // accumulated wheel ticks (+up / −down); demo may read and reset

  private prevTop: Int32Array;
  private prevBot: Int32Array;
  private firstFrame = true;
  private _fg = -1;
  private _bg = -1;

  // Fast output byte buffer.
  private out = new Uint8Array(1 << 18);
  private outPos = 0;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.W = cols;
    this.H = rows * 2;
    this.aspect = this.W / this.H;
    this.buf = new Uint8Array(this.W * this.H * 3);
    this.prevTop = new Int32Array(cols * rows).fill(-1);
    this.prevBot = new Int32Array(cols * rows).fill(-1);
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

  /** Build the diffed frame into the byte buffer (no I/O). Returns byte length. */
  buildFrame(): number {
    const { cols, rows, W, buf, prevTop, prevBot } = this;
    this.outPos = 0;
    this.putAscii(HOME);
    let curRow = 0, curCol = 0;
    let fg = this._fg, bg = this._bg;
    const first = this.firstFrame;
    for (let r = 0; r < rows; r++) {
      const topBase = r * 2 * W * 3;
      const botBase = (r * 2 + 1) * W * 3;
      const cellBase = r * cols;
      for (let c = 0; c < cols; c++) {
        const ti = topBase + c * 3;
        const bi = botBase + c * 3;
        const topKey = (buf[ti] << 16) | (buf[ti + 1] << 8) | buf[ti + 2];
        const botKey = (buf[bi] << 16) | (buf[bi + 1] << 8) | buf[bi + 2];
        const idx = cellBase + c;
        if (!first && prevTop[idx] === topKey && prevBot[idx] === botKey) continue;
        prevTop[idx] = topKey;
        prevBot[idx] = botKey;
        if (curRow !== r || curCol !== c) {
          this.putAscii(`${ESC}[`);
          this.putUint(r + 1);
          this.putByte(59); // ;
          this.putUint(c + 1);
          this.putByte(72); // H
          curRow = r;
          curCol = c;
        }
        if (fg !== topKey) {
          this.putAscii(`${ESC}[38;2;`);
          this.putUint((topKey >> 16) & 255);
          this.putByte(59);
          this.putUint((topKey >> 8) & 255);
          this.putByte(59);
          this.putUint(topKey & 255);
          this.putByte(109); // m
          fg = topKey;
        }
        if (bg !== botKey) {
          this.putAscii(`${ESC}[48;2;`);
          this.putUint((botKey >> 16) & 255);
          this.putByte(59);
          this.putUint((botKey >> 8) & 255);
          this.putByte(59);
          this.putUint(botKey & 255);
          this.putByte(109);
          bg = botKey;
        }
        // '▀' U+2580 → E2 96 80
        this.putByte(0xe2);
        this.putByte(0x96);
        this.putByte(0x80);
        curCol++;
        if (curCol >= cols) curRow = -1; // autowrap is off → force a move next
      }
    }
    this._fg = fg;
    this._bg = bg;
    this.firstFrame = false;
    return this.outPos;
  }

  /** Build + flush the frame to the terminal in one write. */
  present(): void {
    this.buildFrame();
    process.stdout.write(this.out.subarray(0, this.outPos));
  }

  /** Force the next frame to fully repaint (after a resize / screen disturbance). */
  invalidate(): void {
    this.firstFrame = true;
    this._fg = -1;
    this._bg = -1;
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
}

const drawHud = (t: Term, spec: DemoSpec, fps: number, ms: number, extra?: string): void => {
  const line1 = `${spec.title.toUpperCase()}`;
  const line2 = `FPS ${fps.toFixed(0).padStart(3)}  ${ms.toFixed(1)}MS  ${t.W}X${t.H}`;
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

  // ── Capture: deterministic, headless, writes PNG(s) and exits ──────────────
  if (capturePath) {
    const { cols, rows } = (() => {
      const c = envNum('TERM_COLS', 160);
      const r = envNum('TERM_ROWS', 50);
      return { cols: Math.max(20, c | 0), rows: Math.max(8, r | 0) };
    })();
    const t = new Term(cols, rows);
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
    const t = new Term(cols, rows);
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
  let t = new Term(cols, rows);
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
    t.mouseX = Math.max(0, Math.min(t.W - 1, col - 1)); // 1 cell = 1 px wide
    t.mouseY = Math.max(0, Math.min(t.H - 1, (row - 1) * 2)); // 1 cell = 2 px tall
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
      if (code === 3 || ch === 'q' || ch === 'Q' || code === 27) {
        stop();
        return;
      }
      if (ch === ' ') {
        paused = !paused;
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
        t = new Term(sz.cols, sz.rows);
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
        const spent = (Bun.nanoseconds() - now) / 1e6;
        const sleep = minFrameMs - spent;
        if (sleep > 0) await Bun.sleep(sleep);
        else await Bun.sleep(0);
      } else {
        await Bun.sleep(0); // yield to the event loop (input / timers)
      }
    }
  } finally {
    cleanup();
  }
}
