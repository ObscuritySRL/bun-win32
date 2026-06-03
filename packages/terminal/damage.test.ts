// Damage-region behaviour for Term: a marked rectangle limits which cells the next
// buildFrame scans/emits (a caller contract — unmarked changes are not re-sent until
// a full scan). Cells are counted by the half-block glyph (▀ = E2 96 80) in the wire
// bytes. Run: `bun run packages/terminal/damage.test.ts`.

import { CharTerm } from './char';
import { Term } from './pixel';

let passCount = 0;
let failCount = 0;
const assert = (label: string, condition: boolean, detail = ''): void => {
  if (condition) passCount++;
  else {
    failCount++;
    console.log(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

const countCells = (bytes: Uint8Array): number => {
  let count = 0;
  for (let index = 0; index + 2 < bytes.length; index++) {
    if (bytes[index] === 0xe2 && bytes[index + 1] === 0x96 && bytes[index + 2] === 0x80) count++;
  }
  return count;
};

// half mode: 20 cols × 10 rows = 200 cells; pixel grid 20 × 20.
const surface = new Term(20, 10);
surface.clear(10, 20, 30);
surface.buildFrame();
assert('first frame is a full repaint', countCells(surface.frameBytes()) === 200, `${countCells(surface.frameBytes())}`);

// Change the whole framebuffer but declare only a 4×4 px region damaged → 4 cols × 2 rows.
surface.clear(200, 100, 50);
surface.markDamage(0, 0, 4, 4);
surface.buildFrame();
assert('damage limits the scan to its cells', countCells(surface.frameBytes()) === 8, `${countCells(surface.frameBytes())}`);

// The other 192 changed-but-unmarked cells are still pending; a full scan now sends them.
surface.buildFrame();
assert('unmarked changes flush on the next full frame', countCells(surface.frameBytes()) === 192, `${countCells(surface.frameBytes())}`);

// markDamage is one-shot: after consuming it, the next frame is full again.
surface.clear(0, 0, 0);
surface.buildFrame();
assert('damage is consumed by one frame', countCells(surface.frameBytes()) === 200, `${countCells(surface.frameBytes())}`);

// clearDamage cancels a pending region.
surface.clear(20, 20, 20);
surface.markDamage(0, 0, 4, 4);
surface.clearDamage();
surface.buildFrame();
assert('clearDamage restores the full scan', countCells(surface.frameBytes()) === 200, `${countCells(surface.frameBytes())}`);

// Multiple marks union into their bounding rectangle.
surface.clear(40, 40, 40);
surface.buildFrame(); // settle
surface.clear(80, 80, 80);
surface.markDamage(0, 0, 2, 2); // cols [0,2) × row 0
surface.markDamage(2, 0, 2, 2); // cols [2,4) × row 0 — adjacent
surface.buildFrame();
assert('unioned marks scan their bounding box', countCells(surface.frameBytes()) === 4, `${countCells(surface.frameBytes())}`);

// CharTerm: damage is in CELLS. Count the glyph 'B' (0x42) in the wire bytes.
const countByte = (bytes: Uint8Array, target: number): number => {
  let count = 0;
  for (let index = 0; index < bytes.length; index++) if (bytes[index] === target) count++;
  return count;
};
const grid = new CharTerm(20, 10); // 200 cells
grid.clear(0, 0, 0);
grid.characters.fill(0x41); // 'A'
grid.foreground.fill(0xffffff);
grid.buildFrame();
assert('CharTerm first frame is full', countByte(grid.frameBytes(), 0x41) === 200, `${countByte(grid.frameBytes(), 0x41)}`);

grid.characters.fill(0x42); // 'B' everywhere
grid.markDamage(0, 0, 4, 2); // cols [0,4) × rows [0,2) = 8 cells
grid.buildFrame();
assert('CharTerm damage limits the scan', countByte(grid.frameBytes(), 0x42) === 8, `${countByte(grid.frameBytes(), 0x42)}`);

console.log(`damage.test: ${passCount} pass, ${failCount} fail`);
if (failCount > 0) process.exit(1);
