/** Sub-cell packing mode: how many pixels one character cell represents, and how. */
export type TermMode = 'ascii' | 'braille' | 'half' | 'quad' | 'sextant';

/** Frame-diff strategy: how the renderer decides which cells to re-emit. */
export type TermDiff = 'exact' | 'none' | 'threshold';

/** Colour depth of the emitted escape sequences. Fewer bits means far fewer bytes per frame. */
export type TermDepth = '16' | '256' | 'truecolor';

/** A 24-bit colour as a red/green/blue triple, each channel 0..255. */
export type RGB = readonly [number, number, number];

/** Pointer state maintained by the app loop. Coordinates are pixels on `Term`, cells on `CharTerm`. */
export interface MouseState {
  /** Whether any mouse event has been seen this session. */
  active: boolean;
  /** Whether the primary button is held. */
  down: boolean;
  /** Whether the pointer is within the surface. */
  inside: boolean;
  /** Increments on every mouse event — compare across frames to detect movement or idle. */
  sequence: number;
  /** Accumulated wheel ticks (+ up / − down); the consumer may read and reset it. */
  wheel: number;
  x: number;
  y: number;
}

/** Renderer configuration for a pixel surface. */
export interface TermOptions {
  depth?: TermDepth;
  diff?: TermDiff;
  mode?: TermMode;
  /** With `diff: 'threshold'`, the maximum per-channel drift (0..255) a cell may accumulate before it is repainted. */
  threshold?: number;
}
