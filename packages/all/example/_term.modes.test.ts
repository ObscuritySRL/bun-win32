/**
 * _term.modes.test — regression test for the engine's sub-cell MODES, DIFF
 * strategies and colour DEPTHS. It feeds known pixel patterns through the
 * renderer, decodes the emitted escape/UTF-8 byte stream back into per-cell
 * (fg, bg, glyph), and asserts the exact Unicode glyph + averaged colours —
 * verifying the 2-colour quantisation, the glyph tables, threshold skipping and
 * the palette emit WITHOUT needing eyes on a terminal.
 *
 *   bun run packages/all/example/_term.modes.test.ts   (exits non-zero on failure)
 */
import { Term } from './_term';

interface Cell {
  fg: number;
  bg: number;
  cp: number;
}

/** Decode a buildFrame() byte stream into a cols×rows cell grid (cursor + SGR sim). */
const decode = (bytes: Uint8Array, cols: number, rows: number): Cell[] => {
  const grid: Cell[] = new Array(cols * rows).fill(0).map(() => ({ fg: -1, bg: -1, cp: -1 }));
  let row = 0;
  let col = 0;
  let fg = -1;
  let bg = -1;
  let i = 0;
  const n = bytes.length;
  const num = (): number => {
    let v = 0;
    while (i < n && bytes[i] >= 48 && bytes[i] <= 57) {
      v = v * 10 + (bytes[i] - 48);
      i++;
    }
    return v;
  };
  while (i < n) {
    if (bytes[i] === 0x1b && bytes[i + 1] === 0x5b) {
      i += 2;
      if (bytes[i] === 0x48) {
        i++;
        row = 0;
        col = 0;
        continue;
      }
      const a = num();
      if (bytes[i] === 0x3b) {
        i++;
        const b = num();
        if (bytes[i] === 0x48) {
          i++;
          row = a - 1;
          col = b - 1;
          continue;
        }
        if (a === 38 && b === 2) {
          i++;
          const r = num(); i++; const g = num(); i++; const bl = num();
          fg = (r << 16) | (g << 8) | bl;
          if (bytes[i] === 0x3b) {
            i++; num(); i++; num(); i++;
            const R = num(); i++; const G = num(); i++; const B = num();
            bg = (R << 16) | (G << 8) | B;
          }
          if (bytes[i] === 0x6d) i++;
          continue;
        }
        if (a === 48 && b === 2) {
          i++;
          const r = num(); i++; const g = num(); i++; const bl = num();
          bg = (r << 16) | (g << 8) | bl;
          if (bytes[i] === 0x6d) i++;
          continue;
        }
        if (a === 38 && b === 5) {
          i++; const idx = num();
          fg = idx;
          if (bytes[i] === 0x3b) { i++; num(); i++; num(); i++; bg = num(); }
          if (bytes[i] === 0x6d) i++;
          continue;
        }
        if (a === 48 && b === 5) {
          i++; bg = num();
          if (bytes[i] === 0x6d) i++;
          continue;
        }
      }
      while (i < n && bytes[i] !== 0x6d && bytes[i] !== 0x48) i++;
      if (i < n) i++;
      continue;
    }
    const b0 = bytes[i];
    let cp: number;
    let len: number;
    if (b0 < 0x80) { cp = b0; len = 1; }
    else if (b0 < 0xe0) { cp = b0 & 0x1f; len = 2; }
    else if (b0 < 0xf0) { cp = b0 & 0x0f; len = 3; }
    else { cp = b0 & 0x07; len = 4; }
    for (let k = 1; k < len; k++) cp = (cp << 6) | (bytes[i + k] & 0x3f);
    i += len;
    if (row >= 0 && row < rows && col >= 0 && col < cols) grid[row * cols + col] = { fg, bg, cp };
    col++;
  }
  return grid;
};

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean, detail = ''): void => {
  if (cond) pass++;
  else {
    fail++;
    process.stdout.write(`  FAIL: ${name}  ${detail}\n`);
  }
};
const hex = (cp: number): string => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');

// ── half: top pixel → fg, bottom → bg, glyph ▀ ──
{
  const t = new Term(2, 1);
  t.setPixel(0, 0, 255, 0, 0);
  t.setPixel(0, 1, 0, 0, 255);
  t.setPixel(1, 0, 0, 255, 0);
  t.buildFrame();
  const g = decode(t.frameBytes(), 2, 1);
  check('half glyph ▀', g[0].cp === 0x2580, hex(g[0].cp));
  check('half fg=red', g[0].fg === 0xff0000, g[0].fg.toString(16));
  check('half bg=blue', g[0].bg === 0x0000ff, g[0].bg.toString(16));
  check('half cell1 fg=green', g[1].fg === 0x00ff00, g[1].fg.toString(16));
}

// ── quad: 2×2 quadrant glyphs ──
const quadTest = (setup: (t: Term) => void, expectCp: number, name: string): void => {
  const t = new Term(1, 1, { mode: 'quad' });
  setup(t);
  t.buildFrame();
  check(`quad ${name} ${hex(expectCp)}`, decode(t.frameBytes(), 1, 1)[0].cp === expectCp, `got ${hex(decode(t.frameBytes(), 1, 1)[0].cp)}`);
};
quadTest((t) => t.setPixel(0, 0, 255, 0, 0), 0x2598, 'TL ▘');
quadTest((t) => t.setPixel(1, 0, 255, 0, 0), 0x259d, 'TR ▝');
quadTest((t) => { t.setPixel(0, 0, 255, 0, 0); t.setPixel(1, 0, 255, 0, 0); }, 0x2580, 'top ▀');
quadTest((t) => { t.setPixel(1, 0, 255, 0, 0); t.setPixel(1, 1, 255, 0, 0); }, 0x2590, 'right ▐');
quadTest((t) => { t.setPixel(0, 0, 255, 0, 0); t.setPixel(0, 1, 255, 0, 0); }, 0x258c, 'left ▌');

// ── sextant: 2×3 (Unicode 13 legacy computing) ──
const sextTest = (setup: (t: Term) => void, expectCp: number, name: string): void => {
  const t = new Term(1, 1, { mode: 'sextant' });
  setup(t);
  t.buildFrame();
  check(`sext ${name} ${hex(expectCp)}`, decode(t.frameBytes(), 1, 1)[0].cp === expectCp, `got ${hex(decode(t.frameBytes(), 1, 1)[0].cp)}`);
};
sextTest((t) => t.setPixel(0, 0, 255, 0, 0), 0x1fb00, 'TL only');
sextTest((t) => { t.setPixel(0, 0, 255, 0, 0); t.setPixel(0, 1, 255, 0, 0); t.setPixel(0, 2, 255, 0, 0); }, 0x258c, 'left col ▌');
sextTest((t) => { t.setPixel(1, 0, 255, 0, 0); t.setPixel(1, 1, 255, 0, 0); t.setPixel(1, 2, 255, 0, 0); }, 0x2590, 'right col ▐');

// ── braille: 2×4 dots (U+2800 + mask) ──
const brailleTest = (setup: (t: Term) => void, expectCp: number, name: string): void => {
  const t = new Term(1, 1, { mode: 'braille' });
  setup(t);
  t.buildFrame();
  check(`braille ${name} ${hex(expectCp)}`, decode(t.frameBytes(), 1, 1)[0].cp === expectCp, `got ${hex(decode(t.frameBytes(), 1, 1)[0].cp)}`);
};
brailleTest((t) => t.setPixel(0, 0, 255, 255, 255), 0x2801, 'dot1 (0,0)');
brailleTest((t) => t.setPixel(1, 3, 255, 255, 255), 0x2880, 'dot8 (1,3)');
brailleTest((t) => t.setPixel(0, 3, 255, 255, 255), 0x2840, 'dot7 (0,3)');

// ── threshold: skip small drift, repaint large ──
{
  const t = new Term(4, 1, { diff: 'threshold', threshold: 16 });
  for (let x = 0; x < 4; x++) { t.setPixel(x, 0, 100, 100, 100); t.setPixel(x, 1, 100, 100, 100); }
  t.buildFrame();
  for (let x = 0; x < 4; x++) { t.setPixel(x, 0, 108, 108, 108); t.setPixel(x, 1, 108, 108, 108); }
  check('threshold skips small drift', t.buildFrame() <= 4, `${t.frameBytes().length} bytes`);
  for (let x = 0; x < 4; x++) { t.setPixel(x, 0, 200, 50, 50); t.setPixel(x, 1, 200, 50, 50); }
  check('threshold repaints large drift', t.buildFrame() > 20);
}

// ── depth: palette emits 38;5; not 38;2; ──
{
  const t = new Term(2, 1, { depth: '256' });
  t.setPixel(0, 0, 255, 0, 0);
  t.buildFrame();
  const s = Buffer.from(t.frameBytes()).toString('latin1');
  check('256 emits 38;5;', s.includes('38;5;'));
  check('256 omits 38;2;', !s.includes('38;2;'));
}
{
  const t = new Term(2, 1, { depth: '16' });
  t.setPixel(0, 0, 255, 0, 0);
  t.buildFrame();
  check('16 emits 38;5;', Buffer.from(t.frameBytes()).toString('latin1').includes('38;5;'));
}

// ── ascii: luminance ramp ' .:-=+*#%@', tinted with the cell's average colour ──
{
  const t = new Term(3, 1, { mode: 'ascii' }); // W=3, H=2
  t.setPixel(0, 0, 255, 255, 255); t.setPixel(0, 1, 255, 255, 255); // bright → '@'
  // cell1 left black (0) → ' '
  t.setPixel(2, 0, 128, 128, 128); t.setPixel(2, 1, 128, 128, 128); // mid → '+'
  t.buildFrame();
  const g = decode(t.frameBytes(), 3, 1);
  check('ascii bright → @', g[0].cp === 0x40, hex(g[0].cp));
  check('ascii dark → space', g[1].cp === 0x20, hex(g[1].cp));
  check('ascii mid → +', g[2].cp === 0x2b, hex(g[2].cp));
  check('ascii tint fg=white', g[0].fg === 0xffffff, g[0].fg.toString(16));
}

// ── reconfigure: switch mode/diff/depth on a live Term ──
{
  const t = new Term(10, 4); // half → W=10, H=8
  t.reconfigure({ mode: 'sextant' });
  check('reconfigure W = cols*2', t.W === 20, `${t.W}`);
  check('reconfigure H = rows*3', t.H === 12, `${t.H}`);
  check('reconfigure buf resized', t.buf.length === 20 * 12 * 3, `${t.buf.length}`);
  check('reconfigure mode set', t.mode === 'sextant');
  t.reconfigure({ mode: 'half', depth: '16' });
  check('reconfigure back to half W/H', t.W === 10 && t.H === 8, `${t.W}x${t.H}`);
  check('reconfigure depth set', t.depth === '16');
}

process.stdout.write(`\n_term.modes.test: ${pass} pass, ${fail} fail\n`);
if (fail > 0) process.exit(1);
