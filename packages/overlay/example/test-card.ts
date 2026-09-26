/**
 * Test card — every overlay feature in one labeled grid, with a per-feature cost report
 *
 * Twelve cells cover the whole surface: fills, anti-aliasing, caps and joins, dashes, linear / radial / stroke
 * gradients, shadows, paths, transforms and clipping, text, and images with 3D. It doubles as a visual regression
 * reference (capture it and compare) and prints how long each cell takes to tessellate plus the cost of update().
 *
 * APIs demonstrated:
 * - `Overlay.rectangle` / `circle` / `ellipse` / `triangle` / `polygon` / `polyline` / `line` / `arc` (every primitive)
 * - `ShapeStyle` `fill` / `stroke` / `strokeWidth` / `radius` / `cap` / `dash` / `dashOffset` / `shadow` / `opacity`
 * - `Gradient` (`linear` with angles and hard stops, `radial`, `stroke` along a curve)
 * - `Overlay.beginPath` / `moveTo` / `lineTo` / `quadraticCurveTo` / `bezierCurveTo` / `closePath` / `fill` / `stroke`
 * - `Overlay.save` / `restore` / `translate` / `rotate` / `scale` / `clip` / `globalAlpha`
 * - `Overlay.text` / `measureText` (sizes, weights, alignment, outline, shadow, gradient fill, `maximumWidth`, lines)
 * - `Overlay.createImage` / `image`, `Overlay.box` / `project` (3D beneath 2D), `Overlay.update` / `capture`
 *
 * Run: bun run example/test-card.ts
 *      CAPTURE_PNG=test-card.png bun run example/test-card.ts   (headless still, then exit)
 *      DEMO_DURATION_MS=5000 bun run example/test-card.ts      (exit after five seconds)
 */

import { Gradient, type Image, Overlay, type ShapeStyle, type TextStyle } from '@bun-win32/overlay';

import { encodePNG } from './_png';

const { PI, floor, sin } = Math;

const AMBER = 0xffc94cff;
const CORAL = 0xff5c7aff;
const CYAN = 0x4cc3ffff;
const INK = 0xe8eef6ff;
const MINT = 0x7cf29aff;

const COLUMNS = 4;
const HEIGHT = 720;
const ROWS = 3;
const WIDTH = 1280;
const CELL_HEIGHT = HEIGHT / ROWS;
const CELL_WIDTH = WIDTH / COLUMNS;

const CAPTION: TextStyle = { color: 0x8a97a8ff, size: 12, weight: 700 };
const CAPTION_CENTER: TextStyle = { ...CAPTION, align: 'center' };
const CAPTION_RIGHT: TextStyle = { ...CAPTION, align: 'right', size: 10 };
const CAP_COLORS = [CORAL, MINT, CYAN];
const CELL: ShapeStyle = { fill: 0x0b1220b0, radius: 10, stroke: 0xffffff18 };
const CELL_OUTLINE: ShapeStyle = { radius: 10, stroke: 0xffffff18 };
const GLINT: ShapeStyle = { fill: new Gradient('linear', [0xffffff00, 0xffffffc0, 0xffffff00], 90) };
const GLOW: ShapeStyle = { fill: new Gradient('radial', [0xffffffff, CYAN, 0x4cc3ff00]) };
const HARD_STOPS: ShapeStyle = {
  fill: new Gradient(
    'linear',
    [
      [0.5, CORAL],
      [0.5, CYAN],
    ],
    135,
  ),
  radius: 6,
};
const LABEL: TextStyle = { align: 'center', color: INK, outline: 0x000000ff, size: 12 };
const ORB: ShapeStyle = { fill: 0x7cf29a30, segments: 14, stroke: MINT };
const RAINBOW: ShapeStyle = { fill: new Gradient('linear', [CORAL, AMBER, MINT, CYAN], 90), radius: 6 };
const SPOTLIGHT: ShapeStyle = { fill: new Gradient('radial', [0xffffffff, AMBER, 0xff5c7a00]), radius: 10 };
const TITLE: TextStyle = { color: new Gradient('linear', [AMBER, CORAL]), size: 28, weight: 900 };
const TRAIL: ShapeStyle = { cap: 'round', stroke: new Gradient('stroke', [0x4cc3ff00, CYAN]), strokeWidth: 5 };
const TWILIGHT: ShapeStyle = { fill: new Gradient('linear', [0x1f2a44ff, 0x6a3a8cff]), radius: 6 };

const ZIGZAG = new Float32Array([0, 30, 20, 0, 40, 30, 60, 0, 80, 30]);

const checker = new Uint8Array(16 * 16 * 4);

for (let y = 0; y < 16; y++) {
  for (let x = 0; x < 16; x++) {
    const light = ((x >> 2) + (y >> 2)) & 1;
    const offset = (y * 16 + x) * 4;

    checker[offset] = light ? 255 : 76;
    checker[offset + 1] = light ? 201 : 195;
    checker[offset + 2] = light ? 76 : 255;
    checker[offset + 3] = 255;
  }
}

/** One cell: its title and a draw function in cell-local coordinates (origin top-left, CELL_WIDTH x CELL_HEIGHT) */
interface Cell {
  draw: (overlay: Overlay, time: number) => void;
  title: string;
}

const CELLS: Cell[] = [
  {
    draw: (overlay) => {
      overlay.rectangle(20, 40, 70, 50, CYAN);
      overlay.rectangle(105, 40, 70, 50, { fill: MINT, radius: 14 });
      overlay.rectangle(190, 40, 70, 50, { stroke: AMBER, strokeWidth: 3 });
      overlay.circle(55, 150, 30, { fill: CORAL, stroke: INK, strokeWidth: 2 });
      overlay.ellipse(140, 150, 40, 22, { opacity: 0.6, fill: CYAN });
      overlay.triangle(200, 180, 230, 120, 260, 180, AMBER);
    },
    title: 'Fills and strokes',
  },
  {
    draw: (overlay) => {
      const widths = [0.5, 1, 2, 4, 8];

      for (let index = 0; index < widths.length; index++) {
        overlay.line(20, 45 + index * 30, 280, 55 + index * 34, { cap: 'round', stroke: INK, strokeWidth: widths[index] });
        overlay.text(`${widths[index]}px`, 284, 50 + index * 32, CAPTION_RIGHT);
      }
    },
    title: 'Anti-aliasing and widths',
  },
  {
    draw: (overlay) => {
      const caps = ['butt', 'round', 'square'] as const;

      for (let index = 0; index < caps.length; index++) {
        overlay.save();
        overlay.translate(30 + index * 90, 60);
        overlay.polyline(ZIGZAG, { cap: caps[index], stroke: CAP_COLORS[index], strokeWidth: 8 });
        overlay.text(caps[index], 40, 70, CAPTION_CENTER);
        overlay.restore();
      }
    },
    title: 'Caps and miter joins',
  },
  {
    draw: (overlay, time) => {
      overlay.line(20, 50, 280, 50, { dash: [12, 6], stroke: INK, strokeWidth: 2 });
      overlay.line(20, 80, 280, 80, { cap: 'round', dash: [0, 10], stroke: CYAN, strokeWidth: 5 });
      overlay.rectangle(20, 105, 120, 80, { dash: [6, 4], dashOffset: -time / 40, radius: 8, stroke: AMBER, strokeWidth: 2 });
      overlay.circle(215, 145, 40, { dash: [3, 5], dashOffset: time / 60, stroke: MINT, strokeWidth: 2 });
    },
    title: 'Dashes, dots, marching ants',
  },
  {
    draw: (overlay) => {
      overlay.rectangle(20, 40, 260, 36, RAINBOW);
      overlay.rectangle(20, 90, 125, 95, HARD_STOPS);
      overlay.rectangle(155, 90, 125, 95, TWILIGHT);
    },
    title: 'Linear gradients and hard stops',
  },
  {
    draw: (overlay) => {
      overlay.circle(70, 115, 55, GLOW);
      overlay.rectangle(145, 50, 135, 130, SPOTLIGHT);
    },
    title: 'Radial gradients',
  },
  {
    draw: (overlay) => {
      overlay.beginPath();
      overlay.moveTo(20, 170);
      overlay.bezierCurveTo(80, 20, 200, 220, 280, 50);
      overlay.stroke(TRAIL);
    },
    title: 'Gradient along a stroke',
  },
  {
    draw: (overlay) => {
      overlay.rectangle(25, 50, 110, 110, { fill: 0x1a2740ff, radius: 12, shadow: { blur: 18, color: 0x000000d0, y: 8 } });
      overlay.circle(215, 105, 22, { fill: INK, shadow: { blur: 22, color: 0x4cc3ffff, spread: 4, y: 0 } });
    },
    title: 'Shadows and glows',
  },
  {
    draw: (overlay) => {
      overlay.beginPath();
      overlay.moveTo(20, 180);
      overlay.quadraticCurveTo(80, 30, 140, 180);
      overlay.stroke({ stroke: CORAL, strokeWidth: 3 });
      overlay.polygon([160, 180, 220, 40, 280, 180, 220, 130], { fill: AMBER, stroke: INK, strokeWidth: 1.5 });
    },
    title: 'Curves and a concave polygon',
  },
  {
    draw: (overlay, time) => {
      for (let index = 0; index < 4; index++) {
        overlay.save();
        overlay.translate(45 + index * 55, 80);
        overlay.rotate(time / 1500 + (index * PI) / 8);
        overlay.scale(0.7 + index * 0.15);
        overlay.rectangle(-16, -16, 32, 32, { fill: MINT, radius: 5 });
        overlay.restore();
      }

      overlay.rectangle(20, 150, 260, 20, { fill: 0xffffff18, radius: 10 });
      overlay.save();
      overlay.clip(20, 150, 260, 20);
      overlay.rectangle(((time / 6) % 320) - 40, 150, 40, 20, GLINT);
      overlay.restore();
    },
    title: 'Transforms and clipping',
  },
  {
    draw: (overlay) => {
      overlay.text('Regular 14', 20, 55, { color: INK, size: 14 });
      overlay.text('Bold 20', 20, 85, { color: INK, size: 20, weight: 700 });
      overlay.text('Outlined', 150, 85, { color: AMBER, outline: 0x000000ff, size: 20, weight: 800 });
      overlay.text('GRADIENT', 20, 125, TITLE);
      overlay.text('A very long player name that truncates', 20, 155, { color: INK, maximumWidth: 180, shadow: 0x000000ff, size: 13 });
      overlay.text('Line one\nLine two', 280, 155, { align: 'right', color: MINT, size: 13 });
    },
    title: 'Text',
  },
  {
    draw: (overlay) => {
      overlay.image(checkerImage!, 20, 45, 64, 64);
      overlay.image(checkerImage!, 95, 45, 32, 32, 0xffffff80);
      // World space under a 60° perspective; project() returns overlay pixels, so undo this cell's translation
      overlay.sphere(481, -240, -600, 40, ORB);

      const label = overlay.project(481, -178, -600);

      if (label !== null) {
        overlay.text('project()', label.x - column(11) * CELL_WIDTH, label.y - row(11) * CELL_HEIGHT, LABEL);
      }
    },
    title: 'Images, 3D and project()',
  },
];

let checkerImage: Image | undefined;

function column(index: number): number {
  return index % COLUMNS;
}

/** Draws the whole card; returns per-cell tessellation time in milliseconds into `timings` */
function drawCard(overlay: Overlay, time: number, timings: Float64Array): void {
  for (let index = 0; index < CELLS.length; index++) {
    const left = column(index) * CELL_WIDTH;
    const top = row(index) * CELL_HEIGHT;
    const start = performance.now();

    overlay.save();
    overlay.translate(left, top);
    // 3D renders beneath 2D: the 3D cell gets an outline so its panel does not dim the sphere
    overlay.rectangle(8, 8, CELL_WIDTH - 16, CELL_HEIGHT - 16, index === 11 ? CELL_OUTLINE : CELL);
    overlay.text(CELLS[index].title, 20, 28, CAPTION);
    CELLS[index].draw(overlay, time);
    overlay.restore();

    timings[index] += performance.now() - start;
  }
}

function row(index: number): number {
  return floor(index / COLUMNS);
}

const capturePath = Bun.env.CAPTURE_PNG ?? '';
const duration = Number(Bun.env.DEMO_DURATION_MS ?? 0);
const headless = capturePath !== '';
const overlay = new Overlay({ height: HEIGHT, title: 'bun-overlay test card', width: WIDTH, x: headless ? -32_000 : undefined, y: headless ? -32_000 : undefined });
const timings = new Float64Array(CELLS.length);

checkerImage = overlay.createImage(16, 16, checker);
overlay.setPerspective(60, 1, 2_000);

// Warm up (JIT, glyph rasterization), then measure 240 frames of tessellation per cell and the full update() cost
for (let frame = 0; frame < 30; frame++) {
  drawCard(overlay, frame * 16, timings);
  overlay.update();
}

timings.fill(0);

let updateTotal = 0;

for (let frame = 0; frame < 240; frame++) {
  drawCard(overlay, frame * 16, timings);

  const before = performance.now();

  overlay.update();
  updateTotal += performance.now() - before;
}

const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;
const dim = (text: string) => `\x1b[2m${text}\x1b[0m`;

console.log(bold(`bun-overlay test card  ${dim(`${WIDTH}x${HEIGHT}  mode ${overlay.renderMode}  averaged over 240 frames`)}`));
console.log('');

for (let index = 0; index < CELLS.length; index++) {
  const microseconds = (timings[index] / 240) * 1000;
  const bar = '█'.repeat(Math.max(1, Math.round(microseconds / 4)));

  console.log(`  ${CELLS[index].title.padEnd(34)} ${microseconds.toFixed(1).padStart(7)} µs  ${dim(bar)}`);
}

console.log('');
console.log(`  ${bold('update()'.padEnd(34))} ${((updateTotal / 240) * 1000).toFixed(1).padStart(7)} µs  ${dim('submit + dirty-rect readback + layered-window copy')}`);
console.log(`  ${bold('frame'.padEnd(34))} ${((updateTotal / 240) * 1000 + (timings.reduce((total, value) => total + value, 0) / 240) * 1000).toFixed(1).padStart(7)} µs`);

if (headless) {
  drawCard(overlay, 1500, timings);
  overlay.update();
  await Bun.write(capturePath, encodePNG(overlay.capture(), WIDTH, HEIGHT));
  overlay.close();
  console.log('');
  console.log(`Wrote ${capturePath}`);
  process.exit(0);
}

const start = performance.now();

const stop = () => {
  clearInterval(timer);
  overlay.close();
  process.exit(0);
};

const timer = setInterval(() => {
  const time = performance.now() - start;

  if (duration > 0 && time >= duration) {
    stop();
  }

  drawCard(overlay, time, timings);
  overlay.update();
}, 1000 / 60);

process.on('SIGINT', stop);
