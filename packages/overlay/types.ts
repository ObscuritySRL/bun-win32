/**
 * Core types for bun-overlay
 * All types are designed for minimal overhead and ease of use
 */

import type { Gradient } from './paint';

/**
 * Color input
 * - `number`: `0xRRGGBBAA` - fastest, no parsing or lookup (same digit order as `'#rrggbbaa'`)
 * - `string`: any CSS color `Bun.color` understands - parsed once, then cached
 * - `RGBA`: normalized floats
 */
export type Color = RGBA | number | string;

/** How a gradient maps onto a shape */
export type GradientKind =
  /** Along `angle` across the shape's bounds (CSS `linear-gradient`) */
  | 'linear'
  /** From the center of the shape's bounds out to its edges (CSS `radial-gradient(closest-side)`) */
  | 'radial'
  /** From the first point of a stroke to its last - trails, tethers, fading paths */
  | 'stroke';

/** Gradient stop: a bare color (spread evenly) or an `[offset, color]` pair with offset in [0, 1] */
export type GradientStop = Color | readonly [offset: number, color: Color];

/** Image packed into the overlay's texture atlas (see `Overlay.createImage`) */
export interface Image {
  readonly height: number;
  /** Atlas texel column of the top-left pixel */
  readonly u: number;
  /** Atlas texel row of the top-left pixel */
  readonly v: number;
  readonly width: number;
}

/** Stroke end style */
export type LineCap = 'butt' | 'round' | 'square';

/** Overlay creation configuration */
export interface OverlayConfig {
  /** Feather edges with a 1px coverage ring (default: true, false in colorkey mode) */
  readonly antialias?: boolean;
  /** Color key for colorkey mode (default: '#ff00ff' magenta) */
  readonly colorKey?: string;
  /** Overlay height in pixels */
  readonly height: number;
  /**
   * Rendering mode (default: 'alpha')
   * - 'alpha': Per-pixel alpha blending via UpdateLayeredWindowIndirect with a dirty rectangle
   * - 'colorkey': Color key transparency, no pixel copy
   * - 'opaque': No transparency, fastest via SwapBuffers
   */
  readonly mode?: RenderMode;
  /** Window title (optional) */
  readonly title?: string;
  /** Wait for vertical blank in SwapBuffers - colorkey/opaque only (default: false) */
  readonly verticalSync?: boolean;
  /** Overlay width in pixels */
  readonly width: number;
  /** X position (centered if omitted) */
  readonly x?: number;
  /** Y position (centered if omitted) */
  readonly y?: number;
}

/** Anything that can fill or stroke a shape */
export type Paint = Color | Gradient;

/** 2D point for screen-space drawing */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/** 3D point for world-space drawing */
export interface Point3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** 2D points: objects, or flat `[x0, y0, x1, y1, ...]` numbers (fastest - pass a reused `Float32Array`) */
export type Points2D = ArrayLike<number> | readonly Point2D[];

/** 3D points: objects, or flat `[x0, y0, z0, x1, y1, z1, ...]` numbers */
export type Points3D = ArrayLike<number> | readonly Point3D[];

/** RGBA color - normalized floats [0, 1] */
export interface RGBA {
  readonly a: number;
  readonly b: number;
  readonly g: number;
  readonly r: number;
}

/** Rendering mode for the overlay */
export type RenderMode =
  /** Per-pixel alpha blending (best quality; only the changed region is read back) */
  | 'alpha'
  /** Color key transparency (faster, solid colors only) */
  | 'colorkey'
  /** Opaque window with SwapBuffers (fastest, no transparency) */
  | 'opaque';

/** Soft shadow beneath a filled shape, like CSS `filter: drop-shadow()`. Zero offset + a bright color makes a glow. */
export interface Shadow {
  /** Blur radius in pixels (default: 8) */
  readonly blur?: number;
  /** Shadow color (default: '#00000080') */
  readonly color?: Color;
  /** Grow (or shrink, if negative) the shadow before blurring (default: 0) */
  readonly spread?: number;
  /** Horizontal offset (default: 0) */
  readonly x?: number;
  /** Vertical offset (default: 2) */
  readonly y?: number;
}

/**
 * Shape style. Hoist it to a constant and reuse it - resolution is allocation-free.
 * With neither `fill` nor `stroke`, the shape fills (strokes, for lines) white.
 */
export interface ShapeStyle {
  /** Stroke ends: 'butt' (default), 'round', 'square' */
  readonly cap?: LineCap;
  /** Stroke dash pattern in pixels, e.g. `[6, 4]`; `[0, 6]` with a round cap draws dots */
  readonly dash?: readonly number[];
  /** Dash phase in pixels - animate it for marching ants */
  readonly dashOffset?: number;
  /** Interior paint */
  readonly fill?: Paint;
  /** Opacity multiplier in [0, 1] (default: 1) */
  readonly opacity?: number;
  /** Corner radius for `rectangle` (default: 0) */
  readonly radius?: number;
  /** Curve segments for circles, ellipses, arcs and spheres (default: adaptive to size) */
  readonly segments?: number;
  /** Soft shadow or glow drawn beneath the fill */
  readonly shadow?: Shadow;
  /** Outline paint */
  readonly stroke?: Paint;
  /** Outline width in pixels (default: `setLineWidth`, initially 1) */
  readonly strokeWidth?: number;
}

/** Style shorthand: a bare `Paint` fills shapes and strokes lines, polylines and arcs */
export type Style = Paint | ShapeStyle;

/** Horizontal text anchor */
export type TextAlign = 'center' | 'left' | 'right';

/** Vertical text anchor */
export type TextBaseline = 'alphabetic' | 'bottom' | 'middle' | 'top';

/** Text style. Hoist it to a constant and reuse it. */
export interface TextStyle {
  /** Horizontal anchor (default: 'left') */
  readonly align?: TextAlign;
  /** Vertical anchor (default: 'alphabetic' - `y` is the baseline) */
  readonly baseline?: TextBaseline;
  /** Text paint (default: white); gradients span the text block */
  readonly color?: Paint;
  /** Font face (default: 'Arial') */
  readonly font?: string;
  /** Truncate each line with an ellipsis beyond this width */
  readonly maximumWidth?: number;
  /** Opacity multiplier in [0, 1] (default: 1) */
  readonly opacity?: number;
  /** 1px outline color - keeps labels legible over any background */
  readonly outline?: Color;
  /** Drop shadow color, offset 1px right and down */
  readonly shadow?: Color;
  /** Pixel size (default: 16) */
  readonly size?: number;
  /** Font weight, 100-900 (default: 400) */
  readonly weight?: number;
}
