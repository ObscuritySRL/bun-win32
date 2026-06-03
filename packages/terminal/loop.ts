import { CharTerm } from './char';
import { ConsoleSession, detectConsoleSize } from './console';
import { readEnv, readEnvNumber } from './env';
import { ConsoleInput } from './input';
import { createFrameWaiter } from './pacing';
import { Term } from './pixel';
import { standardOutput } from './stdout';
import type { RGB, TermDepth, TermDiff, TermMode, TermOptions } from './types';

const { max, min, round } = Math;

/** Per-app configuration for the pixel surface (`run`). */
export interface AppSpec {
  /** Seconds of simulation to advance before a CAPTURE_PNG. */
  captureT?: number;
  /** Colour depth (env `TERM_DEPTH` overrides). */
  depth?: TermDepth;
  /** Diff strategy (env `TERM_DIFF` overrides). */
  diff?: TermDiff;
  /** Draw the built-in FPS HUD (default true). */
  drawHud?: boolean;
  /** Per-frame draw callback. */
  frame: (surface: Term, time: number, deltaTime: number, frame: number) => void;
  /** One-line HUD caption under the FPS line. */
  hud?: string;
  /** Called once before the first frame. */
  init?: (surface: Term) => void | Promise<void>;
  /** Sub-cell mode (env `TERM_MODE` overrides). */
  mode?: TermMode;
  /** Enable mouse reporting; the loop then maintains `surface.mouse`. */
  mouse?: boolean;
  /** Handle a key press (lowercased). ESC and Ctrl-C always quit. */
  onKey?: (key: string, surface: Term) => void;
  /** Whether the spacebar toggles pause (default true). */
  pauseOnSpace?: boolean;
  /** Whether `q` quits (default true). */
  quitOnQ?: boolean;
  /** Called when the terminal is resized, with a fresh surface; falls back to `init`. */
  resize?: (surface: Term) => void | Promise<void>;
  /** Live frame-rate cap (0 = uncapped). */
  targetFps?: number;
  /** Per-channel drift tolerance for `diff: 'threshold'` (env `TERM_THRESHOLD` overrides). */
  threshold?: number;
  /** App title — shown in the HUD and set as the console window title. */
  title: string;
}

const pickEnumEnv = <T extends string>(name: string, valid: readonly T[], fallback: T | undefined): T | undefined => {
  const value = readEnv(name) as T | undefined;
  return value !== undefined && valid.includes(value) ? value : fallback;
};

const resolveOptions = (spec: AppSpec): TermOptions => ({
  depth: pickEnumEnv<TermDepth>('TERM_DEPTH', ['16', '256', 'truecolor'], spec.depth),
  diff: pickEnumEnv<TermDiff>('TERM_DIFF', ['exact', 'none', 'threshold'], spec.diff),
  mode: pickEnumEnv<TermMode>('TERM_MODE', ['ascii', 'braille', 'half', 'quad', 'sextant'], spec.mode),
  threshold: readEnv('TERM_THRESHOLD') !== undefined ? readEnvNumber('TERM_THRESHOLD', 8) : spec.threshold,
});

const writeLine = (text: string): void => {
  standardOutput.write(text);
  standardOutput.flush();
};

/** Draw the built-in HUD plate (title + FPS + mode tag) into the framebuffer. */
const drawHud = (surface: Term, spec: AppSpec, fps: number, milliseconds: number, caption?: string): void => {
  const title = spec.title.toUpperCase();
  const tag = `${surface.mode.toUpperCase()}${surface.diff !== 'exact' ? `/${surface.diff.toUpperCase()}` : ''}${surface.depth !== 'truecolor' ? `/${surface.depth}` : ''}`;
  const statusLine = `FPS ${fps.toFixed(0).padStart(3)}  ${milliseconds.toFixed(1)}MS  ${surface.width}X${surface.height}  ${tag}`;
  const hudCaption = caption ?? spec.hud ?? '';
  const plateWidth = max(Term.textWidth(title), Term.textWidth(statusLine), Term.textWidth(hudCaption)) + 6;
  const plateHeight = hudCaption ? 30 : 22;
  surface.plate(2, 2, plateWidth, plateHeight, 0.5);
  // FPS goes green ≥60, amber 30–60, red <30 — legible at a glance.
  const fpsColor: [number, number, number] = fps >= 60 ? [120, 255, 140] : fps >= 30 ? [255, 200, 90] : [255, 110, 110];
  surface.text(5, 4, title, 235, 130, 90, 1);
  surface.text(5, 12, statusLine, fpsColor[0], fpsColor[1], fpsColor[2], 1);
  if (hudCaption) surface.text(5, 20, hudCaption, 150, 150, 165, 1);
};

const runCapture = async (spec: AppSpec, options: TermOptions, capturePath: string, captureFps: number): Promise<void> => {
  const fixedDeltaTime = 1 / captureFps;
  const columns = max(20, readEnvNumber('TERM_COLS', 160) | 0);
  const rows = max(8, readEnvNumber('TERM_ROWS', 50) | 0);
  const surface = new Term(columns, rows, options);
  await spec.init?.(surface);
  const captureSeconds = readEnvNumber('CAPTURE_T', spec.captureT ?? 4);
  const frameCount = max(1, readEnvNumber('CAPTURE_FRAMES', 1));
  const shotTimes: number[] = [];
  for (let index = 0; index < frameCount; index++) shotTimes.push(frameCount === 1 ? captureSeconds : (captureSeconds * index) / (frameCount - 1));
  const writeShot = async (index: number): Promise<void> => {
    const saved = surface.pixels.slice();
    if (spec.drawHud !== false) drawHud(surface, spec, captureFps, fixedDeltaTime * 1000, spec.hud);
    const png = surface.toPNG();
    const path = frameCount === 1 ? capturePath : capturePath.replace(/(\.png)?$/i, `.${index}.png`);
    await Bun.write(path, png);
    surface.pixels.set(saved);
  };
  let shot = 0;
  let time = 0;
  let frame = 0;
  const totalFrames = max(1, round(captureSeconds / fixedDeltaTime));
  for (let step = 0; step <= totalFrames && shot < shotTimes.length; step++) {
    spec.frame(surface, time, step === 0 ? 0 : fixedDeltaTime, frame);
    while (shot < shotTimes.length && time >= shotTimes[shot] - 1e-9) {
      await writeShot(shot);
      shot++;
    }
    time += fixedDeltaTime;
    frame++;
  }
  while (shot < shotTimes.length) {
    await writeShot(shot);
    shot++;
  }
  writeLine(`captured ${frameCount} frame(s) → ${capturePath} (${columns}x${rows} cells, ${surface.width}x${surface.height}px)\n`);
};

const runBench = async (spec: AppSpec, options: TermOptions, captureFps: number): Promise<void> => {
  const fixedDeltaTime = 1 / captureFps;
  const columns = max(20, readEnvNumber('TERM_COLS', 160) | 0);
  const rows = max(8, readEnvNumber('TERM_ROWS', 50) | 0);
  const surface = new Term(columns, rows, options);
  await spec.init?.(surface);
  const frameCount = max(60, readEnvNumber('BENCH_FRAMES', 600) | 0);
  for (let index = 0; index < 30; index++) {
    spec.frame(surface, index * fixedDeltaTime, fixedDeltaTime, index);
    surface.buildFrame();
  }
  const start = Bun.nanoseconds();
  for (let index = 0; index < frameCount; index++) {
    spec.frame(surface, index * fixedDeltaTime, fixedDeltaTime, index);
    if (spec.drawHud !== false) drawHud(surface, spec, 999, fixedDeltaTime * 1000);
    surface.buildFrame();
  }
  const seconds = (Bun.nanoseconds() - start) / 1e9;
  const fps = frameCount / seconds;
  const report = { cols: columns, demo: spec.title, fps: +fps.toFixed(1), frames: frameCount, msPerFrame: +((seconds / frameCount) * 1000).toFixed(3), px: `${surface.width}x${surface.height}`, rows };
  writeLine(`${JSON.stringify(report)}\n`);
};

const runLive = async (spec: AppSpec, options: TermOptions): Promise<void> => {
  const session = new ConsoleSession({ title: spec.title });
  let size = detectConsoleSize();
  let surface = new Term(size.columns, size.rows, options);
  await spec.init?.(surface);

  let paused = false;
  let running = true;
  let pendingColumns = -1;
  let pendingRows = -1;

  const input = new ConsoleInput({
    key: (event) => {
      if (!event.down) return;
      if (event.key === 'esc' || (event.ctrl && event.key === 'c')) {
        running = false;
        return;
      }
      const lower = event.key.toLowerCase();
      if (lower === 'q' && spec.quitOnQ !== false) {
        running = false;
        return;
      }
      if (event.key === 'space') {
        if (spec.pauseOnSpace !== false) paused = !paused;
        spec.onKey?.('space', surface);
        return;
      }
      spec.onKey?.(lower, surface);
    },
    pointer: (event) => {
      const pixelsPerColumn = surface.width / surface.columns;
      const pixelsPerRow = surface.height / surface.rows;
      const mouse = surface.mouse;
      mouse.x = max(0, min(surface.width - 1, (event.cellX * pixelsPerColumn) | 0));
      mouse.y = max(0, min(surface.height - 1, (event.cellY * pixelsPerRow) | 0));
      mouse.inside = true;
      mouse.active = true;
      mouse.sequence++;
      if (event.wheel !== 0) mouse.wheel += event.wheel;
      else mouse.down = event.down;
    },
    resize: (columns, rows) => {
      pendingColumns = max(20, min(columns, 400));
      pendingRows = max(8, min(rows - 1, 200));
    },
  });

  const frameWaiter = (spec.targetFps ?? 0) > 0 ? createFrameWaiter() : null;
  const minimumFrameMilliseconds = (spec.targetFps ?? 0) > 0 ? 1000 / (spec.targetFps ?? 0) : 0;
  const durationMilliseconds = readEnvNumber('DEMO_DURATION_MS', 0);

  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) return;
    cleaned = true;
    input.restore();
    session.restore();
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    running = false;
  });

  const startNanoseconds = Bun.nanoseconds();
  let lastNanoseconds = startNanoseconds;
  let fpsAverage = 60;
  let frame = 0;
  let simulationTime = 0;

  try {
    while (running) {
      input.poll();
      if (pendingColumns > 0) {
        if (pendingColumns !== surface.columns || pendingRows !== surface.rows) {
          surface = new Term(pendingColumns, pendingRows, options);
          if (spec.resize) await spec.resize(surface);
          else await spec.init?.(surface);
        }
        pendingColumns = -1;
        pendingRows = -1;
      }

      const now = Bun.nanoseconds();
      let deltaTime = (now - lastNanoseconds) / 1e9;
      lastNanoseconds = now;
      if (deltaTime > 0.1) deltaTime = 0.1;
      if (!paused) simulationTime += deltaTime;
      const instantFps = deltaTime > 0 ? 1 / deltaTime : 999;
      fpsAverage = fpsAverage * 0.9 + instantFps * 0.1;

      spec.frame(surface, simulationTime, paused ? 0 : deltaTime, frame);
      if (spec.drawHud !== false) drawHud(surface, spec, fpsAverage, deltaTime * 1000, paused ? `${spec.hud ?? ''}  [PAUSED]` : spec.hud);
      surface.present();
      frame++;

      if (durationMilliseconds > 0 && (now - startNanoseconds) / 1e6 >= durationMilliseconds) break;
      if (minimumFrameMilliseconds > 0) {
        const wait = minimumFrameMilliseconds - (Bun.nanoseconds() - now) / 1e6;
        if (wait > 0.2) {
          if (frameWaiter) frameWaiter(wait);
          else await Bun.sleep(wait);
        }
      }
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
  } finally {
    cleanup();
  }
};

/**
 * Run a pixel-surface app. Headless when `CAPTURE_PNG` or `BENCH` is set, otherwise
 * an interactive live loop on the alternate screen.
 *
 * @example
 * await run({ title: 'Demo', frame: (surface, time) => surface.clear(0, 0, (time * 60) & 255) });
 */
export async function run(spec: AppSpec): Promise<void> {
  const options = resolveOptions(spec);
  const captureFps = readEnvNumber('CAPTURE_FPS', 60);
  const capturePath = readEnv('CAPTURE_PNG');
  if (capturePath !== undefined) return runCapture(spec, options, capturePath, captureFps);
  if (readEnv('BENCH') === '1') return runBench(spec, options, captureFps);
  return runLive(spec, options);
}

/** Per-app configuration for the char surface (`runText`). */
export interface TextAppSpec {
  /** Seconds of simulation to advance before a CAPTURE_PNG. */
  captureT?: number;
  /** Draw the top-right FPS readout (default true). */
  drawFps?: boolean;
  /** Per-frame draw callback. */
  frame: (surface: CharTerm, time: number, deltaTime: number, frame: number) => void;
  /** One-line HUD caption shown left of the FPS readout. */
  hud?: string;
  /** Called once before the first frame. */
  init?: (surface: CharTerm) => void | Promise<void>;
  /** Enable mouse reporting; the loop then maintains `surface.mouse` (in cells). */
  mouse?: boolean;
  /** Handle a key press (case-preserved; `esc`/`enter`/arrows/…). Ctrl-C always quits. */
  onKey?: (key: string, surface: CharTerm) => void;
  /** Called when the terminal is resized, with a fresh surface; falls back to `init`. */
  resize?: (surface: CharTerm) => void | Promise<void>;
  /** Live frame-rate cap (default 60; 0 = uncapped). */
  targetFps?: number;
  /** App title — set as the console window title. */
  title: string;
}

/** Top-right FPS readout, coloured by performance. */
const drawFps = (surface: CharTerm, fps: number, hud?: string): void => {
  const fpsColor: RGB = fps >= 60 ? [120, 255, 140] : fps >= 30 ? [255, 200, 90] : [255, 110, 110];
  const label = ` ${fps.toFixed(0).padStart(3)} FPS `;
  const x = max(0, surface.columns - label.length);
  surface.fillRect(x, 0, label.length, 1, [22, 22, 30]);
  surface.text(x, 0, label, fpsColor, [22, 22, 30], true);
  if (hud) {
    const hudX = max(0, x - hud.length - 2);
    if (hudX > 0) {
      surface.fillRect(hudX, 0, hud.length + 1, 1, [22, 22, 30]);
      surface.text(hudX, 0, hud, [150, 150, 165], [22, 22, 30]);
    }
  }
};

const runTextCapture = async (spec: TextAppSpec, capturePath: string, captureFps: number): Promise<void> => {
  const fixedDeltaTime = 1 / captureFps;
  const columns = max(20, readEnvNumber('TERM_COLS', 160) | 0);
  const rows = max(8, readEnvNumber('TERM_ROWS', 50) | 0);
  const surface = new CharTerm(columns, rows);
  await spec.init?.(surface);
  const captureSeconds = readEnvNumber('CAPTURE_T', spec.captureT ?? 4);
  const frameCount = max(1, readEnvNumber('CAPTURE_FRAMES', 1));
  const shotTimes: number[] = [];
  for (let index = 0; index < frameCount; index++) shotTimes.push(frameCount === 1 ? captureSeconds : (captureSeconds * index) / (frameCount - 1));
  const writeShot = async (index: number): Promise<void> => {
    const savedBackground = surface.background.slice();
    const savedBold = surface.bold.slice();
    const savedCharacters = surface.characters.slice();
    const savedForeground = surface.foreground.slice();
    if (spec.drawFps !== false) drawFps(surface, captureFps, spec.hud);
    const png = surface.toPNG();
    const path = frameCount === 1 ? capturePath : capturePath.replace(/(\.png)?$/i, `.${index}.png`);
    await Bun.write(path, png);
    surface.background.set(savedBackground);
    surface.bold.set(savedBold);
    surface.characters.set(savedCharacters);
    surface.foreground.set(savedForeground);
  };
  let shot = 0;
  let time = 0;
  let frame = 0;
  const totalFrames = max(1, round(captureSeconds / fixedDeltaTime));
  for (let step = 0; step <= totalFrames && shot < shotTimes.length; step++) {
    spec.frame(surface, time, step === 0 ? 0 : fixedDeltaTime, frame);
    while (shot < shotTimes.length && time >= shotTimes[shot] - 1e-9) {
      await writeShot(shot);
      shot++;
    }
    time += fixedDeltaTime;
    frame++;
  }
  while (shot < shotTimes.length) {
    await writeShot(shot);
    shot++;
  }
  writeLine(`captured ${frameCount} frame(s) → ${capturePath} (${columns}x${rows} cells)\n`);
};

const runTextBench = async (spec: TextAppSpec, captureFps: number): Promise<void> => {
  const fixedDeltaTime = 1 / captureFps;
  const columns = max(20, readEnvNumber('TERM_COLS', 160) | 0);
  const rows = max(8, readEnvNumber('TERM_ROWS', 50) | 0);
  const surface = new CharTerm(columns, rows);
  await spec.init?.(surface);
  const frameCount = max(60, readEnvNumber('BENCH_FRAMES', 600) | 0);
  for (let index = 0; index < 30; index++) {
    spec.frame(surface, index * fixedDeltaTime, fixedDeltaTime, index);
    if (spec.drawFps !== false) drawFps(surface, 999, spec.hud);
    surface.buildFrame();
  }
  const start = Bun.nanoseconds();
  for (let index = 0; index < frameCount; index++) {
    spec.frame(surface, index * fixedDeltaTime, fixedDeltaTime, index);
    if (spec.drawFps !== false) drawFps(surface, 999, spec.hud);
    surface.buildFrame();
  }
  const seconds = (Bun.nanoseconds() - start) / 1e9;
  const fps = frameCount / seconds;
  const report = { cols: columns, demo: spec.title, fps: +fps.toFixed(1), frames: frameCount, msPerFrame: +((seconds / frameCount) * 1000).toFixed(3), rows };
  writeLine(`${JSON.stringify(report)}\n`);
};

const runTextLive = async (spec: TextAppSpec): Promise<void> => {
  const session = new ConsoleSession({ title: spec.title });
  const size = detectConsoleSize();
  let surface = new CharTerm(size.columns, size.rows);
  await spec.init?.(surface);

  let running = true;
  let pendingColumns = -1;
  let pendingRows = -1;

  const input = new ConsoleInput({
    key: (event) => {
      if (!event.down) return;
      if (event.ctrl && event.key === 'c') {
        running = false;
        return;
      }
      spec.onKey?.(event.key, surface);
    },
    pointer: (event) => {
      const mouse = surface.mouse;
      mouse.x = max(0, min(surface.columns - 1, event.cellX));
      mouse.y = max(0, min(surface.rows - 1, event.cellY));
      mouse.inside = true;
      mouse.active = true;
      mouse.sequence++;
      if (event.wheel !== 0) mouse.wheel += event.wheel;
      else mouse.down = event.down;
    },
    resize: (columns, rows) => {
      pendingColumns = max(20, min(columns, 400));
      pendingRows = max(8, min(rows - 1, 200));
    },
  });

  const frameWaiter = createFrameWaiter();
  const targetFps = spec.targetFps ?? 60;
  const minimumFrameMilliseconds = targetFps > 0 ? 1000 / targetFps : 0;
  const durationMilliseconds = readEnvNumber('DEMO_DURATION_MS', 0);

  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) return;
    cleaned = true;
    input.restore();
    session.restore();
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    running = false;
  });

  const startNanoseconds = Bun.nanoseconds();
  let lastNanoseconds = startNanoseconds;
  let fpsAverage = 60;
  let frame = 0;
  let simulationTime = 0;

  try {
    while (running) {
      input.poll();
      if (pendingColumns > 0) {
        if (pendingColumns !== surface.columns || pendingRows !== surface.rows) {
          surface = new CharTerm(pendingColumns, pendingRows);
          if (spec.resize) await spec.resize(surface);
          else await spec.init?.(surface);
        }
        pendingColumns = -1;
        pendingRows = -1;
      }

      const now = Bun.nanoseconds();
      let deltaTime = (now - lastNanoseconds) / 1e9;
      lastNanoseconds = now;
      if (deltaTime > 0.1) deltaTime = 0.1;
      simulationTime += deltaTime;
      const instantFps = deltaTime > 0 ? 1 / deltaTime : 999;
      fpsAverage = fpsAverage * 0.9 + instantFps * 0.1;

      spec.frame(surface, simulationTime, deltaTime, frame);
      if (spec.drawFps !== false) drawFps(surface, fpsAverage, spec.hud);
      surface.present();
      frame++;

      if (durationMilliseconds > 0 && (now - startNanoseconds) / 1e6 >= durationMilliseconds) break;
      if (minimumFrameMilliseconds > 0) {
        const wait = minimumFrameMilliseconds - (Bun.nanoseconds() - now) / 1e6;
        if (wait > 0.2) {
          if (frameWaiter) frameWaiter(wait);
          else await Bun.sleep(wait);
        }
      }
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
  } finally {
    cleanup();
  }
};

/**
 * Run a char-surface (TUI) app. Headless when `CAPTURE_PNG` or `BENCH` is set,
 * otherwise an interactive live loop on the alternate screen.
 *
 * @example
 * await runText({ title: 'TUI', frame: (surface) => surface.text(0, 0, 'hello', [255, 255, 255]) });
 */
export async function runText(spec: TextAppSpec): Promise<void> {
  const captureFps = readEnvNumber('CAPTURE_FPS', 60);
  const capturePath = readEnv('CAPTURE_PNG');
  if (capturePath !== undefined) return runTextCapture(spec, capturePath, captureFps);
  if (readEnv('BENCH') === '1') return runTextBench(spec, captureFps);
  return runTextLive(spec);
}
