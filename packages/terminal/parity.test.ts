// Self-contained checks for the foundational modules: PNG container structure and
// the quantisers hitting the documented xterm indices. Run:
// `bun run packages/terminal/parity.test.ts` (exits non-zero on failure).

import { channelDelta, quantizeTo16, quantizeTo256 } from './color';
import { encodePNG } from './png';

let passCount = 0;
let failCount = 0;
const assert = (label: string, condition: boolean, detail = ''): void => {
  if (condition) passCount++;
  else {
    failCount++;
    console.log(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

{
  const width = 4;
  const height = 3;
  const pixels = new Uint8Array(width * height * 3);
  for (let index = 0; index < pixels.length; index++) pixels[index] = (index * 37) & 0xff;
  const png = encodePNG(pixels, width, height);
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  let signatureMatches = true;
  for (let index = 0; index < 8; index++) if (png[index] !== signature[index]) signatureMatches = false;
  assert('PNG signature', signatureMatches);
  assert('IHDR chunk type', png[12] === 0x49 && png[13] === 0x48 && png[14] === 0x44 && png[15] === 0x52);
  assert('PNG width', ((png[16] << 24) | (png[17] << 16) | (png[18] << 8) | png[19]) >>> 0 === width);
  assert('PNG height', ((png[20] << 24) | (png[21] << 16) | (png[22] << 8) | png[23]) >>> 0 === height);
  assert('PNG bit depth 8', png[24] === 8);
  assert('PNG colour type 2', png[25] === 2);
  let idatStart = -1;
  for (let index = 8; index < png.length - 4; index++) {
    if (png[index] === 0x49 && png[index + 1] === 0x44 && png[index + 2] === 0x41 && png[index + 3] === 0x54) {
      idatStart = index + 4;
      break;
    }
  }
  assert('IDAT zlib header', idatStart >= 0 && png[idatStart] === 0x78 && png[idatStart + 1] === 0x01);
}

assert('quantizeTo256 red', quantizeTo256(255, 0, 0) === 196);
assert('quantizeTo256 black', quantizeTo256(0, 0, 0) === 16);
assert('quantizeTo256 white', quantizeTo256(255, 255, 255) === 231);
assert('quantizeTo16 red', quantizeTo16(255, 0, 0) === 9);
assert('quantizeTo16 black', quantizeTo16(0, 0, 0) === 0);
assert('quantizeTo16 white', quantizeTo16(255, 255, 255) === 15);
assert('channelDelta maximum', channelDelta(0xffffff, 0, 0, 0) === 255);
assert('channelDelta zero', channelDelta(0x646464, 100, 100, 100) === 0);
assert('channelDelta eight', channelDelta(0x646464, 108, 100, 100) === 8);

console.log(`parity.test: ${passCount} pass, ${failCount} fail`);
if (failCount > 0) process.exit(1);
