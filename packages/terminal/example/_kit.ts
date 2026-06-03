// Scene-math helpers shared by the example demos. These are general graphics /
// PRNG utilities (not terminal-domain), relocated out of the rendering engine.
// Public names match what the demos call.

const { PI, floor, imul } = Math;

export const TAU = PI * 2;

/** Clamp `value` to `[low, high]`. */
export const clamp = (value: number, low: number, high: number): number => (value < low ? low : value > high ? high : value);

/** Clamp `value` to `[0, 1]`. */
export const clamp01 = (value: number): number => (value < 0 ? 0 : value > 1 ? 1 : value);

/** Linear interpolation from `a` to `b` by `t`. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Hermite smoothstep between `edge0` and `edge1`. */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-9));
  return t * t * (3 - 2 * t);
};

/** Fractional part of `value`. */
export const fract = (value: number): number => value - floor(value);

/** ACES filmic tonemap of a single linear channel (0..∞) → 0..1. */
export const aces = (value: number): number => {
  const a = 2.51;
  const b = 0.03;
  const c = 2.43;
  const d = 0.59;
  const e = 0.14;
  return clamp01((value * (a * value + b)) / (value * (c * value + d) + e));
};

/** HSV (hue in turns 0..1, saturation/value in 0..1) → packed [red, green, blue] 0..255. */
export const hsv = (hue: number, saturation: number, value: number): [number, number, number] => {
  const sector6 = fract(hue) * 6;
  const sector = floor(sector6);
  const fraction = sector6 - sector;
  const dimmest = value * (1 - saturation);
  const falling = value * (1 - saturation * fraction);
  const rising = value * (1 - saturation * (1 - fraction));
  let red: number;
  let green: number;
  let blue: number;
  switch (sector % 6) {
    case 0:
      red = value;
      green = rising;
      blue = dimmest;
      break;
    case 1:
      red = falling;
      green = value;
      blue = dimmest;
      break;
    case 2:
      red = dimmest;
      green = value;
      blue = rising;
      break;
    case 3:
      red = dimmest;
      green = falling;
      blue = value;
      break;
    case 4:
      red = rising;
      green = dimmest;
      blue = value;
      break;
    default:
      red = value;
      green = dimmest;
      blue = falling;
      break;
  }
  return [(red * 255) | 0, (green * 255) | 0, (blue * 255) | 0];
};

/** Deterministic 0..1 PRNG (mulberry32). */
export const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let mixed = imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

/** Cheap 2D integer hash → 0..1. */
export const hash2 = (x: number, y: number): number => {
  let hash = imul(x | 0, 374761393) ^ imul(y | 0, 668265263);
  hash = imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
};
