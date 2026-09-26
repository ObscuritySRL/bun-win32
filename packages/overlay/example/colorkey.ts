/**
 * Color key mode — hard-edged transparency without the per-pixel alpha path
 *
 * One color (here black) becomes see-through and everything else is fully opaque. Partial coverage is alpha-tested
 * away instead of blended into the key color, so shapes stay crisp with no key-colored fringe. A frame counter
 * prints once per second.
 *
 * APIs demonstrated:
 * - `new Overlay({ colorKey, mode: 'colorkey' })` (color key transparency via SetLayeredWindowAttributes)
 * - `Overlay.rectangle` / `circle` / `line` (opaque shapes, rounded corners, stroked lines)
 * - `Overlay.update` (SwapBuffers present; idle frames are skipped entirely)
 *
 * Run: bun run example/colorkey.ts
 *      DEMO_DURATION_MS=5000 bun run example/colorkey.ts   (exit after five seconds)
 */

import { Overlay } from '@bun-win32/overlay';

const overlay = new Overlay({
  colorKey: '#000000',
  height: 600,
  mode: 'colorkey',
  title: 'ColorKey Test',
  width: 800,
});

const duration = Number(Bun.env.DEMO_DURATION_MS ?? 0);
const startTime = performance.now();

let frames = 0;

console.log('ColorKey mode - you should see:');
console.log('- Transparent background (the desktop shows through black)');
console.log('- Opaque red, green, blue shapes with crisp edges');
console.log('Press Ctrl+C to exit');

const run = () => {
  const time = (performance.now() - startTime) / 1000; // seconds

  if (duration > 0 && time * 1000 >= duration) {
    overlay.close();
    process.exit(0);
  }

  frames++;

  overlay.rectangle(100, 100, 200, 150, 0xff0000ff);
  overlay.circle(500, 300, 80, 0x00ff00ff);
  overlay.rectangle(400, 100, 150, 100, { fill: 0x0000ffff, radius: 16 });
  overlay.line(50, 50, 750, 50, { stroke: 0xffffffff, strokeWidth: 2 });
  overlay.line(50, 550, 750, 550, { stroke: 0xffff00ff, strokeWidth: 2 });

  // Animate a circle using time
  overlay.circle(400 + Math.sin(time * 2) * 200, 450, 30, 0xff00ffff);
  overlay.update();

  setImmediate(run);
};

setImmediate(run);

setInterval(() => {
  console.log(frames);
  frames = 0;
}, 1_000);
