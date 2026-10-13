// The stage: a synthetic desktop that records exactly like a real one. Headless tests and every
// promo image come from here, so they are deterministic and never show anyone's real windows.
// Time is virtual — it only moves when the eye says `advance`.

import { DXGI_FORMAT_B8G8R8A8_UNORM, type TextureResult, comRelease, makeTexture, requireGpu } from '@bun-win32/gpu';

import { Painter } from '../shared/painter';
import type { AcquireResult, FrameSource, OutputDescription } from './duplication';

export class Stage implements FrameSource {
  readonly description: OutputDescription;
  readonly open = true;
  #dirty = true;
  readonly #painter: Painter;
  readonly #scenario: string;
  readonly #target: TextureResult;
  #time = 0;

  constructor(width: number, height: number, scenario: string) {
    this.description = { height, index: 0, left: 0, monitor: 0n, name: 'Stage', rotation: 1, top: 0, width };
    this.#scenario = scenario;
    this.#target = makeTexture({ format: DXGI_FORMAT_B8G8R8A8_UNORM, h: height, rtv: true, srv: true, w: width });
    this.#painter = new Painter(requireGpu().device);
    this.#render();
  }

  acquire(): AcquireResult {
    if (!this.#dirty) return { status: 'idle' };
    this.#dirty = false;
    return { imageUpdated: true, pointerMoved: false, pointerVisible: false, pointerX: -1, pointerY: -1, protectedContent: false, status: 'frame', texture: this.#target.tex };
  }

  advance(milliseconds: number): void {
    this.#time += milliseconds;
    this.#render();
    this.#dirty = true;
  }

  close(): void {
    this.#painter.dispose();
    comRelease(this.#target.tex);
  }

  release(): void {}

  reopen(): boolean {
    return true;
  }

  #render(): void {
    const { height, width } = this.description;
    const painter = this.#painter;
    painter.begin(this.#target.tex, 96);
    painter.clear([0.11, 0.13, 0.18, 1]);
    painter.fillRoundedRectangle(80, 80, width * 0.45, height * 0.6, 8, [0.96, 0.96, 0.97, 1]);
    painter.text(`${this.#scenario} · ${(this.#time / 1_000).toFixed(1)} s`, { family: 'Segoe UI Variable Display', size: 40, weight: 600 }, 120, 120, width * 0.4, 60, [0.1, 0.1, 0.12, 1]);
    painter.end();
  }
}
