/**
 * Paint resolution for the vertex stream
 *
 * Colors become packed, pre-multiplied RGBA words (little-endian bytes R, G, B, A) that are written to vertices
 * as-is. Pre-multiplied storage keeps gradient interpolation free of dark fringes and matches the blend function.
 */

import type { Color, GradientKind, GradientStop } from './types';

import { color as bunColor } from 'bun';

/** Parsed CSS strings keyed by input; cleared at the ceiling so per-frame dynamic strings cannot grow it forever */
const COLORS = new Map<string, number>();
const COLORS_LIMIT = 4_096;

/**
 * Color ramp shared by any number of shapes. Create once, reuse every frame.
 *
 * Offsets follow CSS: bare colors spread evenly, the first defaults to 0 and the last to 1, positions never decrease.
 * Stops interpolate in pre-multiplied space, so fading to transparent never darkens.
 *
 * @example
 * ```ts
 * const sunset = new Gradient('linear', ['#ff7e5f', [0.6, '#feb47b'], '#ffffff00'], 90);
 * overlay.rectangle(20, 20, 240, 32, { fill: sunset, radius: 8 });
 * ```
 */
export class Gradient {
  /** Direction in radians (linear): 0 points up, π/2 right - CSS `linear-gradient` convention */
  public readonly angle: number;
  /** Pre-multiplied stop channels r, g, b, a in [0, 255] */
  public readonly channels: Float64Array;
  public readonly kind: GradientKind;
  /** Ascending stop offsets */
  public readonly offsets: Float64Array;
  /** True when one ramp spans [0, 1]: per-vertex interpolation is exact without splitting geometry */
  public readonly simple: boolean;

  constructor(kind: GradientKind, stops: readonly GradientStop[], angle = 180) {
    const count = stops.length;

    if (count === 0) {
      throw new Error('Gradient needs at least one stop');
    }

    const size = max(count, 2);
    const colors = new Array<Color>(size);
    const offsets = new Float64Array(size).fill(NaN);

    for (let i = 0; i < count; i++) {
      const stop = stops[i];

      if (typeof stop === 'object' && (stop as readonly unknown[]).length === 2) {
        const [offset, color] = stop as readonly [number, Color];

        colors[i] = color;
        offsets[i] = offset;
      } else {
        colors[i] = stop as Color;
      }
    }

    if (count === 1) {
      colors[1] = colors[0];
      offsets[1] = NaN;
    }

    // CSS stop fix-up: default ends, clamp to non-decreasing, spread unpositioned stops between neighbors
    if (Number.isNaN(offsets[0])) {
      offsets[0] = 0;
    }

    if (Number.isNaN(offsets[size - 1])) {
      offsets[size - 1] = max(1, offsets[0]);
    }

    for (let i = 1, previous = offsets[0]; i < size; i++) {
      if (!Number.isNaN(offsets[i])) {
        previous = offsets[i] = max(offsets[i], previous);
      }
    }

    for (let i = 1; i < size - 1; i++) {
      if (Number.isNaN(offsets[i])) {
        let next = i + 1;

        while (Number.isNaN(offsets[next])) {
          next++;
        }

        const from = offsets[i - 1];
        const step = (offsets[next] - from) / (next - i + 1);

        for (let j = i; j < next; j++) {
          offsets[j] = from + step * (j - i + 1);
        }

        i = next;
      }
    }

    const channels = new Float64Array(size << 2);

    for (let i = 0, j = 0; i < size; i++, j += 4) {
      const packed = packColor(colors[i]);

      channels[j] = packed & 0xff;
      channels[j + 1] = (packed >>> 8) & 0xff;
      channels[j + 2] = (packed >>> 16) & 0xff;
      channels[j + 3] = packed >>> 24;
    }

    this.angle = (angle * PI) / 180;
    this.channels = channels;
    this.kind = kind;
    this.offsets = offsets;
    this.simple = size === 2 && offsets[0] <= 0 && offsets[1] >= 1;
  }

  /** Interpolates stop `index` toward stop `index + 1` by `weight` and packs the result */
  #mix(index: number, weight: number, alpha: number): number {
    const { channels } = this;
    const j = index << 2;

    const a = (channels[j + 3] + (channels[j + 7] - channels[j + 3]) * weight) * alpha;
    const b = (channels[j + 2] + (channels[j + 6] - channels[j + 2]) * weight) * alpha;
    const g = (channels[j + 1] + (channels[j + 5] - channels[j + 1]) * weight) * alpha;
    const r = (channels[j] + (channels[j + 4] - channels[j]) * weight) * alpha;

    return (((a + 0.5) << 24) | (((b + 0.5) | 0) << 16) | (((g + 0.5) | 0) << 8) | ((r + 0.5) | 0)) >>> 0;
  }

  /**
   * Packed color at ramp position `t`, scaled by `alpha`.
   * @example
   * ```ts
   * new Gradient('linear', ['#000', '#fff']).at(0.5, 1); // mid gray
   * ```
   */
  public at(t: number, alpha: number): number {
    const { offsets } = this;
    const last = offsets.length - 1;

    let index = 0;
    let weight = 0;

    if (t >= offsets[last]) {
      index = last - 1;
      weight = 1;
    } else if (t > offsets[0]) {
      while (offsets[index + 1] < t) {
        index++;
      }

      const span = offsets[index + 1] - offsets[index];

      weight = span > 0 ? (t - offsets[index]) / span : 1;
    }

    return this.#mix(index, weight, alpha);
  }

  /**
   * Packed color at `t` within ramp segment `band` (0: before the first stop, `offsets.length`: after the last).
   * Unlike at(), a position on a hard stop resolves to the side of the requested segment.
   * @example
   * ```ts
   * new Gradient('linear', [[0.5, '#f00'], [0.5, '#00f']]).band(0.5, 0, 1); // red
   * ```
   */
  public band(t: number, band: number, alpha: number): number {
    const { offsets } = this;

    if (band === 0) {
      return this.#mix(0, 0, alpha);
    }

    if (band >= offsets.length) {
      return this.#mix(offsets.length - 2, 1, alpha);
    }

    const from = offsets[band - 1];
    const span = offsets[band] - from;

    return this.#mix(band - 1, span > 0 ? min(1, max(0, (t - from) / span)) : 1, alpha);
  }

  /**
   * Packed color of stop `index`, scaled by `alpha`.
   * @example
   * ```ts
   * new Gradient('radial', ['#fff', '#000']).stop(1, 1); // black
   * ```
   */
  public stop(index: number, alpha: number): number {
    return index === 0 ? this.#mix(0, 0, alpha) : this.#mix(index - 1, 1, alpha);
  }
}

const { PI, max, min } = Math;

/**
 * Scales a packed pre-multiplied color by `alpha` in [0, 1].
 * @example
 * ```ts
 * fadeColor(packColor('#ffffff'), 0.5); // 50% white
 * ```
 */
export function fadeColor(color: number, alpha: number): number {
  if (alpha >= 1) {
    return color;
  }

  if (alpha <= 0) {
    return 0;
  }

  // Round to nearest: channel * scale / 256 with +128 before the shift
  const scale = (alpha * 256 + 0.5) | 0;

  return (((((color >>> 24) * scale + 128) >>> 8) << 24) | (((((color >>> 16) & 0xff) * scale + 128) >>> 8) << 16) | (((((color >>> 8) & 0xff) * scale + 128) >>> 8) << 8) | (((color & 0xff) * scale + 128) >>> 8)) >>> 0;
}

/**
 * Packs a color into a pre-multiplied RGBA word.
 * @example
 * ```ts
 * packColor('#ff000080') === packColor(0xff000080); // true
 * ```
 */
export function packColor(color: Color): number {
  let a: number, b: number, g: number, r: number;
  let cache = false;

  if (typeof color === 'number') {
    a = color & 0xff;
    b = (color >>> 8) & 0xff;
    g = (color >>> 16) & 0xff;
    r = color >>> 24;
  } else if (typeof color === 'string') {
    const cached = COLORS.get(color);

    if (cached !== undefined) {
      return cached;
    }

    const parsed = bunColor(color, '[rgba]');

    if (parsed === null) {
      throw new Error(`Invalid color: ${color}`);
    }

    [r, g, b, a] = parsed;
    cache = true;
  } else {
    a = (color.a * 0xff + 0.5) | 0;
    b = (color.b * 0xff + 0.5) | 0;
    g = (color.g * 0xff + 0.5) | 0;
    r = (color.r * 0xff + 0.5) | 0;
  }

  // round(channel * a / 255) without division: ((x + 128) * 257) >>> 16 is exact for x in [0, 65025]
  const packed = ((a << 24) | ((((b * a + 128) * 257) >>> 16) << 16) | ((((g * a + 128) * 257) >>> 16) << 8) | (((r * a + 128) * 257) >>> 16)) >>> 0;

  if (cache) {
    if (COLORS.size === COLORS_LIMIT) {
      COLORS.clear();
    }

    COLORS.set(color as string, packed);
  }

  return packed;
}
