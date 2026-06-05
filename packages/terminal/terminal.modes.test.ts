// Byte-stream contract for the pixel surface: feed known pixel patterns through
// each mode / diff / depth, decode the emitted escape + UTF-8 stream back into
// per-cell (foreground, background, codePoint), and assert the exact Unicode
// glyphs + colours. Self-contained. Run: `bun run packages/terminal/terminal.modes.test.ts`.

import { Term } from './index';

interface DecodedCell {
  background: number;
  codePoint: number;
  foreground: number;
}

/** Decode a buildFrame() byte stream into a columns×rows cell grid (a minimal cursor + SGR simulator). */
const decode = (bytes: Uint8Array, columns: number, rows: number): DecodedCell[] => {
  const grid: DecodedCell[] = Array.from({ length: columns * rows }, () => ({ background: -1, codePoint: -1, foreground: -1 }));
  let row = 0;
  let column = 0;
  let foreground = -1;
  let background = -1;
  let position = 0;
  const length = bytes.length;
  const readNumber = (): number => {
    let value = 0;
    while (position < length && bytes[position] >= 48 && bytes[position] <= 57) {
      value = value * 10 + (bytes[position] - 48);
      position++;
    }
    return value;
  };
  while (position < length) {
    if (bytes[position] === 0x1b && bytes[position + 1] === 0x5b) {
      position += 2;
      if (bytes[position] === 0x48) {
        position++;
        row = 0;
        column = 0;
        continue;
      }
      const first = readNumber();
      if (bytes[position] === 0x3b) {
        position++;
        const second = readNumber();
        if (bytes[position] === 0x48) {
          position++;
          row = first - 1;
          column = second - 1;
          continue;
        }
        if (first === 38 && second === 2) {
          position++;
          const red = readNumber();
          position++;
          const green = readNumber();
          position++;
          const blue = readNumber();
          foreground = (red << 16) | (green << 8) | blue;
          if (bytes[position] === 0x3b) {
            position++;
            readNumber();
            position++;
            readNumber();
            position++;
            const backgroundRed = readNumber();
            position++;
            const backgroundGreen = readNumber();
            position++;
            const backgroundBlue = readNumber();
            background = (backgroundRed << 16) | (backgroundGreen << 8) | backgroundBlue;
          }
          if (bytes[position] === 0x6d) position++;
          continue;
        }
        if (first === 48 && second === 2) {
          position++;
          const red = readNumber();
          position++;
          const green = readNumber();
          position++;
          const blue = readNumber();
          background = (red << 16) | (green << 8) | blue;
          if (bytes[position] === 0x6d) position++;
          continue;
        }
        if (first === 38 && second === 5) {
          position++;
          foreground = readNumber();
          if (bytes[position] === 0x3b) {
            position++;
            readNumber();
            position++;
            background = readNumber();
          }
          if (bytes[position] === 0x6d) position++;
          continue;
        }
        if (first === 48 && second === 5) {
          position++;
          background = readNumber();
          if (bytes[position] === 0x6d) position++;
          continue;
        }
      }
      while (position < length && bytes[position] !== 0x6d && bytes[position] !== 0x48) position++;
      if (position < length) position++;
      continue;
    }
    const lead = bytes[position];
    let codePoint: number;
    let byteLength: number;
    if (lead < 0x80) {
      codePoint = lead;
      byteLength = 1;
    } else if (lead < 0xe0) {
      codePoint = lead & 0x1f;
      byteLength = 2;
    } else if (lead < 0xf0) {
      codePoint = lead & 0x0f;
      byteLength = 3;
    } else {
      codePoint = lead & 0x07;
      byteLength = 4;
    }
    for (let extra = 1; extra < byteLength; extra++) codePoint = (codePoint << 6) | (bytes[position + extra] & 0x3f);
    position += byteLength;
    if (row >= 0 && row < rows && column >= 0 && column < columns) grid[row * columns + column] = { background, codePoint, foreground };
    column++;
  }
  return grid;
};

let passCount = 0;
let failCount = 0;
const check = (label: string, condition: boolean, detail = ''): void => {
  if (condition) passCount++;
  else {
    failCount++;
    console.log(`  FAIL: ${label}  ${detail}`);
  }
};
const hex = (codePoint: number): string => `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;

{
  const surface = new Term(2, 1);
  surface.setPixel(0, 0, 255, 0, 0);
  surface.setPixel(0, 1, 0, 0, 255);
  surface.setPixel(1, 0, 0, 255, 0);
  surface.buildFrame();
  const grid = decode(surface.frameBytes(), 2, 1);
  check('half glyph ▀', grid[0].codePoint === 0x2580, hex(grid[0].codePoint));
  check('half foreground red', grid[0].foreground === 0xff0000);
  check('half background blue', grid[0].background === 0x0000ff);
  check('half cell1 foreground green', grid[1].foreground === 0x00ff00);
}

const quadTest = (setup: (surface: Term) => void, expectedCodePoint: number, name: string): void => {
  const surface = new Term(1, 1, { mode: 'quad' });
  setup(surface);
  surface.buildFrame();
  check(`quad ${name} ${hex(expectedCodePoint)}`, decode(surface.frameBytes(), 1, 1)[0].codePoint === expectedCodePoint);
};
quadTest((surface) => surface.setPixel(0, 0, 255, 0, 0), 0x2598, 'TL ▘');
quadTest((surface) => surface.setPixel(1, 0, 255, 0, 0), 0x259d, 'TR ▝');
quadTest(
  (surface) => {
    surface.setPixel(0, 0, 255, 0, 0);
    surface.setPixel(1, 0, 255, 0, 0);
  },
  0x2580,
  'top ▀',
);
quadTest(
  (surface) => {
    surface.setPixel(1, 0, 255, 0, 0);
    surface.setPixel(1, 1, 255, 0, 0);
  },
  0x2590,
  'right ▐',
);
quadTest(
  (surface) => {
    surface.setPixel(0, 0, 255, 0, 0);
    surface.setPixel(0, 1, 255, 0, 0);
  },
  0x258c,
  'left ▌',
);

const sextantTest = (setup: (surface: Term) => void, expectedCodePoint: number, name: string): void => {
  const surface = new Term(1, 1, { mode: 'sextant' });
  setup(surface);
  surface.buildFrame();
  check(`sextant ${name} ${hex(expectedCodePoint)}`, decode(surface.frameBytes(), 1, 1)[0].codePoint === expectedCodePoint);
};
sextantTest((surface) => surface.setPixel(0, 0, 255, 0, 0), 0x1fb00, 'TL only');
sextantTest(
  (surface) => {
    surface.setPixel(0, 0, 255, 0, 0);
    surface.setPixel(0, 1, 255, 0, 0);
    surface.setPixel(0, 2, 255, 0, 0);
  },
  0x258c,
  'left col ▌',
);
sextantTest(
  (surface) => {
    surface.setPixel(1, 0, 255, 0, 0);
    surface.setPixel(1, 1, 255, 0, 0);
    surface.setPixel(1, 2, 255, 0, 0);
  },
  0x2590,
  'right col ▐',
);

const brailleTest = (setup: (surface: Term) => void, expectedCodePoint: number, name: string): void => {
  const surface = new Term(1, 1, { mode: 'braille' });
  setup(surface);
  surface.buildFrame();
  check(`braille ${name} ${hex(expectedCodePoint)}`, decode(surface.frameBytes(), 1, 1)[0].codePoint === expectedCodePoint);
};
brailleTest((surface) => surface.setPixel(0, 0, 255, 255, 255), 0x2801, 'dot1 (0,0)');
brailleTest((surface) => surface.setPixel(1, 3, 255, 255, 255), 0x2880, 'dot8 (1,3)');
brailleTest((surface) => surface.setPixel(0, 3, 255, 255, 255), 0x2840, 'dot7 (0,3)');

// Octant (2×4). Bit d-1 is octant d (row-major). Lit sub-pixels are white, the rest
// black, so the two-colour split lands the lit set in the foreground group. Masks
// 0/255 are unreachable here (a uniform cell takes the solid branch → space), so the
// edge cases tested are the single sub-cell, the columns, and the eighth rows — which
// reuse pre-existing block characters rather than the U+1CD00 range.
const octantTest = (setup: (surface: Term) => void, expectedCodePoint: number, name: string): void => {
  const surface = new Term(1, 1, { mode: 'octant' });
  setup(surface);
  surface.buildFrame();
  check(`octant ${name} ${hex(expectedCodePoint)}`, decode(surface.frameBytes(), 1, 1)[0].codePoint === expectedCodePoint);
};
octantTest((surface) => surface.setPixel(0, 0, 255, 255, 255), 0x1cea8, 'octant-1 (0,0)'); // mask 1 → reused U+1CEA8
octantTest(
  (surface) => {
    surface.setPixel(0, 0, 255, 255, 255);
    surface.setPixel(0, 1, 255, 255, 255);
    surface.setPixel(0, 2, 255, 255, 255);
    surface.setPixel(0, 3, 255, 255, 255);
  },
  0x258c,
  'left column ▌',
); // mask 0x55 → LEFT HALF BLOCK
octantTest(
  (surface) => {
    surface.setPixel(1, 0, 255, 255, 255);
    surface.setPixel(1, 1, 255, 255, 255);
    surface.setPixel(1, 2, 255, 255, 255);
    surface.setPixel(1, 3, 255, 255, 255);
  },
  0x2590,
  'right column ▐',
); // mask 0xAA → RIGHT HALF BLOCK
octantTest(
  (surface) => {
    surface.setPixel(0, 0, 255, 255, 255);
    surface.setPixel(1, 0, 255, 255, 255);
  },
  0x1fb82,
  'top eighth row',
); // mask 3 → UPPER ONE QUARTER BLOCK
octantTest(
  (surface) => {
    surface.setPixel(0, 3, 255, 255, 255);
    surface.setPixel(1, 3, 255, 255, 255);
  },
  0x2582,
  'bottom eighth row',
); // mask 0xC0 → LOWER ONE QUARTER BLOCK
octantTest((surface) => surface.setPixel(0, 1, 255, 255, 255), 0x1cd00, 'octant-3 (0,1)'); // mask 4 → first U+1CD00 glyph

{
  const surface = new Term(4, 1, { diff: 'threshold', threshold: 16 });
  for (let x = 0; x < 4; x++) {
    surface.setPixel(x, 0, 100, 100, 100);
    surface.setPixel(x, 1, 100, 100, 100);
  }
  surface.buildFrame();
  for (let x = 0; x < 4; x++) {
    surface.setPixel(x, 0, 108, 108, 108);
    surface.setPixel(x, 1, 108, 108, 108);
  }
  check('threshold skips small drift', surface.buildFrame() <= 4, `${surface.frameBytes().length} bytes`);
  for (let x = 0; x < 4; x++) {
    surface.setPixel(x, 0, 200, 50, 50);
    surface.setPixel(x, 1, 200, 50, 50);
  }
  check('threshold repaints large drift', surface.buildFrame() > 20);
}

{
  const surface = new Term(2, 1, { depth: '256' });
  surface.setPixel(0, 0, 255, 0, 0);
  surface.buildFrame();
  const emitted = Buffer.from(surface.frameBytes()).toString('latin1');
  check('256 emits 38;5;', emitted.includes('38;5;'));
  check('256 omits 38;2;', !emitted.includes('38;2;'));
}
{
  const surface = new Term(2, 1, { depth: '16' });
  surface.setPixel(0, 0, 255, 0, 0);
  surface.buildFrame();
  check('16 emits 38;5;', Buffer.from(surface.frameBytes()).toString('latin1').includes('38;5;'));
}

{
  const surface = new Term(3, 1, { mode: 'ascii' });
  surface.setPixel(0, 0, 255, 255, 255);
  surface.setPixel(0, 1, 255, 255, 255);
  surface.setPixel(2, 0, 128, 128, 128);
  surface.setPixel(2, 1, 128, 128, 128);
  surface.buildFrame();
  const grid = decode(surface.frameBytes(), 3, 1);
  check('ascii bright → @', grid[0].codePoint === 0x40, hex(grid[0].codePoint));
  check('ascii dark → space', grid[1].codePoint === 0x20, hex(grid[1].codePoint));
  check('ascii mid → +', grid[2].codePoint === 0x2b, hex(grid[2].codePoint));
  check('ascii tint foreground white', grid[0].foreground === 0xffffff);
}

{
  const surface = new Term(10, 4);
  surface.reconfigure({ mode: 'sextant' });
  check('reconfigure width = columns*2', surface.width === 20, `${surface.width}`);
  check('reconfigure height = rows*3', surface.height === 12, `${surface.height}`);
  check('reconfigure pixels resized', surface.pixels.length === 20 * 12 * 3, `${surface.pixels.length}`);
  check('reconfigure mode set', surface.mode === 'sextant');
  surface.reconfigure({ depth: '16', mode: 'half' });
  check('reconfigure back to half width/height', surface.width === 10 && surface.height === 8);
  check('reconfigure depth set', surface.depth === '16');
}

console.log(`terminal.modes.test: ${passCount} pass, ${failCount} fail`);
if (failCount > 0) process.exit(1);
