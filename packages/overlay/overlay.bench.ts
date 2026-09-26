// Frame benchmark: draw calls plus update() (tessellation, submission, dirty-rect readback and the layered-window
// copy) across 2D, 3D and mixed scenes at 1920x1080. The render mode is the first argument (default alpha).
// Run: `bun run packages/overlay/overlay.bench.ts [alpha | colorkey | opaque]`.

import { Overlay } from './overlay';
import type { RenderMode, ShapeStyle, TextStyle } from './types';

const HEIGHT = 1080;
const WIDTH = 1920;

const mode = (Bun.argv[2] ?? 'alpha') as RenderMode;
const overlay = new Overlay({ height: HEIGHT, mode, title: 'Benchmark', width: WIDTH });

// Colors and styles hoisted: the hot path parses and allocates nothing
const COLORS = [0xff5555ff, 0x55ff55ff, 0x5555ffff, 0xffff55ff, 0xff55ffff, 0x55ffffff];
const OUTLINES: ShapeStyle[] = COLORS.map((stroke) => ({ stroke }));
const PANEL: ShapeStyle = { fill: overlay.linearGradient([0x1a2740d8, 0x0b1220ec]), radius: 12, shadow: { blur: 16, y: 6 }, stroke: 0xffffff1a };
const SOLIDS_3D: ShapeStyle[] = COLORS.map((fill) => ({ fill, segments: 12 }));
const SPHERES_8: ShapeStyle[] = COLORS.map((fill) => ({ fill, segments: 8 }));
const WIREFRAMES: ShapeStyle[] = COLORS.map((color) => ({ fill: ((color & 0xffffff00) | 0x40) >>> 0, stroke: color }));

const HUD_LABEL: TextStyle = { color: 0xf3f6faff, shadow: 0x000000c0, size: 14, weight: 700 };
const LABEL: TextStyle = { color: 0xffffffff, outline: 0x000000ff, size: 16 };

const { floor } = Math;

// Fast PRNG for reproducible benchmarks
let seed = 12345;

function random(): number {
  seed ^= seed << 13;
  seed ^= seed >> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) % 10000) / 10000;
}

function resetRandom(): void {
  seed = 12345;
}

interface BenchmarkResult {
  averageMilliseconds: number;
  framesPerSecond: number;
  iterations: number;
  name: string;
  totalMilliseconds: number;
}

let benchmarkIndex = 0;
let benchmarkTotal = 0;

function benchmark(name: string, iterations: number, scenario: () => void): BenchmarkResult {
  benchmarkIndex++;

  const prefix = `[${benchmarkIndex}/${benchmarkTotal}]`;

  process.stdout.write(`${prefix} ${name} ... warming up`);

  for (let i = 0; i < 10; i++) {
    scenario();
    overlay.update();
  }

  process.stdout.write(`\result${prefix} ${name} ... running ${iterations} iterations`);

  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    scenario();
    overlay.update();
  }

  const totalMilliseconds = performance.now() - start;
  const framesPerSecond = (iterations / totalMilliseconds) * 1000;

  console.log(`\result${prefix} ${name} ... ${framesPerSecond.toFixed(0)} FPS (${(totalMilliseconds / iterations).toFixed(3)} ms/frame)`);

  return { averageMilliseconds: totalMilliseconds / iterations, framesPerSecond, iterations, name, totalMilliseconds };
}

function benchmarkBoxes3D(): BenchmarkResult {
  resetRandom();

  return benchmark('30 filled boxes (3D)', 2000, () => {
    for (let i = 0; i < 30; i++) {
      overlay.box((random() - 0.5) * 80, (random() - 0.5) * 50, -(40 + random() * 80), 8, 8, 8, COLORS[i % 6]);
    }
  });
}

function benchmarkCircles2D(): BenchmarkResult {
  resetRandom();

  return benchmark('50 filled circles (2D)', 3000, () => {
    for (let i = 0; i < 50; i++) {
      overlay.circle(random() * WIDTH, random() * HEIGHT, 10 + random() * 40, COLORS[i % 6]);
    }
  });
}

function benchmarkCircles2DOutline(): BenchmarkResult {
  resetRandom();

  return benchmark('50 outline circles (2D)', 3000, () => {
    for (let i = 0; i < 50; i++) {
      overlay.circle(random() * WIDTH, random() * HEIGHT, 10 + random() * 40, OUTLINES[i % 6]);
    }
  });
}

function benchmarkEffects(): BenchmarkResult {
  return benchmark('20 gradient panels + shadows', 3000, () => {
    for (let i = 0; i < 20; i++) {
      overlay.rectangle(40 + (i % 5) * 360, 40 + floor(i / 5) * 240, 320, 200, PANEL);
    }
  });
}

function benchmarkEmpty(): BenchmarkResult {
  return benchmark('Empty frame (baseline)', 5000, () => {
    // Just clear and present
  });
}

function benchmarkFullScene(): BenchmarkResult {
  resetRandom();

  return benchmark('Full scene (2D+3D)', 1500, () => {
    // 2D HUD elements
    overlay.rectangle(10, 10, 200, 100, PANEL);
    overlay.text('FPS: 1000', 20, 40, { color: 0x00ff00ff, size: 24 });
    overlay.text('Health: 100', 20, 70, { color: 0xff0000ff, size: 18 });
    overlay.text('Ammo: 30/90', 20, 95, { color: 0xffff00ff, size: 18 });

    // Crosshair
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    overlay.line(centerX - 15, centerY, centerX + 15, centerY, 0x00ff00ff);
    overlay.line(centerX, centerY - 15, centerX, centerY + 15, 0x00ff00ff);
    overlay.circle(centerX, centerY, 10, OUTLINES[1]);

    // 3D world elements (drawn beneath the 2D layer)
    for (let i = 0; i < 20; i++) {
      overlay.box((random() - 0.5) * 100, (random() - 0.5) * 60, -(30 + random() * 100), 5, 5, 5, WIREFRAMES[i % 3]);
    }

    for (let i = 0; i < 10; i++) {
      overlay.sphere((random() - 0.5) * 80, (random() - 0.5) * 50, -(40 + random() * 80), 3, SPHERES_8[(i + 3) % 6]);
    }
  });
}

function benchmarkHud(): BenchmarkResult {
  return benchmark('HUD panel (400x300, dirty rectangle)', 3000, () => {
    overlay.rectangle(20, 20, 400, 300, PANEL);

    for (let i = 0; i < 12; i++) {
      overlay.text('Player ........ 100%', 40, 50 + i * 22, HUD_LABEL);
      overlay.circle(380, 45 + i * 22, 6, COLORS[i % 6]);
    }
  });
}

function benchmarkLines2D(): BenchmarkResult {
  resetRandom();

  return benchmark('100 lines (2D)', 3000, () => {
    for (let i = 0; i < 100; i++) {
      overlay.line(random() * WIDTH, random() * HEIGHT, random() * WIDTH, random() * HEIGHT, COLORS[i % 6]);
    }
  });
}

function benchmarkMixed2D(): BenchmarkResult {
  resetRandom();

  return benchmark('Mixed 2D (64 shapes)', 3000, () => {
    for (let i = 0; i < 16; i++) {
      overlay.rectangle(random() * WIDTH, random() * HEIGHT, 50, 30, COLORS[0]);
    }

    for (let i = 0; i < 16; i++) {
      overlay.circle(random() * WIDTH, random() * HEIGHT, 20, COLORS[1]);
    }

    for (let i = 0; i < 16; i++) {
      overlay.line(random() * WIDTH, random() * HEIGHT, random() * WIDTH, random() * HEIGHT, COLORS[2]);
    }

    for (let i = 0; i < 16; i++) {
      overlay.rectangle(random() * WIDTH, random() * HEIGHT, 40, 40, OUTLINES[3]);
    }
  });
}

function benchmarkMixed3D(): BenchmarkResult {
  resetRandom();

  return benchmark('Mixed 3D (40 shapes)', 2000, () => {
    for (let i = 0; i < 15; i++) {
      overlay.rectangle3D((random() - 0.5) * 80, (random() - 0.5) * 50, -(50 + random() * 50), 8, 6, COLORS[0]);
    }

    for (let i = 0; i < 15; i++) {
      overlay.box((random() - 0.5) * 70, (random() - 0.5) * 45, -(40 + random() * 60), 6, 6, 6, WIREFRAMES[1]);
    }

    for (let i = 0; i < 10; i++) {
      overlay.sphere((random() - 0.5) * 50, (random() - 0.5) * 30, -(50 + random() * 50), 4, WIREFRAMES[2]);
    }
  });
}

function benchmarkRectangles2D(): BenchmarkResult {
  resetRandom();

  return benchmark('100 filled rects (2D)', 3000, () => {
    for (let i = 0; i < 100; i++) {
      overlay.rectangle(random() * WIDTH, random() * HEIGHT, 20 + random() * 80, 20 + random() * 80, COLORS[i % 6]);
    }
  });
}

function benchmarkRectangles2DOutline(): BenchmarkResult {
  resetRandom();

  return benchmark('100 outline rects (2D)', 3000, () => {
    for (let i = 0; i < 100; i++) {
      overlay.rectangle(random() * WIDTH, random() * HEIGHT, 20 + random() * 80, 20 + random() * 80, OUTLINES[i % 6]);
    }
  });
}

function benchmarkRectangles3D(): BenchmarkResult {
  resetRandom();

  return benchmark('100 filled rects (3D)', 2000, () => {
    for (let i = 0; i < 100; i++) {
      overlay.rectangle3D((random() - 0.5) * 100, (random() - 0.5) * 60, -(50 + random() * 100), 10, 10, COLORS[i % 6]);
    }
  });
}

function benchmarkSpheres3D(): BenchmarkResult {
  resetRandom();

  return benchmark('20 spheres (3D, 12 seg)', 1500, () => {
    for (let i = 0; i < 20; i++) {
      overlay.sphere((random() - 0.5) * 60, (random() - 0.5) * 40, -(50 + random() * 60), 5, SOLIDS_3D[i % 6]);
    }
  });
}

function benchmarkText2D(): BenchmarkResult {
  return benchmark('50 outlined text strings (2D)', 2000, () => {
    for (let i = 0; i < 50; i++) {
      overlay.text('Hello World 123', (i % 10) * 180 + 50, floor(i / 10) * 50 + 50, LABEL);
    }
  });
}

const scenarios: Array<() => BenchmarkResult> = [
  benchmarkEmpty,
  benchmarkLines2D,
  benchmarkRectangles2D,
  benchmarkRectangles2DOutline,
  benchmarkCircles2D,
  benchmarkCircles2DOutline,
  benchmarkText2D,
  benchmarkMixed2D,
  benchmarkHud,
  benchmarkEffects,
  benchmarkRectangles3D,
  benchmarkBoxes3D,
  benchmarkSpheres3D,
  benchmarkMixed3D,
  benchmarkFullScene,
];

benchmarkTotal = scenarios.length;

console.log('='.repeat(70));
console.log('bun-overlay Performance Benchmark');
console.log('='.repeat(70));
console.log(`Resolution: ${WIDTH}x${HEIGHT}`);
console.log(`Mode:       ${mode}`);
console.log(`Scenarios:  ${benchmarkTotal}`);
console.log('');

const results: BenchmarkResult[] = scenarios.map((scenario) => scenario());

// Print results
console.log('');
console.log('Results:');
console.log('-'.repeat(70));
console.log('| Scenario                          | Iters | ms/frame |   FPS   |');
console.log('-'.repeat(70));

for (const result of results) {
  const framesPerSecond = result.framesPerSecond.toFixed(0).padStart(7);
  const iterationsText = result.iterations.toString().padStart(5);
  const millisecondsPerFrame = result.averageMilliseconds.toFixed(3).padStart(8);
  const name = result.name.padEnd(33);

  console.log(`| ${name} | ${iterationsText} | ${millisecondsPerFrame} | ${framesPerSecond} |`);
}

console.log('-'.repeat(70));
console.log('');

// Summary
const below1000 = results.filter((result) => result.framesPerSecond < 1000);

if (below1000.length === 0) {
  console.log('SUCCESS: All benchmarks achieved 1000+ FPS');
} else {
  console.log(`WARNING: ${below1000.length} benchmark(s) below 1000 FPS:`);

  for (const result of below1000) {
    console.log(`  - ${result.name}: ${result.framesPerSecond.toFixed(0)} FPS`);
  }
}

console.log('');
console.log('Benchmark complete.');
overlay.close();
process.exit(0);
