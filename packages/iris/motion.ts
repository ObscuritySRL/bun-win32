// Damped springs solved in closed form, so a step is exact for any frame time: a 4 ms frame on a 240 Hz panel and a
// 50 ms hitch land on the same curve. Every animated quantity in Iris is one of these — there are no tweens, timelines,
// or easing tables, which is why interrupted motion (retargeting mid-flight) never jerks.

export interface SpringConfig {
  /** Damping ratio: 1 is critical (fastest settle without overshoot), below 1 overshoots. */
  damping: number;
  /** Angular frequency in radians per second. */
  frequency: number;
}

export const SNAPPY: SpringConfig = { damping: 0.86, frequency: 22 };
export const SMOOTH: SpringConfig = { damping: 1, frequency: 16 };
export const GENTLE: SpringConfig = { damping: 1, frequency: 9 };
export const BOUNCY: SpringConfig = { damping: 0.62, frequency: 18 };

export class Spring {
  config: SpringConfig;
  target: number;
  value: number;
  velocity = 0;

  constructor(value: number, config: SpringConfig = SMOOTH) {
    this.value = value;
    this.target = value;
    this.config = config;
  }

  /** Jump to `value` with no motion. */
  snap(value: number): void {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }

  get settled(): boolean {
    return Math.abs(this.value - this.target) < 0.001 && Math.abs(this.velocity) < 0.01;
  }

  step(seconds: number): number {
    const offset = this.value - this.target;
    if (offset === 0 && this.velocity === 0) return this.value;
    const { damping, frequency } = this.config;
    const velocity = this.velocity;
    if (damping >= 1) {
      const decay = Math.exp(-frequency * seconds);
      const term = velocity + frequency * offset;
      this.value = this.target + (offset + term * seconds) * decay;
      this.velocity = (velocity - frequency * term * seconds) * decay;
    } else {
      const decayRate = damping * frequency;
      const dampedFrequency = frequency * Math.sqrt(1 - damping * damping);
      const decay = Math.exp(-decayRate * seconds);
      const cosine = Math.cos(dampedFrequency * seconds);
      const sine = Math.sin(dampedFrequency * seconds);
      const second = (velocity + decayRate * offset) / dampedFrequency;
      this.value = this.target + decay * (offset * cosine + second * sine);
      this.velocity = decay * ((dampedFrequency * second - decayRate * offset) * cosine - (decayRate * second + dampedFrequency * offset) * sine);
    }
    if (Math.abs(this.value - this.target) < 1e-4 && Math.abs(this.velocity) < 1e-3) {
      this.value = this.target;
      this.velocity = 0;
    }
    return this.value;
  }
}

/** The animated placement of one card: position in world pixels, tilt, turn, scale, and opacity. */
export class Placement {
  readonly opacity: Spring;
  readonly rotationX: Spring;
  readonly rotationY: Spring;
  readonly scale: Spring;
  readonly x: Spring;
  readonly y: Spring;
  readonly z: Spring;

  constructor(x: number, y: number, config: SpringConfig = SMOOTH) {
    this.x = new Spring(x, config);
    this.y = new Spring(y, config);
    this.z = new Spring(0, config);
    this.rotationX = new Spring(0, config);
    this.rotationY = new Spring(0, config);
    this.scale = new Spring(1, config);
    this.opacity = new Spring(1, SMOOTH);
  }

  set(target: PlacementTarget): void {
    this.x.target = target.x;
    this.y.target = target.y;
    this.z.target = target.z;
    this.rotationX.target = target.rotationX;
    this.rotationY.target = target.rotationY;
    this.scale.target = target.scale;
    this.opacity.target = target.opacity;
  }

  snap(target: PlacementTarget): void {
    this.x.snap(target.x);
    this.y.snap(target.y);
    this.z.snap(target.z);
    this.rotationX.snap(target.rotationX);
    this.rotationY.snap(target.rotationY);
    this.scale.snap(target.scale);
    this.opacity.snap(target.opacity);
  }

  /** The current values as a target (used to freeze a card where it is). */
  snapshot(): PlacementTarget {
    return { opacity: this.opacity.value, rotationX: this.rotationX.value, rotationY: this.rotationY.value, scale: this.scale.value, x: this.x.value, y: this.y.value, z: this.z.value };
  }

  configure(config: SpringConfig): void {
    this.x.config = config;
    this.y.config = config;
    this.z.config = config;
    this.rotationX.config = config;
    this.rotationY.config = config;
    this.scale.config = config;
  }

  step(seconds: number): void {
    this.x.step(seconds);
    this.y.step(seconds);
    this.z.step(seconds);
    this.rotationX.step(seconds);
    this.rotationY.step(seconds);
    this.scale.step(seconds);
    this.opacity.step(seconds);
  }

  get settled(): boolean {
    return this.x.settled && this.y.settled && this.z.settled && this.rotationX.settled && this.rotationY.settled && this.scale.settled && this.opacity.settled;
  }
}

export interface PlacementTarget {
  opacity: number;
  rotationX: number;
  rotationY: number;
  scale: number;
  x: number;
  y: number;
  z: number;
}
