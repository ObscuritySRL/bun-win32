// Set-of-Marks: draw the snapshot's interactable elements as numbered boxes onto the PrintWindow
// screenshot, so a vision model refers to mark [12] instead of guessing pixels — the grounding format
// the literature (Set-of-Mark, UFO2, Windows Agent Arena) converges on, here derived for FREE from
// UIA bounds rather than a vision detector. A self-contained RGB-buffer blitter with a 3×5 digit font
// (no terminal-engine dependency); marks are offset from virtual-screen bounds into window-local pixels.

import { encodePNG } from './png';
import type { Mark, Snapshot } from './refmap';
import type { Rect } from './reads';
import type { Window } from './element';
import { captureWindowRGB } from './window';

// Each digit is five rows of three columns; bit 2 = left, bit 1 = middle, bit 0 = right.
const DIGITS: Record<string, readonly number[]> = {
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b111, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b010, 0b010, 0b010],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
};

export interface PlacedMark {
  ref: string;
  label: number;
  role: string;
  name: string;
  bounds: Rect;
}

export interface MarkedScreenshot {
  png: Uint8Array;
  marks: PlacedMark[];
}

function setPixel(rgb: Uint8Array, width: number, height: number, x: number, y: number, r: number, g: number, b: number): void {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const offset = (y * width + x) * 3;
  rgb[offset] = r;
  rgb[offset + 1] = g;
  rgb[offset + 2] = b;
}

function drawBox(rgb: Uint8Array, width: number, height: number, x: number, y: number, w: number, h: number, r: number, g: number, b: number): void {
  for (let index = 0; index < w; index += 1) {
    setPixel(rgb, width, height, x + index, y, r, g, b);
    setPixel(rgb, width, height, x + index, y + h - 1, r, g, b);
  }
  for (let index = 0; index < h; index += 1) {
    setPixel(rgb, width, height, x, y + index, r, g, b);
    setPixel(rgb, width, height, x + w - 1, y + index, r, g, b);
  }
}

function drawDigit(rgb: Uint8Array, width: number, height: number, glyph: readonly number[], x: number, y: number, scale: number, r: number, g: number, b: number): void {
  for (let row = 0; row < 5; row += 1) {
    const bits = glyph[row]!;
    for (let column = 0; column < 3; column += 1) {
      if (((bits >> (2 - column)) & 1) === 0) continue;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) setPixel(rgb, width, height, x + column * scale + sx, y + row * scale + sy, r, g, b);
      }
    }
  }
}

/** Blit numbered boxes for `marks` (virtual-screen bounds) onto a window-local RGB buffer. */
export function drawMarks(rgb: Uint8Array, width: number, height: number, originX: number, originY: number, marks: readonly Mark[]): PlacedMark[] {
  const placed: PlacedMark[] = [];
  const scale = 2;
  const glyphHeight = 5 * scale;
  for (const mark of marks) {
    const label = Number(mark.ref.slice(1));
    const x = Math.round(mark.bounds.x - originX);
    const y = Math.round(mark.bounds.y - originY);
    const w = Math.max(2, Math.round(mark.bounds.width));
    const h = Math.max(2, Math.round(mark.bounds.height));
    drawBox(rgb, width, height, x, y, w, h, 255, 60, 60);
    drawBox(rgb, width, height, x - 1, y - 1, w + 2, h + 2, 255, 60, 60);
    const text = String(label);
    const tagWidth = text.length * (3 * scale + 1) + scale;
    const tagHeight = glyphHeight + scale;
    for (let row = 0; row < tagHeight; row += 1) {
      for (let column = 0; column < tagWidth; column += 1) setPixel(rgb, width, height, x + column, y + row, 255, 235, 59);
    }
    let digitX = x + 1;
    for (const character of text) {
      const glyph = DIGITS[character];
      if (glyph !== undefined) drawDigit(rgb, width, height, glyph, digitX, y + 1, scale, 20, 20, 20);
      digitX += 3 * scale + 1;
    }
    placed.push({ ref: mark.ref, label, role: mark.role, name: mark.name, bounds: mark.bounds });
  }
  return placed;
}

/** Capture a window and overlay Set-of-Marks numbered boxes for the snapshot's interactable elements. */
export function screenshotWithMarks(window: Window, shot: Snapshot): MarkedScreenshot {
  const capture = captureWindowRGB(window.hWnd);
  if (capture === null) return { png: new Uint8Array(0), marks: [] };
  const placed = drawMarks(capture.rgb, capture.width, capture.height, capture.originX, capture.originY, shot.marks);
  return { png: encodePNG(capture.rgb, capture.width, capture.height), marks: placed };
}
