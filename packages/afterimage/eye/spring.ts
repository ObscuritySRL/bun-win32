// Closed-form damped harmonic oscillators — the only way anything in Afterimage moves.
// Position and velocity are evaluated analytically from (origin, velocity, target, start), so a
// frame hitch never accumulates error and an interruption retargets from the exact current state.

export interface SpringCharacter {
  /** ζ — 1 is critically damped (fastest without overshoot); below 1 overshoots. */
  damping: number;
  /** ω — undamped angular frequency in rad/s. */
  frequency: number;
}

/** The motion vocabulary from DESIGN.md §3. */
export const Characters = {
  breath: { damping: 1, frequency: 42 },
  exhale: { damping: 0.86, frequency: 17 },
  fade: { damping: 1, frequency: 20 },
  glide: { damping: 1, frequency: 30 },
  rise: { damping: 0.74, frequency: 15 },
} as const satisfies Record<string, SpringCharacter>;

export class Spring {
  readonly #character: SpringCharacter;
  #origin: number;
  #start: number;
  #target: number;
  #velocity: number;

  constructor(character: SpringCharacter, value: number, now: number) {
    this.#character = character;
    this.#origin = value;
    this.#start = now;
    this.#target = value;
    this.#velocity = 0;
  }

  get target(): number {
    return this.#target;
  }

  /** Move toward `target`, continuing from wherever the spring is at `now` (position and velocity). */
  retarget(target: number, now: number): void {
    if (target === this.#target) return;
    const value = this.value(now);
    const velocity = this.velocity(now);
    this.#origin = value;
    this.#velocity = velocity;
    this.#start = now;
    this.#target = target;
  }

  /** Jump to `value` at rest — for frame 0, where continuity means "exactly what was there". */
  set(value: number, now: number): void {
    this.#origin = value;
    this.#velocity = 0;
    this.#start = now;
    this.#target = value;
  }

  settled(now: number, tolerance = 0.000_5): boolean {
    return Math.abs(this.value(now) - this.#target) <= tolerance && Math.abs(this.velocity(now)) <= tolerance * 10;
  }

  value(now: number): number {
    return this.#target + this.#displacement(now, false);
  }

  /** Units per second. */
  velocity(now: number): number {
    return this.#displacement(now, true);
  }

  #displacement(now: number, derivative: boolean): number {
    const elapsed = Math.max(0, now - this.#start) / 1_000;
    const displacement = this.#origin - this.#target;
    if (displacement === 0 && this.#velocity === 0) return 0;
    const { damping, frequency } = this.#character;
    const decay = Math.exp(-damping * frequency * elapsed);
    if (damping >= 1) {
      const slope = this.#velocity + frequency * displacement;
      if (derivative) return decay * (this.#velocity - frequency * slope * elapsed);
      return decay * (displacement + slope * elapsed);
    }
    const dampedFrequency = frequency * Math.sqrt(1 - damping * damping);
    const sineWeight = (this.#velocity + damping * frequency * displacement) / dampedFrequency;
    const cosine = Math.cos(dampedFrequency * elapsed);
    const sine = Math.sin(dampedFrequency * elapsed);
    if (derivative) return decay * (-damping * frequency * (displacement * cosine + sineWeight * sine) + dampedFrequency * (sineWeight * cosine - displacement * sine));
    return decay * (displacement * cosine + sineWeight * sine);
  }
}
