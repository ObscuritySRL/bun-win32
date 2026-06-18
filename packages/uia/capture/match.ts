// Pure-TS template (image) matching over RGB bitmaps — the nut.js / robotjs "find an image on screen"
// capability, for grounding actions on surfaces with no accessibility tree. Coarse-to-fine search:
// scan candidate offsets on a coarse stride scoring by mean absolute RGB difference (subsampled),
// then refine 1px around the best candidate. Returns the top-left match + a 0..1 confidence, or null
// below the threshold. Best for small needles (a button, an icon); a full-screen scan is O(area).

import type { Rect } from '../com/reads';
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

/**
 * Capture the screen (or `region`, to scope the scan to a known window/sub-rect — the nut.js
 * searchRegion / AHK ImageSearch bounds parity) and locate `needle` on it, returning ABSOLUTE
 * screen coords (ready to click). The region's origin is folded into the captured bitmap, so the
 * returned coords stay absolute regardless of the scan bounds.
 */
export function locateOnScreen(needle: Bitmap, options?: { threshold?: number; step?: number; region?: Partial<Rect> }): Match | null {
  const screen = captureScreen(options?.region);
  const match = findImage(screen, needle, options);
  return match === null ? null : { x: screen.originX + match.x, y: screen.originY + match.y, score: match.score };
}

/**
 * Find EVERY occurrence of `needle` within `haystack` (the nut.js `findAll` parity hole) — coarse-grid
 * scan, refine each below-threshold cell to its local minimum, then non-max suppression drops overlaps
 * inside needle bounds (best score wins). Sorted by descending score; capped at `maxResults`.
 */
export function findAllImages(haystack: Bitmap, needle: Bitmap, options: { threshold?: number; step?: number; maxResults?: number } = {}): Match[] {
  if (needle.width > haystack.width || needle.height > haystack.height) return [];
  const threshold = options.threshold ?? 0.92;
  const step = options.step ?? Math.max(1, Math.floor(needle.width / 16));
  const maxResults = options.maxResults ?? 64;
  const coarse = Math.max(2, Math.floor(needle.width / 8));
  const maxOffsetX = haystack.width - needle.width;
  const maxOffsetY = haystack.height - needle.height;
  const cutoff = (1 - threshold) * 255;

  const relaxed = Math.min(255, cutoff + (255 * coarse * (needle.width + needle.height)) / (needle.width * needle.height)); // a coarse cell sits up to `coarse` px off the true match; bound its worst-case score inflation so a real match is never gated out before the refine

  const candidates: Match[] = [];
  for (let offsetY = 0; offsetY <= maxOffsetY; offsetY += coarse) {
    for (let offsetX = 0; offsetX <= maxOffsetX; offsetX += coarse) {
      if (meanDifference(haystack, needle, offsetX, offsetY, step) > relaxed) continue;
      let localX = offsetX;
      let localY = offsetY;
      let localDifference = Number.POSITIVE_INFINITY;
      for (let refineY = Math.max(0, offsetY - coarse); refineY <= Math.min(maxOffsetY, offsetY + coarse); refineY += 1) {
        for (let refineX = Math.max(0, offsetX - coarse); refineX <= Math.min(maxOffsetX, offsetX + coarse); refineX += 1) {
          const difference = meanDifference(haystack, needle, refineX, refineY, 1);
          if (difference < localDifference) {
            localDifference = difference;
            localX = refineX;
            localY = refineY;
          }
        }
      }
      if (localDifference <= cutoff) candidates.push({ x: localX, y: localY, score: 1 - localDifference / 255 });
    }
  }

  candidates.sort((first, second) => second.score - first.score);
  const accepted: Match[] = [];
  for (const candidate of candidates) {
    if (accepted.length >= maxResults) break;
    if (accepted.some((kept) => Math.abs(kept.x - candidate.x) < needle.width && Math.abs(kept.y - candidate.y) < needle.height)) continue;
    accepted.push(candidate);
  }
  return accepted;
}

/**
 * Capture the screen (or `region`, to scope the scan to a known window/sub-rect) and locate EVERY
 * occurrence of `needle`, each in ABSOLUTE screen coords. The region's origin is folded into the
 * captured bitmap, so the returned coords stay absolute regardless of the scan bounds.
 */
export function locateAllOnScreen(needle: Bitmap, options?: { threshold?: number; step?: number; maxResults?: number; region?: Partial<Rect> }): Match[] {
  const screen = captureScreen(options?.region);
  return findAllImages(screen, needle, options).map((match) => ({ x: screen.originX + match.x, y: screen.originY + match.y, score: match.score }));
}

/**
 * Locate the first screen pixel matching `rgb` within `tolerance` (per-channel max abs delta) — the
 * nut.js `pixelWithColor` parity hole, for color-based grounding ('find the next red pixel'). Returns
 * ABSOLUTE screen coords (top-down, left-to-right scan), or null if no pixel is within tolerance.
 */
export function locateColor(rgb: { r: number; g: number; b: number }, tolerance = 0, region?: Partial<Rect>): { x: number; y: number } | null {
  const screen = captureScreen(region);
  for (let y = 0, index = 0; y < screen.height; y += 1) {
    for (let x = 0; x < screen.width; x += 1, index += 3) {
      if (Math.abs(screen.rgb[index]! - rgb.r) <= tolerance && Math.abs(screen.rgb[index + 1]! - rgb.g) <= tolerance && Math.abs(screen.rgb[index + 2]! - rgb.b) <= tolerance) return { x: screen.originX + x, y: screen.originY + y };
    }
  }
  return null;
}
