// Proves the clean Term is byte-identical to the original engine across the full
// mode × diff × depth matrix, over several frames (so the diff caches are
// exercised). Run: `bun run packages/terminal/pixel-parity.test.ts`.

import { Term as OriginalTerm } from '../all/example/_term';
import type { TermDepth, TermDiff, TermMode } from './types';
import { Term } from './pixel';

const modes: TermMode[] = ['ascii', 'braille', 'half', 'quad', 'sextant'];
const diffs: TermDiff[] = ['exact', 'none', 'threshold'];
const depths: TermDepth[] = ['16', '256', 'truecolor'];

const fillPlasma = (target: Uint8Array, width: number, height: number, time: number): void => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = Math.sin(x * 0.21 + time) + Math.sin(y * 0.17 - time) + Math.sin((x + y) * 0.13 + time * 0.5);
      const index = (y * width + x) * 3;
      target[index] = (128 + 90 * Math.sin(value + 0)) & 0xff;
      target[index + 1] = (128 + 90 * Math.sin(value + 2.094)) & 0xff;
      target[index + 2] = (128 + 90 * Math.sin(value + 4.188)) & 0xff;
    }
  }
};

const fillNoise = (target: Uint8Array, seed: number): void => {
  let state = seed >>> 0;
  for (let index = 0; index < target.length; index++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    target[index] = state & 0xff;
  }
};

let passCount = 0;
let failCount = 0;
const compareFrame = (label: string, mine: Term, original: OriginalTerm): void => {
  const a = mine.frameBytes();
  const b = original.frameBytes();
  let identical = a.length === b.length;
  let firstDifference = -1;
  for (let index = 0; identical && index < a.length; index++) {
    if (a[index] !== b[index]) {
      identical = false;
      firstDifference = index;
    }
  }
  if (identical) passCount++;
  else {
    failCount++;
    console.log(`FAIL: ${label} — lengths ${a.length} vs ${b.length}, first diff at ${firstDifference}`);
  }
};

const columns = 20;
const rows = 8;
for (const mode of modes) {
  for (const diff of diffs) {
    for (const depth of depths) {
      const options = { depth, diff, mode, threshold: 18 };
      const mine = new Term(columns, rows, options);
      const original = new OriginalTerm(columns, rows, options);
      const source = new Uint8Array(mine.width * mine.height * 3);
      for (let frame = 0; frame < 3; frame++) {
        if (frame === 2) fillNoise(source, 0x9e3779b9);
        else fillPlasma(source, mine.width, mine.height, frame * 0.04);
        mine.pixels.set(source);
        original.buf.set(source);
        mine.buildFrame();
        original.buildFrame();
        compareFrame(`${mode}/${diff}/${depth} frame ${frame}`, mine, original);
      }
    }
  }
}

// reconfigure parity: live mode switch must re-derive the grid and repaint identically
{
  const mine = new Term(16, 6, { mode: 'half' });
  const original = new OriginalTerm(16, 6, { mode: 'half' });
  mine.reconfigure({ mode: 'sextant', depth: '256' });
  original.reconfigure({ mode: 'sextant', depth: '256' });
  const source = new Uint8Array(mine.width * mine.height * 3);
  fillPlasma(source, mine.width, mine.height, 1.5);
  mine.pixels.set(source);
  original.buf.set(source);
  mine.buildFrame();
  original.buildFrame();
  compareFrame('reconfigure half→sextant/256', mine, original);
}

console.log(`pixel-parity.test: ${passCount} pass, ${failCount} fail`);
if (failCount > 0) process.exit(1);
