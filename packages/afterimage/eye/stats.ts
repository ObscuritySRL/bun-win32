// Honest frame timing: wall-clock intervals between consecutive presents while the overlay is
// animating. Idle stretches (no frame drawn because nothing moved) are not intervals and are not
// counted. Reports the worst case and the median over a rolling window.

const idleThreshold = 100;
const window = 0x200;

export class FrameMeter {
  #count = 0;
  readonly #intervals = new Float64Array(window);
  #last = -Infinity;
  #next = 0;
  #worstEver = 0;

  get median(): number {
    if (this.#count === 0) return 0;
    const sorted = this.#intervals.slice(0, this.#count).sort();
    return sorted[sorted.length >> 1]!;
  }

  /** Worst interval in the rolling window. */
  get worst(): number {
    let worst = 0;
    for (let index = 0; index < this.#count; index += 1) worst = Math.max(worst, this.#intervals[index]!);
    return worst;
  }

  /** Worst interval since the meter was created (for logs and the README). */
  get worstEver(): number {
    return this.#worstEver;
  }

  /** A frame was presented at `now`. */
  presented(now: number): void {
    const interval = now - this.#last;
    this.#last = now;
    if (interval > idleThreshold) return;
    this.#intervals[this.#next] = interval;
    this.#next = (this.#next + 1) % window;
    this.#count = Math.min(window, this.#count + 1);
    this.#worstEver = Math.max(this.#worstEver, interval);
  }

  /** Forget the interval in progress (the loop is about to idle or close). */
  rest(): void {
    this.#last = -Infinity;
  }
}
