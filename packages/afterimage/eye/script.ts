// Headless mode: drive the real eye and the real memory from a script, on a virtual clock, into an
// offscreen texture — no window, no desktop, no focus stolen. Every flow can be exercised and every
// frame looked at.
//
//   AFTERIMAGE_SCRIPT="stage 8; open; wait 0.6; shot opened; key Left 20; wait 0.4; shot back; quit"
//
// Commands (`;`-separated): stage <s> · wait <s> · open · close · hotkey · key <[Ctrl+][Shift+]Name> [times]
// · type <text> · wheel <notches> · move <x> <y> · drag <x0> <y0> <x1> <y1> · click <x> <y>
// · dblclick <x> <y> · shot <name> · clip <name> <s> · quit. Coordinates are DIPs.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { DXGI_FORMAT_B8G8R8A8_UNORM, comRelease, encodePNGFromBGRA, makeTexture, readbackTexture, type TextureResult } from '@bun-win32/gpu';

import type { DisplayInfo, WorkerOptions } from '../shared/protocol';
import { Eye, type Presenter, startMemory } from './eye';
import type { Surface } from './renderer';
import type { InputEvent } from './window';

const keyCodes: Record<string, number> = {
  A: 0x41,
  Backspace: 0x08,
  C: 0x43,
  Delete: 0x2e,
  Down: 0x28,
  End: 0x23,
  Enter: 0x0d,
  Escape: 0x1b,
  Home: 0x24,
  Left: 0x25,
  P: 0x50,
  PageDown: 0x22,
  PageUp: 0x21,
  Right: 0x27,
  S: 0x53,
  Space: 0x20,
  Up: 0x26,
  V: 0x56,
};
const frameMilliseconds = 1_000 / 60;

export interface ScriptOptions {
  captureHertz: number;
  /** Where shots and clips go. */
  directory: string;
  scale: number;
  script: string;
  source: 'screen' | 'stage';
  stageHeight: number;
  stageScenario: string;
  stageWidth: number;
}

class OffscreenPresenter implements Presenter {
  readonly scale: number;
  #size: [number, number] = [0, 0];
  #target: TextureResult | null = null;

  constructor(scale: number) {
    this.scale = scale;
  }

  get size(): [number, number] {
    return this.#size;
  }

  get texture(): bigint {
    return this.#target?.tex ?? 0n;
  }

  hide(): void {}

  prepare(display: DisplayInfo): void {}

  present(): void {}

  reveal(): void {}

  surface(display: DisplayInfo): { scale: number; surface: Surface } {
    if (this.#target === null || this.#size[0] !== display.width || this.#size[1] !== display.height) {
      if (this.#target !== null) comRelease(this.#target.tex);
      this.#target = makeTexture({ format: DXGI_FORMAT_B8G8R8A8_UNORM, h: display.height, rtv: true, srv: true, w: display.width });
      this.#size = [display.width, display.height];
    }
    return { scale: this.scale, surface: { height: display.height, renderTarget: this.#target.rtv!, texture: this.#target.tex, width: display.width } };
  }

  wait(): void {}
}

export async function runScript(options: ScriptOptions): Promise<void> {
  mkdirSync(options.directory, { recursive: true });
  const stageEpoch = new Date(2026, 9, 12, 14, 30, 0).getTime();
  let virtual = 0;
  const clock = { epoch: () => (options.source === 'stage' ? stageEpoch + virtual : Date.now()), now: () => virtual };
  const workerOptions: WorkerOptions = {
    budgetBytes: 0x2000_0000,
    captureHertz: options.captureHertz,
    source: options.source,
    stageEpoch,
    stageHeight: options.stageHeight,
    stageScale: options.scale,
    stageScenario: options.stageScenario,
    stageWidth: options.stageWidth,
  };
  const worker = startMemory();
  const presenter = new OffscreenPresenter(options.scale);
  const eye = new Eye(worker, workerOptions, presenter, clock, { copyImage: () => {}, readClipboardText: () => '5m', recording: () => {}, unavailable: () => console.log('[script] unavailable') });
  await eye.ready;
  const scale = options.scale;
  let queued: InputEvent[] = [];
  let pointer: [number, number] = [0, 0];
  let stageDebt = 0;

  const settle = async (): Promise<void> => {
    for (let spin = 0; spin < 400 && eye.busy; spin += 1) await Bun.sleep(1);
    await new Promise((resolve) => setImmediate(resolve));
  };

  /** Advance the stage's virtual time in capture-sized steps, letting the memory record each. */
  const advanceStage = async (milliseconds: number): Promise<void> => {
    if (options.source !== 'stage') return;
    stageDebt += milliseconds;
    const step = eye.visible ? 250 : 1_000 / options.captureHertz;
    while (stageDebt >= step) {
      stageDebt -= step;
      await eye.stage(step);
    }
  };

  const frame = async (capture: ((index: number) => Promise<void>) | null, index: number): Promise<void> => {
    virtual += frameMilliseconds;
    await advanceStage(frameMilliseconds);
    await settle();
    const events = queued;
    queued = [];
    eye.step(events);
    if (eye.visible || events.length > 0) await settle();
    if (capture !== null) await capture(index);
  };

  const shot = async (name: string): Promise<void> => {
    eye.redraw();
    const [width, height] = presenter.size;
    if (presenter.texture === 0n) return;
    const pixels = readbackTexture(presenter.texture, width, height, 4, DXGI_FORMAT_B8G8R8A8_UNORM);
    await Bun.write(join(options.directory, `${name}.png`), encodePNGFromBGRA(pixels, width, height));
    console.log(`[script] shot ${name}.png  (worst frame ${eye.frames.worst.toFixed(2)} ms virtual-paced)`);
  };

  const press = (spec: string): void => {
    const parts = spec.split('+');
    const name = parts.pop()!;
    const key = keyCodes[name] ?? name.toUpperCase().charCodeAt(0);
    const control = parts.includes('Ctrl');
    const shift = parts.includes('Shift');
    queued.push({ alt: false, control, down: true, key, repeat: false, shift, type: 'key' });
    queued.push({ alt: false, control, down: false, key, repeat: false, shift, type: 'key' });
  };

  for (const raw of options.script.split(';')) {
    const [command, ...rest] = raw.trim().split(/\s+/);
    if (command === undefined || command === '') continue;
    const number = (index: number): number => Number(rest[index]);
    if (Bun.env.AFTERIMAGE_TRACE) console.log(`[script] ${raw.trim()}`);
    switch (command) {
      case 'stage':
        virtual += number(0) * 1_000;
        await advanceStage(number(0) * 1_000);
        await settle();
        break;
      case 'wait':
        for (let index = 0; index < Math.round((number(0) * 1_000) / frameMilliseconds); index += 1) await frame(null, index);
        break;
      case 'open':
      case 'hotkey':
        eye.toggle(0);
        for (let spin = 0; spin < 2_000 && !eye.visible && command === 'open'; spin += 1) await Bun.sleep(1);
        break;
      case 'close':
        queued.push({ alt: false, control: false, down: true, key: keyCodes.Escape!, repeat: false, shift: false, type: 'key' });
        break;
      case 'key':
        for (let times = 0; times < (rest[1] === undefined ? 1 : number(1)); times += 1) {
          press(rest[0]!);
          await frame(null, 0);
        }
        break;
      case 'type':
        for (const character of rest.join(' ')) {
          queued.push({ text: character, type: 'character' });
          await frame(null, 0);
        }
        break;
      case 'wheel':
        queued.push({ delta: number(0), horizontal: false, type: 'wheel' });
        await frame(null, 0);
        break;
      case 'move':
        pointer = [number(0) * scale, number(1) * scale];
        queued.push({ type: 'pointer', x: pointer[0], y: pointer[1] });
        await frame(null, 0);
        break;
      case 'click':
      case 'dblclick':
        pointer = [number(0) * scale, number(1) * scale];
        queued.push({ type: 'pointer', x: pointer[0], y: pointer[1] });
        queued.push({ button: 'left', double: command === 'dblclick', down: true, type: 'button', x: pointer[0], y: pointer[1] });
        queued.push({ button: 'left', double: false, down: false, type: 'button', x: pointer[0], y: pointer[1] });
        await frame(null, 0);
        break;
      case 'drag': {
        const from: [number, number] = [number(0) * scale, number(1) * scale];
        const to: [number, number] = [number(2) * scale, number(3) * scale];
        queued.push({ type: 'pointer', x: from[0], y: from[1] });
        queued.push({ button: 'left', double: false, down: true, type: 'button', x: from[0], y: from[1] });
        await frame(null, 0);
        for (let step = 1; step <= 12; step += 1) {
          const x = from[0] + ((to[0] - from[0]) * step) / 12;
          const y = from[1] + ((to[1] - from[1]) * step) / 12;
          queued.push({ type: 'pointer', x, y });
          await frame(null, 0);
        }
        queued.push({ button: 'left', double: false, down: false, type: 'button', x: to[0], y: to[1] });
        await frame(null, 0);
        break;
      }
      case 'shot':
        await shot(rest[0]!);
        break;
      case 'clip': {
        const name = rest[0]!;
        const frames = Math.round((number(1) * 1_000) / frameMilliseconds);
        const [width, height] = presenter.size;
        const encoder = Bun.spawn(
          [
            'ffmpeg',
            '-loglevel',
            'error',
            '-y',
            '-f',
            'rawvideo',
            '-pix_fmt',
            'bgra',
            '-s',
            `${width}x${height}`,
            '-r',
            '60',
            '-i',
            '-',
            '-c:v',
            'libx264',
            '-preset',
            'slow',
            '-crf',
            '16',
            '-pix_fmt',
            'yuv420p',
            join(options.directory, `${name}.mp4`),
          ],
          { stdin: 'pipe' },
        );
        for (let index = 0; index < frames; index += 1) {
          await frame(async () => {
            eye.redraw();
            encoder.stdin.write(readbackTexture(presenter.texture, width, height, 4, DXGI_FORMAT_B8G8R8A8_UNORM));
          }, index);
        }
        await encoder.stdin.end();
        await encoder.exited;
        console.log(`[script] clip ${name}.mp4 (${frames} frames)`);
        break;
      }
      case 'read':
        await eye.read();
        break;
      case 'pause':
      case 'resume':
        eye.send({ type: command });
        await frame(null, 0);
        break;
      case 'quit':
        eye.send({ type: 'quit' });
        await Bun.sleep(200);
        return;
      default:
        console.log(`[script] unknown command: ${command}`);
    }
  }
  eye.send({ type: 'quit' });
  await Bun.sleep(200);
}
