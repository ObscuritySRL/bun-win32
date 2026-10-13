// The eye's copy of the timeline for the display it is looking at: when each frame was taken, how
// much changed, where the pointer was, and the gaps. It grows while the overlay is open (the worker
// streams new frames) and answers the questions scrubbing asks: which frame was showing at an
// epoch, where the moments are.

import type { Gap, TimelineSlice } from '../shared/protocol';
import { findMoments, frameAtOrBefore } from './timeline';

export class History {
  #changed = new Uint32Array(0x1000);
  #count = 0;
  #cursorX = new Int32Array(0x1000);
  #cursorY = new Int32Array(0x1000);
  #epochs = new Float64Array(0x1000);
  #firstFrame = 0;
  #gaps: Gap[] = [];
  #moments: Uint32Array | null = null;
  readonly #tileCount: number;

  constructor(tileCount: number) {
    this.#tileCount = tileCount;
  }

  get changedCounts(): Uint32Array {
    return this.#changed;
  }

  get count(): number {
    return this.#count;
  }

  get epochs(): Float64Array {
    return this.#epochs;
  }

  get firstFrame(): number {
    return this.#firstFrame;
  }

  get gaps(): readonly Gap[] {
    return this.#gaps;
  }

  /** Absolute index of the newest frame, or firstFrame - 1 when empty. */
  get lastFrame(): number {
    return this.#firstFrame + this.#count - 1;
  }

  /** Frames in which a large share of the screen changed at once (absolute indices). */
  get moments(): Uint32Array {
    if (this.#moments === null) {
      const relative = findMoments(this.#epochs, this.#changed, this.#count, this.#tileCount);
      this.#moments = relative.map((index) => index + this.#firstFrame);
    }
    return this.#moments;
  }

  append(slice: TimelineSlice): void {
    const skip = Math.max(0, this.lastFrame + 1 - slice.firstFrame);
    const added = slice.epochs.length - skip;
    if (added <= 0) return;
    this.#reserve(this.#count + added);
    this.#epochs.set(slice.epochs.subarray(skip), this.#count);
    this.#changed.set(slice.changed.subarray(skip), this.#count);
    this.#cursorX.set(slice.cursorX.subarray(skip), this.#count);
    this.#cursorY.set(slice.cursorY.subarray(skip), this.#count);
    this.#count += added;
    this.#gaps = slice.gaps;
    this.#moments = null;
  }

  clamp(frame: number): number {
    return Math.min(this.lastFrame, Math.max(this.#firstFrame, frame));
  }

  cursor(frame: number): [number, number] {
    const index = this.clamp(frame) - this.#firstFrame;
    return [this.#cursorX[index]!, this.#cursorY[index]!];
  }

  epoch(frame: number): number {
    return this.#epochs[this.clamp(frame) - this.#firstFrame]!;
  }

  /** The frame that was on screen at `epoch`. */
  frameAt(epoch: number): number {
    return this.#firstFrame + frameAtOrBefore(this.#epochs, this.#count, epoch);
  }

  replace(slice: TimelineSlice): void {
    this.#count = 0;
    this.#firstFrame = slice.firstFrame;
    this.append({ ...slice, firstFrame: slice.firstFrame });
    this.#gaps = slice.gaps;
  }

  /** Drop frames the worker no longer holds. */
  trimBefore(epoch: number): void {
    let drop = 0;
    while (drop < this.#count - 1 && this.#epochs[drop + 1]! <= epoch) drop += 1;
    if (drop === 0) return;
    this.#epochs.copyWithin(0, drop, this.#count);
    this.#changed.copyWithin(0, drop, this.#count);
    this.#cursorX.copyWithin(0, drop, this.#count);
    this.#cursorY.copyWithin(0, drop, this.#count);
    this.#count -= drop;
    this.#firstFrame += drop;
    this.#moments = null;
  }

  #reserve(capacity: number): void {
    if (capacity <= this.#epochs.length) return;
    let size = this.#epochs.length;
    while (size < capacity) size *= 2;
    const epochs = new Float64Array(size);
    epochs.set(this.#epochs.subarray(0, this.#count));
    this.#epochs = epochs;
    const changed = new Uint32Array(size);
    changed.set(this.#changed.subarray(0, this.#count));
    this.#changed = changed;
    const cursorX = new Int32Array(size);
    cursorX.set(this.#cursorX.subarray(0, this.#count));
    this.#cursorX = cursorX;
    const cursorY = new Int32Array(size);
    cursorY.set(this.#cursorY.subarray(0, this.#count));
    this.#cursorY = cursorY;
  }
}
