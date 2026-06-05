import type { TermMode } from './types';

// Glyph tables for the sub-cell render modes. A character cell can pack more than
// the classic upper-half-block: the higher modes quantise the cell to two colours
// and pick the Unicode glyph whose lit sub-cells best match the pixels.

/** UTF-8 encode a single code point (≤4 bytes). */
export const codePointToUtf8 = (codePoint: number): Uint8Array => {
  if (codePoint < 0x80) return Uint8Array.of(codePoint);
  if (codePoint < 0x800) return Uint8Array.of(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
  if (codePoint < 0x10000) return Uint8Array.of(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
  return Uint8Array.of(0xf0 | (codePoint >> 18), 0x80 | ((codePoint >> 12) & 0x3f), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
};

/** `[pixelWidth, pixelHeight]` sub-pixels packed into one character cell, per mode. */
export const MODE_DIMENSIONS: Record<TermMode, readonly [number, number]> = {
  ascii: [1, 2],
  braille: [2, 4],
  half: [1, 2],
  octant: [2, 4],
  quad: [2, 2],
  sextant: [2, 3],
};

/** ASCII luminance ramp, dark to bright; each cell becomes one tinted ramp glyph. */
export const asciiRamp = ' .:-=+*#%@';
export const asciiRampBytes = Array.from(asciiRamp, (character) => Uint8Array.of(character.charCodeAt(0)));

/** `▀` (U+2580). In `half` mode the top sub-pixel is the foreground, the bottom the background. */
export const halfBlockGlyph = codePointToUtf8(0x2580);

// Quadrant blocks indexed by lit-sub-cell mask. bit0=topLeft bit1=topRight bit2=bottomLeft bit3=bottomRight.
const quadrantCodePoints = [0x20, 0x2598, 0x259d, 0x2580, 0x2596, 0x258c, 0x259e, 0x259b, 0x2597, 0x259a, 0x2590, 0x259c, 0x2584, 0x2599, 0x259f, 0x2588];
export const quadrantGlyphs = quadrantCodePoints.map(codePointToUtf8);

// Legacy-computing sextants (Unicode 13). The mask matches the Unicode sextant
// bit-value convention, so glyph = U+1FB00 + mask, except blank / full / left /
// right columns which reuse existing block characters.
const sextantCodePoint = (mask: number): number => {
  if (mask === 0) return 0x20; // blank
  if (mask === 63) return 0x2588; // █ full
  if (mask === 21) return 0x258c; // ▌ left column
  if (mask === 42) return 0x2590; // ▐ right column
  return 0x1fb00 + (mask - 1 - (mask > 21 ? 1 : 0) - (mask > 42 ? 1 : 0));
};
export const sextantGlyphs = (() => {
  const glyphs: Uint8Array[] = new Array(64);
  for (let mask = 0; mask < 64; mask++) glyphs[mask] = codePointToUtf8(sextantCodePoint(mask));
  return glyphs;
})();

// Braille (U+2800). The mask is the dot pattern, so glyph = U+2800 + mask.
export const brailleGlyphs = (() => {
  const glyphs: Uint8Array[] = new Array(256);
  for (let mask = 0; mask < 256; mask++) glyphs[mask] = codePointToUtf8(0x2800 + mask);
  return glyphs;
})();

// Block octants (Unicode 16, 2024): a 2×4 solid two-colour cell — braille's density
// with quad's solid blocks. The 230 glyphs U+1CD00..U+1CDE5 are assigned in ascending
// mask order to the masks NOT already encoded by an older block character; the 26
// pre-existing patterns (blank, halves, quadrants, eighths, full) reuse those. Bit d-1
// is octant d (row-major top→bottom, left then right), matching #emitMulti's sub-cell
// order exactly, so the bit layout is the identity. Mapping verified against the
// Unicode 16 NamesList and the wezterm/kitty implementations.
const octantReusedCodePoint: Record<number, number> = {
  0: 0x0020,
  1: 0x1cea8,
  2: 0x1ceab,
  3: 0x1fb82,
  5: 0x2598,
  10: 0x259d,
  15: 0x2580,
  20: 0x1fbe6,
  40: 0x1fbe7,
  63: 0x1fb85,
  64: 0x1cea3,
  80: 0x2596,
  85: 0x258c,
  90: 0x259e,
  95: 0x259b,
  128: 0x1cea0,
  160: 0x2597,
  165: 0x259a,
  170: 0x2590,
  175: 0x259c,
  192: 0x2582,
  240: 0x2584,
  245: 0x2599,
  250: 0x259f,
  252: 0x2586,
  255: 0x2588,
};
export const octantGlyphs = (() => {
  const glyphs: Uint8Array[] = new Array(256);
  let mainIndex = 0;
  for (let mask = 0; mask < 256; mask++) {
    const reused = octantReusedCodePoint[mask];
    if (reused !== undefined) {
      glyphs[mask] = codePointToUtf8(reused);
    } else {
      glyphs[mask] = codePointToUtf8(0x1cd00 + mainIndex);
      mainIndex++;
    }
  }
  return glyphs;
})();

// Sub-cell index (subRow * pixelWidth + subColumn) → glyph bit position, per mode.
// Only braille's dot numbering is non-row-major (dots 1,4,2,5,3,6,7,8).
export const quadrantBitLayout = new Uint8Array([0, 1, 2, 3]);
export const sextantBitLayout = new Uint8Array([0, 1, 2, 3, 4, 5]);
export const brailleBitLayout = new Uint8Array([0, 3, 1, 4, 2, 5, 6, 7]);
export const octantBitLayout = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
