// Checks for the new pixel drawing primitives (line/rect/fillRect/circle/blit) and
// the clip rectangle. Run: `bun run packages/terminal/draw.test.ts`.

import { Term } from './pixel';

let passCount = 0;
let failCount = 0;
const assert = (label: string, condition: boolean): void => {
  if (condition) passCount++;
  else {
    failCount++;
    console.log(`FAIL: ${label}`);
  }
};

{
  const surface = new Term(8, 4); // width 8, height 8
  surface.clear(0, 0, 0);
  surface.line(0, 0, 7, 0, 255, 0, 0);
  let lit = 0;
  for (let x = 0; x < 8; x++) if (surface.pixels[x * 3] === 255) lit++;
  assert('horizontal line lights 8 pixels', lit === 8);
}

{
  const surface = new Term(8, 4);
  surface.clear(0, 0, 0);
  surface.clip(2, 2, 3, 3);
  surface.fillRect(0, 0, 8, 8, 10, 20, 30);
  const topLeft = (0 * 8 + 0) * 3;
  const inside = (3 * 8 + 3) * 3;
  assert('clip blocks outside', surface.pixels[topLeft] === 0);
  assert('clip allows inside', surface.pixels[inside] === 10 && surface.pixels[inside + 1] === 20 && surface.pixels[inside + 2] === 30);
  surface.noClip();
  surface.fillRect(0, 0, 1, 1, 99, 99, 99);
  assert('noClip restores full frame', surface.pixels[0] === 99);
}

{
  const surface = new Term(16, 8); // 16x16
  surface.clear(0, 0, 0);
  surface.circle(8, 8, 5, 0, 255, 0);
  let lit = 0;
  for (let index = 1; index < surface.pixels.length; index += 3) if (surface.pixels[index] === 255) lit++;
  assert('circle outline draws pixels', lit > 8);
}

{
  const surface = new Term(8, 4);
  surface.clear(0, 0, 0);
  const source = new Uint8Array(2 * 2 * 3);
  source[0] = 200;
  surface.blit(source, 2, 2, 1, 1);
  assert('blit copies source pixel', surface.pixels[(1 * 8 + 1) * 3] === 200);
}

console.log(`draw.test: ${passCount} pass, ${failCount} fail`);
if (failCount > 0) process.exit(1);
