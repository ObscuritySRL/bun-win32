// Colour-depth quantisers. xterm 256-colour is a 6×6×6 cube (16..231) plus a
// 24-step grey ramp (232..255); the 16-colour ANSI palette is a nearest-match.
// Both bake the branchy nearest-colour search into a 15-bit (32³) lookup table,
// so a quantize on the hot path is a single table read.

const cubeLevels = [0, 95, 135, 175, 215, 255];

const nearestCubeIndex = new Uint8Array(256);
for (let channelValue = 0; channelValue < 256; channelValue++) {
  let bestIndex = 0;
  let bestDistance = 1e9;
  for (let levelIndex = 0; levelIndex < 6; levelIndex++) {
    const difference = channelValue - cubeLevels[levelIndex];
    const distance = difference < 0 ? -difference : difference;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = levelIndex;
    }
  }
  nearestCubeIndex[channelValue] = bestIndex;
}

const exactQuantizeTo256 = (red: number, green: number, blue: number): number => {
  const maximum = red > green ? (red > blue ? red : blue) : green > blue ? green : blue;
  const minimum = red < green ? (red < blue ? red : blue) : green < blue ? green : blue;
  if (maximum - minimum < 8) {
    const gray = (red * 19595 + green * 38470 + blue * 7471) >> 16;
    if (gray < 4) return 16;
    if (gray > 246) return 231;
    let level = ((gray - 8) / 10 + 0.5) | 0;
    if (level < 0) level = 0;
    else if (level > 23) level = 23;
    return 232 + level;
  }
  return 16 + 36 * nearestCubeIndex[red] + 6 * nearestCubeIndex[green] + nearestCubeIndex[blue];
};

const palette16 = [
  [0, 0, 0],
  [128, 0, 0],
  [0, 128, 0],
  [128, 128, 0],
  [0, 0, 128],
  [128, 0, 128],
  [0, 128, 128],
  [192, 192, 192],
  [128, 128, 128],
  [255, 0, 0],
  [0, 255, 0],
  [255, 255, 0],
  [0, 0, 255],
  [255, 0, 255],
  [0, 255, 255],
  [255, 255, 255],
];

const lookupTable256 = new Uint8Array(32768);
const lookupTable16 = new Uint8Array(32768);
for (let red5 = 0; red5 < 32; red5++) {
  for (let green5 = 0; green5 < 32; green5++) {
    for (let blue5 = 0; blue5 < 32; blue5++) {
      const red = (red5 << 3) | (red5 >> 2);
      const green = (green5 << 3) | (green5 >> 2);
      const blue = (blue5 << 3) | (blue5 >> 2);
      const tableIndex = (red5 << 10) | (green5 << 5) | blue5;
      lookupTable256[tableIndex] = exactQuantizeTo256(red, green, blue);
      let bestIndex = 0;
      let bestDistance = 1e18;
      for (let paletteIndex = 0; paletteIndex < 16; paletteIndex++) {
        const entry = palette16[paletteIndex];
        const deltaRed = red - entry[0];
        const deltaGreen = green - entry[1];
        const deltaBlue = blue - entry[2];
        const distance = deltaRed * deltaRed + deltaGreen * deltaGreen + deltaBlue * deltaBlue;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = paletteIndex;
        }
      }
      lookupTable16[tableIndex] = bestIndex;
    }
  }
}

/** Max per-channel absolute delta between a packed 24-bit RGB and loose channels — the threshold-diff metric. */
export const channelDelta = (packedRgb: number, red: number, green: number, blue: number): number => {
  let difference = ((packedRgb >> 16) & 0xff) - red;
  let maximum = difference < 0 ? -difference : difference;
  difference = ((packedRgb >> 8) & 0xff) - green;
  if (difference < 0) difference = -difference;
  if (difference > maximum) maximum = difference;
  difference = (packedRgb & 0xff) - blue;
  if (difference < 0) difference = -difference;
  if (difference > maximum) maximum = difference;
  return maximum;
};

/** Quantise an 8-bit-per-channel colour to the nearest xterm 16-colour palette index. */
export const quantizeTo16 = (red: number, green: number, blue: number): number => lookupTable16[((red >> 3) << 10) | ((green >> 3) << 5) | (blue >> 3)];

/** Quantise an 8-bit-per-channel colour to the nearest xterm 256-colour palette index. */
export const quantizeTo256 = (red: number, green: number, blue: number): number => lookupTable256[((red >> 3) << 10) | ((green >> 3) << 5) | (blue >> 3)];

// Ordered (Bayer) dithering for the palette depths. The 8×8 recursive Bayer matrix
// (values 0..63) gives each pixel position a stable sub-step threshold; adding it as
// a bias before quantising trades a hard colour boundary for a position-fixed checker
// of the two nearest palette entries, so a smooth gradient reads as a blend rather
// than a band. Stateless and deterministic per (colour, position): identical frames
// still diff to nothing. The spread is tuned to each palette's dominant step (≈40 for
// the 256-cube, wider for the sparse 16-colour set). Index by `((y & 7) << 3) | (x & 7)`.
const bayer8x8 = new Uint8Array([
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29,
  53, 21,
]);
const DITHER_SPREAD_256 = 40;
const DITHER_SPREAD_16 = 110;

/** Bayer threshold (0..63) for a pixel position — index into the dithered quantisers. */
export const bayerThreshold = (x: number, y: number): number => bayer8x8[((y & 7) << 3) | (x & 7)];

/** {@link quantizeTo256} with an ordered-dither bias from {@link bayerThreshold} folded in before the palette match. */
export const quantizeTo256Dithered = (red: number, green: number, blue: number, threshold: number): number => {
  const bias = ((threshold * DITHER_SPREAD_256) >> 6) - (DITHER_SPREAD_256 >> 1);
  let red8 = red + bias;
  let green8 = green + bias;
  let blue8 = blue + bias;
  red8 = red8 < 0 ? 0 : red8 > 255 ? 255 : red8;
  green8 = green8 < 0 ? 0 : green8 > 255 ? 255 : green8;
  blue8 = blue8 < 0 ? 0 : blue8 > 255 ? 255 : blue8;
  return lookupTable256[((red8 >> 3) << 10) | ((green8 >> 3) << 5) | (blue8 >> 3)];
};

/** {@link quantizeTo16} with an ordered-dither bias from {@link bayerThreshold} folded in before the palette match. */
export const quantizeTo16Dithered = (red: number, green: number, blue: number, threshold: number): number => {
  const bias = ((threshold * DITHER_SPREAD_16) >> 6) - (DITHER_SPREAD_16 >> 1);
  let red8 = red + bias;
  let green8 = green + bias;
  let blue8 = blue + bias;
  red8 = red8 < 0 ? 0 : red8 > 255 ? 255 : red8;
  green8 = green8 < 0 ? 0 : green8 > 255 ? 255 : green8;
  blue8 = blue8 < 0 ? 0 : blue8 > 255 ? 255 : blue8;
  return lookupTable16[((red8 >> 3) << 10) | ((green8 >> 3) << 5) | (blue8 >> 3)];
};
