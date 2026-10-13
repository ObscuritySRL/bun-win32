// The journal: one record per captured frame (when, how much changed, where the pointer was) and
// one *tape* per screen tile — (frame, blob) pairs in time order. What a tile showed at frame f is
// a binary search on its tape, so any moment is reconstructible in O(tiles · log changes) and the
// next moment only touches tiles whose blob differs. Frame indices are absolute and never reused.

import type { Gap, TimelineSlice } from '../shared/protocol';

const initialFrames = 0x1000;
const initialTape = 0x10;

export class Journal {
  readonly tileCount: number;
  #changed = new Uint32Array(initialFrames);
  #cursorX = new Int32Array(initialFrames);
  #cursorY = new Int32Array(initialFrames);
  #epochs = new Float64Array(initialFrames);
  #firstFrame = 0;
  #frameCount = 0;
  #frameOffset = 0;
  #gaps: Gap[] = [];
  readonly #tapeBlobs: Uint32Array[] = [];
  #tapeEntries = 0;
  readonly #tapeFrames: Uint32Array[] = [];
  readonly #tapeLength: Uint32Array;
  readonly #tapeStart: Uint32Array;

  constructor(tileCount: number) {
    this.tileCount = tileCount;
    this.#tapeLength = new Uint32Array(tileCount);
    this.#tapeStart = new Uint32Array(tileCount);
    for (let tile = 0; tile < tileCount; tile += 1) {
      this.#tapeBlobs.push(new Uint32Array(initialTape));
      this.#tapeFrames.push(new Uint32Array(initialTape));
    }
  }

  /** Bookkeeping bytes (frames + tape entries), counted against the memory budget alongside blobs. */
  get bytes(): number {
    return this.#epochs.length * 20 + this.#tapeEntries * 8;
  }

  get firstFrame(): number {
    return this.#firstFrame;
  }

  get frameCount(): number {
    return this.#frameCount;
  }

  get gaps(): readonly Gap[] {
    return this.#gaps;
  }

  /** Absolute index of the newest frame, or -1 when empty. */
  get lastFrame(): number {
    return this.#firstFrame + this.#frameCount - 1;
  }

  appendFrame(epoch: number, changed: number, cursorX: number, cursorY: number): number {
    if (this.#frameOffset + this.#frameCount === this.#epochs.length) this.#growFrames();
    const slot = this.#frameOffset + this.#frameCount;
    this.#epochs[slot] = epoch;
    this.#changed[slot] = changed;
    this.#cursorX[slot] = cursorX;
    this.#cursorY[slot] = cursorY;
    this.#frameCount += 1;
    return this.lastFrame;
  }

  changed(frame: number): number {
    return this.#changed[this.#slot(frame)]!;
  }

  /** Keep `frame` inside what the journal still holds. */
  clamp(frame: number): number {
    return Math.min(this.lastFrame, Math.max(this.#firstFrame, frame));
  }

  /** Forget everything; tape blobs are released through `release`. */
  clear(release: (blob: number) => void): void {
    for (let tile = 0; tile < this.tileCount; tile += 1) {
      const start = this.#tapeStart[tile]!;
      const blobs = this.#tapeBlobs[tile]!;
      for (let entry = start; entry < start + this.#tapeLength[tile]!; entry += 1) release(blobs[entry]!);
      this.#tapeStart[tile] = 0;
      this.#tapeLength[tile] = 0;
    }
    this.#tapeEntries = 0;
    this.#firstFrame += this.#frameCount;
    this.#frameCount = 0;
    this.#frameOffset = 0;
    this.#gaps = [];
  }

  cursor(frame: number): [number, number] {
    const slot = this.#slot(frame);
    return [this.#cursorX[slot]!, this.#cursorY[slot]!];
  }

  epoch(frame: number): number {
    return this.#epochs[this.#slot(frame)]!;
  }

  /**
   * Drop frames before `floor`. Each tile keeps its last entry at or before `floor` as the base
   * state, so `seek(floor)` still reconstructs the full screen; everything older is released.
   */
  evictBefore(floor: number, release: (blob: number) => void): void {
    const target = Math.min(floor, this.lastFrame);
    if (target <= this.#firstFrame) return;
    for (let tile = 0; tile < this.tileCount; tile += 1) {
      const start = this.#tapeStart[tile]!;
      const length = this.#tapeLength[tile]!;
      const frames = this.#tapeFrames[tile]!;
      let keep = start;
      while (keep + 1 < start + length && frames[keep + 1]! <= target) keep += 1;
      if (length === 0 || frames[start]! > target) continue;
      const blobs = this.#tapeBlobs[tile]!;
      for (let entry = start; entry < keep; entry += 1) release(blobs[entry]!);
      this.#tapeStart[tile] = keep;
      this.#tapeLength[tile] = length - (keep - start);
      this.#tapeEntries -= keep - start;
    }
    const dropped = target - this.#firstFrame;
    this.#frameOffset += dropped;
    this.#frameCount -= dropped;
    this.#firstFrame = target;
    const oldestEpoch = this.epoch(target);
    this.#gaps = this.#gaps.filter((gap) => gap.to >= oldestEpoch);
    if (this.#frameOffset > this.#epochs.length / 2) this.#compactFrames();
  }

  markGap(gap: Gap): void {
    this.#gaps.push(gap);
  }

  /** Record that `tile` became blob `blob` at `frame` (the caller has retained the blob). */
  record(tile: number, frame: number, blob: number): void {
    let start = this.#tapeStart[tile]!;
    const length = this.#tapeLength[tile]!;
    if (start + length === this.#tapeFrames[tile]!.length) {
      start = this.#growTape(tile);
    }
    this.#tapeFrames[tile]![start + length] = frame;
    this.#tapeBlobs[tile]![start + length] = blob;
    this.#tapeLength[tile] = length + 1;
    this.#tapeEntries += 1;
  }

  /** Fill `out[tile]` with the blob each tile showed at `frame` (-1 if it had none yet). */
  seek(frame: number, out: Int32Array): void {
    for (let tile = 0; tile < this.tileCount; tile += 1) {
      const entry = this.#latestAtOrBefore(tile, frame);
      out[tile] = entry < 0 ? -1 : this.#tapeBlobs[tile]![entry]!;
    }
  }

  /** Correct the changed-tile count once a frame's tiles are known (the frame is appended first). */
  setChanged(frame: number, changed: number): void {
    this.#changed[this.#slot(frame)] = changed;
  }

  /** Copy of the timeline from `fromFrame` (clamped) to the newest frame. */
  slice(fromFrame: number): TimelineSlice {
    const first = Math.max(this.#firstFrame, fromFrame);
    const begin = this.#frameOffset + (first - this.#firstFrame);
    const end = this.#frameOffset + this.#frameCount;
    return {
      changed: this.#changed.slice(begin, Math.max(begin, end)),
      cursorX: this.#cursorX.slice(begin, Math.max(begin, end)),
      cursorY: this.#cursorY.slice(begin, Math.max(begin, end)),
      epochs: this.#epochs.slice(begin, Math.max(begin, end)),
      firstFrame: first,
      gaps: this.#gaps.map((gap) => ({ ...gap })),
    };
  }

  /**
   * Step through the history of `tiles` only. Back: to the frame where the region's previous state
   * began. Forward: to the region's next change. Clamped to the oldest frame / now.
   */
  stepRegion(frame: number, direction: -1 | 1, tiles: readonly number[]): number {
    if (direction > 0) {
      let next = Infinity;
      for (const tile of tiles) {
        const start = this.#tapeStart[tile]!;
        const latest = this.#latestAtOrBefore(tile, frame);
        const entry = latest < 0 ? start : latest + 1;
        if (entry < start + this.#tapeLength[tile]!) next = Math.min(next, this.#tapeFrames[tile]![entry]!);
      }
      return next === Infinity ? this.lastFrame : this.clamp(next);
    }
    let current = -1;
    for (const tile of tiles) {
      const entry = this.#latestAtOrBefore(tile, frame);
      if (entry >= 0) current = Math.max(current, this.#tapeFrames[tile]![entry]!);
    }
    if (current <= this.#firstFrame) return this.#firstFrame;
    let previous = -1;
    for (const tile of tiles) {
      const entry = this.#latestAtOrBefore(tile, current - 1);
      if (entry >= 0) previous = Math.max(previous, this.#tapeFrames[tile]![entry]!);
    }
    return this.clamp(previous);
  }

  #compactFrames(): void {
    const end = this.#frameOffset + this.#frameCount;
    this.#epochs.copyWithin(0, this.#frameOffset, end);
    this.#changed.copyWithin(0, this.#frameOffset, end);
    this.#cursorX.copyWithin(0, this.#frameOffset, end);
    this.#cursorY.copyWithin(0, this.#frameOffset, end);
    this.#frameOffset = 0;
  }

  #growFrames(): void {
    if (this.#frameOffset > 0) {
      this.#compactFrames();
      if (this.#frameCount < this.#epochs.length) return;
    }
    const capacity = this.#epochs.length * 2;
    const epochs = new Float64Array(capacity);
    epochs.set(this.#epochs);
    this.#epochs = epochs;
    const changed = new Uint32Array(capacity);
    changed.set(this.#changed);
    this.#changed = changed;
    const cursorX = new Int32Array(capacity);
    cursorX.set(this.#cursorX);
    this.#cursorX = cursorX;
    const cursorY = new Int32Array(capacity);
    cursorY.set(this.#cursorY);
    this.#cursorY = cursorY;
  }

  /** Make room at the end of a tape: slide it to the front if eviction freed space, else double it. */
  #growTape(tile: number): number {
    const start = this.#tapeStart[tile]!;
    const length = this.#tapeLength[tile]!;
    const frames = this.#tapeFrames[tile]!;
    const blobs = this.#tapeBlobs[tile]!;
    if (start > frames.length / 2) {
      frames.copyWithin(0, start, start + length);
      blobs.copyWithin(0, start, start + length);
    } else {
      const grownFrames = new Uint32Array(frames.length * 2);
      grownFrames.set(frames.subarray(start, start + length));
      this.#tapeFrames[tile] = grownFrames;
      const grownBlobs = new Uint32Array(blobs.length * 2);
      grownBlobs.set(blobs.subarray(start, start + length));
      this.#tapeBlobs[tile] = grownBlobs;
    }
    this.#tapeStart[tile] = 0;
    return 0;
  }

  /** Index into the tile's tape arrays of its latest entry at or before `frame`, or -1. */
  #latestAtOrBefore(tile: number, frame: number): number {
    const start = this.#tapeStart[tile]!;
    const length = this.#tapeLength[tile]!;
    const frames = this.#tapeFrames[tile]!;
    if (length === 0 || frames[start]! > frame) return -1;
    let low = start;
    let high = start + length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (frames[middle]! <= frame) low = middle;
      else high = middle - 1;
    }
    return low;
  }

  #slot(frame: number): number {
    return this.#frameOffset + (frame - this.#firstFrame);
  }
}
