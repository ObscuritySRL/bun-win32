// Recording real footage: every frame Iris renders can be read back from the swap chain (before Present) and piped
// as raw BGRA into ffmpeg (H.264, constant 60 fps — the scripted clock is fixed-step, so encoding speed never shows),
// or saved as a full-resolution PNG still. Frames are composited over a screenshot of the desktop taken just before
// the overlay appears, so the footage shows exactly what a person at the screen sees.

import { mkdirSync } from 'node:fs';

import Gdi32 from '@bun-win32/gdi32';
import User32 from '@bun-win32/user32';
import { encodePNGFromBGRA } from '@bun-win32/gpu';

import type { Iris } from './app';
import type { Rect } from './geometry';
import { readMemory } from './native';
import type { Renderer, Texture } from './renderer';
import type { Wallpaper } from './wallpaper';

export interface ClipRecord {
  file: string;
  frames: number;
  height: number;
  name: string;
  note: string;
  seconds: number;
  width: number;
}

export interface ShotRecord {
  file: string;
  height: number;
  name: string;
  note: string;
  width: number;
}

interface ActiveClip {
  frames: number;
  name: string;
  note: string;
  process: ReturnType<typeof Bun.spawn>;
  file: string;
  width: number;
  height: number;
}

const FFMPEG_CANDIDATES = [Bun.env.IRIS_FFMPEG ?? '', 'ffmpeg', 'C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\ffmpeg.exe'];

function findFfmpeg(): string | null {
  for (const candidate of FFMPEG_CANDIDATES) {
    if (candidate.length === 0) continue;
    const resolved = candidate.includes('\\') ? candidate : Bun.which(candidate);
    if (resolved !== null && resolved !== undefined) return resolved;
  }
  return null;
}

/** Box-filter downscale of tightly packed BGRA by an integer factor. */
function downscale(pixels: Buffer, width: number, height: number, factor: number): Buffer {
  if (factor === 1) return pixels;
  const outWidth = Math.floor(width / factor);
  const outHeight = Math.floor(height / factor);
  const out = Buffer.alloc(outWidth * outHeight * 4);
  const area = factor * factor;
  for (let y = 0; y < outHeight; y += 1) {
    for (let x = 0; x < outWidth; x += 1) {
      let blue = 0;
      let green = 0;
      let red = 0;
      for (let dy = 0; dy < factor; dy += 1) {
        let source = ((y * factor + dy) * width + x * factor) * 4;
        for (let dx = 0; dx < factor; dx += 1) {
          blue += pixels[source]!;
          green += pixels[source + 1]!;
          red += pixels[source + 2]!;
          source += 4;
        }
      }
      const target = (y * outWidth + x) * 4;
      out[target] = blue / area;
      out[target + 1] = green / area;
      out[target + 2] = red / area;
      out[target + 3] = 255;
    }
  }
  return out;
}

export class Recorder {
  #active: ActiveClip | null = null;
  #ffmpeg = findFfmpeg();
  #pendingShots: { name: string; note: string }[] = [];
  #renderer: Renderer | null = null;
  #underlay: Texture | null = null;
  readonly clips: ClipRecord[] = [];
  readonly directory: string;
  readonly fps: number;
  readonly scale: number;
  readonly shots: ShotRecord[] = [];
  /** Clean underlay: wallpaper + real taskbar instead of a full screenshot. */
  clean = false;
  taskbarHeight = 0;

  constructor(directory: string, scale = 1, fps = 60) {
    mkdirSync(directory, { recursive: true });
    this.directory = directory;
    this.scale = scale;
    this.fps = fps;
  }

  /** Screenshot the real desktop (GDI) as the underlay for composited footage. Call before the overlay appears. */
  captureDesktop(renderer: Renderer, monitor: Rect): void {
    this.#renderer = renderer;
    const screen = User32.GetDC(0n);
    const memory = Gdi32.CreateCompatibleDC(screen);
    const info = Buffer.alloc(44);
    info.writeUInt32LE(40, 0);
    info.writeInt32LE(monitor.width, 4);
    info.writeInt32LE(-monitor.height, 8);
    info.writeUInt16LE(1, 12);
    info.writeUInt16LE(32, 14);
    const bitsOut = Buffer.alloc(8);
    const bitmap = Gdi32.CreateDIBSection(memory, info.ptr, 0, bitsOut.ptr, 0n, 0);
    const previous = Gdi32.SelectObject(memory, bitmap);
    Gdi32.BitBlt(memory, 0, 0, monitor.width, monitor.height, screen, monitor.x, monitor.y, 0x00cc_0020);
    const pixels = readMemory(bitsOut.readBigUInt64LE(0), monitor.width * monitor.height * 4);
    for (let index = 3; index < pixels.length; index += 4) pixels[index] = 255;
    Gdi32.SelectObject(memory, previous);
    Gdi32.DeleteObject(bitmap);
    Gdi32.DeleteDC(memory);
    User32.ReleaseDC(0n, screen);
    if (this.#underlay !== null) renderer.releaseTexture(this.#underlay);
    this.#underlay = renderer.createTexture(monitor.width, monitor.height);
    renderer.uploadPixels(this.#underlay, pixels);
  }

  /** Composite the desktop under the overlay. In clean mode only the real taskbar strip is kept and the rest is the
   *  wallpaper — the staged windows are live captures drawn on top, so nothing private behind them leaks into footage. */
  drawUnderlay(renderer: Renderer, width: number, height: number, wallpaper: Wallpaper | null): void {
    if (this.#underlay === null) return;
    const ui = renderer.ui;
    if (!this.clean || wallpaper === null) {
      renderer.text(0, 0, width / ui, height / ui, this.#underlay.srv, [0, 0, 1, 1], [1, 1, 1, 1], 1);
      return;
    }
    renderer.backdrop(width, height, wallpaper.sharp.srv, wallpaper.uv, { accent: [0, 0, 0], accentGlow: 0, blur: 0, brightness: 1, grain: 0, opacity: 1, saturation: 1, vignette: 0 });
    const strip = this.taskbarHeight;
    if (strip > 0) renderer.text(0, (height - strip) / ui, width / ui, strip / ui, this.#underlay.srv, [0, (height - strip) / height, 1, 1], [1, 1, 1, 1], 1);
  }

  startClip(name: string, note: string, width: number, height: number): void {
    this.stopClip();
    if (this.#ffmpeg === null) {
      console.warn('[iris] ffmpeg not found — clips are disabled (stills still work). Set IRIS_FFMPEG.');
      return;
    }
    const outWidth = Math.floor(width / this.scale) & ~1;
    const outHeight = Math.floor(height / this.scale) & ~1;
    const file = `${this.directory}/${name}.mp4`;
    const process = Bun.spawn(
      [
        this.#ffmpeg,
        '-y',
        '-loglevel',
        'error',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'bgra',
        '-s',
        `${outWidth}x${outHeight}`,
        '-r',
        String(this.fps),
        '-i',
        '-',
        '-c:v',
        'libx264',
        '-preset',
        'slow',
        '-crf',
        '14',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        file,
      ],
      {
        stderr: 'inherit',
        stdin: 'pipe',
        stdout: 'ignore',
      },
    );
    this.#active = { file, frames: 0, height: outHeight, name, note, process, width: outWidth };
  }

  stopClip(): Promise<void> | null {
    const active = this.#active;
    if (active === null) return null;
    this.#active = null;
    const stdin = active.process.stdin;
    if (stdin !== undefined && typeof stdin !== 'number') stdin.end();
    this.clips.push({ file: active.file, frames: active.frames, height: active.height, name: active.name, note: active.note, seconds: active.frames / this.fps, width: active.width });
    return active.process.exited.then(() => undefined);
  }

  /** Wait for ffmpeg to accept everything written so far (backpressure — raw 1440p frames are 14 MB each). */
  async drain(): Promise<void> {
    const stdin = this.#active?.process.stdin;
    if (stdin === undefined || typeof stdin === 'number') return;
    await stdin.flush();
  }

  shot(name: string, note: string): void {
    this.#pendingShots.push({ name, note });
  }

  get recording(): boolean {
    return this.#active !== null || this.#pendingShots.length > 0;
  }

  /** Called by Iris after each frame is drawn, before Present. */
  capture(app: Iris, _step: number): void {
    if (this.#active === null && this.#pendingShots.length === 0) return;
    const surface = app.surface;
    const pixels = app.renderer.readback(surface.backBuffer, surface.width, surface.height);
    if (this.#active !== null) {
      const active = this.#active;
      const frame = downscale(pixels, surface.width, surface.height, this.scale);
      const stdin = active.process.stdin;
      if (stdin !== undefined && typeof stdin !== 'number') stdin.write(frame);
      active.frames += 1;
    }
    for (const shot of this.#pendingShots.splice(0)) {
      const file = `${this.directory}/${shot.name}.png`;
      for (let index = 3; index < pixels.length; index += 4) pixels[index] = 255;
      void Bun.write(file, encodePNGFromBGRA(pixels, surface.width, surface.height));
      this.shots.push({ file, height: surface.height, name: shot.name, note: shot.note, width: surface.width });
    }
  }

  async writeManifest(extra: Record<string, unknown>): Promise<void> {
    await Bun.write(`${this.directory}/manifest.json`, JSON.stringify({ clips: this.clips, generated: new Date().toISOString(), shots: this.shots, ...extra }, null, 2));
  }

  release(): void {
    if (this.#underlay !== null && this.#renderer !== null) this.#renderer.releaseTexture(this.#underlay);
    this.#underlay = null;
  }
}
