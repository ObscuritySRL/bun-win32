// Design tokens — DESIGN.md §3 as code. Every color, size, radius, spacing and motion in the eye
// comes from here. Sizes are DIPs; the renderer multiplies by the monitor's scale.

import type { Color, TextOptions } from '../shared/painter';
import { accentPalette } from './accent';

/** Unit 4 DIP; layout snaps to 8. */
export const space = (units: number): number => units * 4;

const accent = accentPalette();

export const palette = {
  accent: accent.base,
  accentGlow: accent.glow,
  glass: [24 / 255, 26 / 255, 32 / 255, 0.78],
  glassEdge: [1, 1, 1, 0.08],
  ink: [7 / 255, 8 / 255, 11 / 255, 1],
  now: [1, 247 / 255, 236 / 255, 1],
  textPrimary: [243 / 255, 245 / 255, 248 / 255, 1],
  textSecondary: [169 / 255, 176 / 255, 189 / 255, 1],
  textTertiary: [107 / 255, 114 / 255, 128 / 255, 1],
} as const satisfies Record<string, Color>;

export const radius = {
  card: 12,
  shelf: 16,
} as const;

/** Typefaces: Segoe UI Variable on Windows 11; Segoe UI where it is missing (Windows 10). */
export const families = {
  display: 'Segoe UI Variable Display',
  mono: 'Cascadia Mono',
  small: 'Segoe UI Variable Small',
  text: 'Segoe UI Variable Text',
} as const;

export const type = {
  body: { family: families.text, size: 14, weight: 400 },
  caption: { family: families.small, size: 12, weight: 400 },
  display: { family: families.display, size: 30, weight: 600 },
  mono: { family: families.mono, size: 12, weight: 400 },
  title: { family: families.display, size: 18, weight: 600 },
} as const satisfies Record<string, TextOptions>;

export const layout = {
  /** Height of the timeline shelf. */
  shelfHeight: 120,
  /** Gap from the screen's bottom edge to the shelf. */
  shelfMargin: 20,
  /** Space between the card and the shelf. */
  shelfGap: 64,
  /** The card never grows past this share of the screen while the shelf is up. */
  maximumCardScale: 0.86,
  /** Space above the card. */
  topMargin: 28,
  /** Horizontal padding inside the shelf around the track. */
  trackInset: 28,
  /** Height of the waveform track. */
  trackHeight: 44,
} as const;

export const shadow = {
  ambientBlur: 48,
  ambientOpacity: 0.35,
  keyBlur: 12,
  keyOffset: 6,
  keyOpacity: 0.3,
} as const;

/** Share of the screen tiles that must change at once for the change shimmer to stay quiet (big jumps glow nothing). */
export const shimmer = { duration: 180, maximumShare: 0.08, opacity: 0.28 } as const;
