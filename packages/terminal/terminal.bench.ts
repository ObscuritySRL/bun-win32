// Frame-production benchmark: isolates Term.buildFrame() cost (how fast the diffed
// byte stream is built, not consumed). Part 1 sweeps sizes × content scenarios on
// the default path; Part 2 is the mode × diff × depth matrix on coherent + noise
// content. Run: `bun run packages/terminal/terminal.bench.ts`.

import { Term } from './index';
import type { TermDepth, TermDiff, TermMode } from './types';

const { sin } = Math;

const fillNoise = (target: Uint8Array, seed: number): void => {
  let state = seed >>> 0;
  for (let index = 0; index < target.length; index++) {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    target[index] = (mixed ^ (mixed >>> 14)) & 0xff;
  }
};

const fillPlasma = (target: Uint8Array, width: number, height: number, time: number): void => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = sin(x * 0.04 + time) + sin(y * 0.03 - time) + sin((x + y) * 0.02 + time * 0.5);
      const index = (y * width + x) * 3;
      target[index] = (128 + 110 * sin(value)) & 0xff;
      target[index + 1] = (128 + 110 * sin(value + 2.094)) & 0xff;
      target[index + 2] = (128 + 110 * sin(value + 4.188)) & 0xff;
    }
  }
};

const measureSeconds = (iterations: number, body: (iteration: number) => void): number => {
  const start = Bun.nanoseconds();
  for (let iteration = 0; iteration < iterations; iteration++) body(iteration);
  return (Bun.nanoseconds() - start) / 1e9;
};

const padEnd = (text: string, width: number): string => text.padEnd(width);
const padStart = (text: string, width: number): string => text.padStart(width);

console.log('Part 1 — default path (half / truecolor / exact)\n');
console.log(`${padEnd('SIZE', 11)}${padEnd('SCENARIO', 12)}${padStart('FPS', 8)}${padStart('ms', 9)}${padStart('KB', 9)}`);
console.log('-'.repeat(49));
const sizes: [number, number][] = [
  [120, 40],
  [200, 60],
  [320, 100],
];
const iterationsPart1 = 400;
for (const [columns, rows] of sizes) {
  const surface = new Term(columns, rows);
  const frameBytes = surface.width * surface.height * 3;
  const noisePool = Array.from({ length: 8 }, (_unused, index) => {
    const buffer = new Uint8Array(frameBytes);
    fillNoise(buffer, 12345 + index * 7919);
    return buffer;
  });
  const report = (scenario: string, lastBytes: number, seconds: number): void => {
    const fps = iterationsPart1 / seconds;
    console.log(`${padEnd(`${columns}x${rows}`, 11)}${padEnd(scenario, 12)}${padStart(fps.toFixed(0), 8)}${padStart(((seconds / iterationsPart1) * 1000).toFixed(3), 9)}${padStart((lastBytes / 1024).toFixed(1), 9)}`);
  };
  {
    fillNoise(surface.pixels, 999);
    surface.buildFrame();
    surface.buildFrame();
    let bytes = 0;
    const seconds = measureSeconds(iterationsPart1, () => {
      bytes = surface.buildFrame();
    });
    report('static', bytes, seconds);
  }
  {
    surface.invalidate();
    fillNoise(surface.pixels, 1);
    surface.buildFrame();
    const touch = Math.max(1, (columns * rows * 0.03) | 0);
    let bytes = 0;
    const seconds = measureSeconds(iterationsPart1, (iteration) => {
      for (let count = 0; count < touch; count++) {
        const x = (count * 2654435761 + iteration) % surface.width;
        const y = (count * 40503 + iteration * 2) % surface.height;
        surface.setPixel(x, y, count & 0xff, iteration & 0xff, (count + iteration) & 0xff);
      }
      bytes = surface.buildFrame();
    });
    report('sparse 3%', bytes, seconds);
  }
  {
    surface.invalidate();
    let bytes = 0;
    const seconds = measureSeconds(iterationsPart1, (iteration) => {
      surface.pixels.set(noisePool[iteration & 7]);
      bytes = surface.buildFrame();
    });
    report('video', bytes, seconds);
  }
}

console.log('\nPart 2 — mode × diff × depth (200×60 cells)\n');
const modes: TermMode[] = ['braille', 'half', 'octant', 'quad', 'sextant'];
const configs: { depth: TermDepth; diff: TermDiff; label: string; threshold: number }[] = [
  { depth: 'truecolor', diff: 'exact', label: 'exact', threshold: 0 },
  { depth: 'truecolor', diff: 'threshold', label: 'thr18', threshold: 18 },
  { depth: '256', diff: 'exact', label: '256', threshold: 0 },
  { depth: '16', diff: 'exact', label: '16', threshold: 0 },
];
const iterationsPart2 = 300;
const runMatrix = (title: string, coherent: boolean): void => {
  console.log(title);
  console.log(`${padEnd('MODE', 9)}${padEnd('DIFF', 11)}${padEnd('DEPTH', 10)}${padStart('px', 9)}${padStart('FPS', 8)}${padStart('KB/f', 8)}`);
  console.log('-'.repeat(55));
  for (const mode of modes) {
    for (const config of configs) {
      const surface = new Term(200, 60, { depth: config.depth, diff: config.diff, mode, threshold: config.threshold });
      const frameBytes = surface.width * surface.height * 3;
      const pool = Array.from({ length: coherent ? 60 : 8 }, (_unused, index) => {
        const buffer = new Uint8Array(frameBytes);
        if (coherent) fillPlasma(buffer, surface.width, surface.height, index * 0.03);
        else fillNoise(buffer, 4567 + index * 7919);
        return buffer;
      });
      for (let warm = 0; warm < 20; warm++) {
        surface.pixels.set(pool[warm % pool.length]);
        surface.buildFrame();
      }
      surface.invalidate();
      let totalBytes = 0;
      const seconds = measureSeconds(iterationsPart2, (iteration) => {
        surface.pixels.set(pool[iteration % pool.length]);
        totalBytes += surface.buildFrame();
      });
      const fps = iterationsPart2 / seconds;
      console.log(`${padEnd(mode, 9)}${padEnd(config.label, 11)}${padEnd(config.depth, 10)}${padStart(`${surface.width}x${surface.height}`, 9)}${padStart(fps.toFixed(0), 8)}${padStart((totalBytes / iterationsPart2 / 1024).toFixed(1), 8)}`);
    }
  }
  console.log('');
};
runMatrix('COHERENT plasma (≈ real video / game)', true);
runMatrix('INCOHERENT noise (worst case)', false);
