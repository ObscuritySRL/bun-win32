// Pure-TS template (image) matching over RGB bitmaps — the nut.js / robotjs "find an image on screen"
// capability, for grounding actions on surfaces with no accessibility tree. Coarse-to-fine search:
// scan candidate offsets on a coarse stride scoring by mean absolute RGB difference (subsampled),
// then refine 1px around the best candidate. Returns the top-left match + a 0..1 confidence, or null
// below the threshold. Best for small needles (a button, an icon); a full-screen scan is O(area).

import { type Bitmap, captureScreen } from './screen';

export interface Match {
  x: number;
  y: number;
  /** 0..1 confidence (1 = exact). */
  score: number;
}

function meanDifference(haystack: Bitmap, needle: Bitmap, offsetX: number, offsetY: number, step: number): number {
  let total = 0;
  let samples = 0;
  for (let ny = 0; ny < needle.height; ny += step) {
    const needleRow = ny * needle.width;
    const haystackRow = (offsetY + ny) * haystack.width;
    for (let nx = 0; nx < needle.width; nx += step) {
      const needleIndex = (needleRow + nx) * 3;
      const haystackIndex = (haystackRow + offsetX + nx) * 3;
      total += Math.abs(needle.rgb[needleIndex]! - haystack.rgb[haystackIndex]!) + Math.abs(needle.rgb[needleIndex + 1]! - haystack.rgb[haystackIndex + 1]!) + Math.abs(needle.rgb[needleIndex + 2]! - haystack.rgb[haystackIndex + 2]!);
      samples += 3;
    }
  }
  return samples > 0 ? total / samples : 255;
}

/** Find `needle` within `haystack` (top-left coords in haystack space). Null below `threshold` (0..1). */
export function findImage(haystack: Bitmap, needle: Bitmap, options: { threshold?: number; step?: number } = {}): Match | null {
  if (needle.width > haystack.width || needle.height > haystack.height) return null;
  const threshold = options.threshold ?? 0.92;
  const step = options.step ?? Math.max(1, Math.floor(needle.width / 16));
  const coarse = Math.max(2, Math.floor(needle.width / 8));
  const maxOffsetX = haystack.width - needle.width;
  const maxOffsetY = haystack.height - needle.height;

  let bestX = 0;
  let bestY = 0;
  let bestDifference = Number.POSITIVE_INFINITY;
  for (let offsetY = 0; offsetY <= maxOffsetY; offsetY += coarse) {
    for (let offsetX = 0; offsetX <= maxOffsetX; offsetX += coarse) {
      const difference = meanDifference(haystack, needle, offsetX, offsetY, step);
      if (difference < bestDifference) {
        bestDifference = difference;
        bestX = offsetX;
        bestY = offsetY;
      }
    }
  }

  for (let offsetY = Math.max(0, bestY - coarse); offsetY <= Math.min(maxOffsetY, bestY + coarse); offsetY += 1) {
    for (let offsetX = Math.max(0, bestX - coarse); offsetX <= Math.min(maxOffsetX, bestX + coarse); offsetX += 1) {
      const difference = meanDifference(haystack, needle, offsetX, offsetY, 1);
      if (difference < bestDifference) {
        bestDifference = difference;
        bestX = offsetX;
        bestY = offsetY;
      }
    }
  }

  const confidence = 1 - bestDifference / 255;
  return confidence >= threshold ? { x: bestX, y: bestY, score: confidence } : null;
}

/** Capture the screen and locate `needle` on it, returning ABSOLUTE screen coords (ready to click). */
export function locateOnScreen(needle: Bitmap, options?: { threshold?: number; step?: number }): Match | null {
  const screen = captureScreen();
  const match = findImage(screen, needle, options);
  return match === null ? null : { x: screen.originX + match.x, y: screen.originY + match.y, score: match.score };
}
