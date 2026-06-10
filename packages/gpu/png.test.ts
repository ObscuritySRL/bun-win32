import { describe, expect, test } from 'bun:test';

import { decodePNG, encodePNG, encodePNGFromBGRA } from './png';

function randomRgb(width: number, height: number, seed: number): Uint8Array {
  const pixels = new Uint8Array(width * height * 3);
  let state = seed;
  for (let index = 0; index < pixels.length; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    pixels[index] = state & 0xff;
  }
  return pixels;
}

describe('decodePNG', () => {
  test('round-trips encodePNG byte-exactly (RGB → RGBA with alpha 255)', () => {
    const width = 37; // deliberately not a power of two
    const height = 23;
    const rgb = randomRgb(width, height, 0x1234_5678);
    const decoded = decodePNG(encodePNG(rgb, width, height));
    expect(decoded.width).toBe(width);
    expect(decoded.height).toBe(height);
    expect(decoded.pixels.byteLength).toBe(width * height * 4);
    for (let index = 0; index < width * height; index += 1) {
      expect(decoded.pixels[index * 4]).toBe(rgb[index * 3]!);
      expect(decoded.pixels[index * 4 + 1]).toBe(rgb[index * 3 + 1]!);
      expect(decoded.pixels[index * 4 + 2]).toBe(rgb[index * 3 + 2]!);
      expect(decoded.pixels[index * 4 + 3]).toBe(255);
    }
  });
  test('round-trips the BGRA encoder (channel swap verified)', () => {
    const bgra = Uint8Array.of(255, 0, 0, 255, 0, 255, 0, 255); // blue pixel, green pixel
    const decoded = decodePNG(encodePNGFromBGRA(bgra, 2, 1));
    expect([...decoded.pixels.subarray(0, 8)]).toEqual([0, 0, 255, 255, 0, 255, 0, 255]);
  });
  test('rejects non-PNG bytes', () => {
    expect(() => decodePNG(Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8, 9))).toThrow('bad signature');
  });
  test('rejects 16-bit and interlaced PNGs with explicit errors', () => {
    const sixteenBit = encodePNG(randomRgb(4, 4, 1), 4, 4);
    sixteenBit[24] = 16; // IHDR bit depth byte
    // CRC no longer matches, but the decoder reads fields before any CRC concern.
    expect(() => decodePNG(sixteenBit)).toThrow('8-bit');
    const interlaced = encodePNG(randomRgb(4, 4, 2), 4, 4);
    interlaced[28] = 1; // IHDR interlace byte
    expect(() => decodePNG(interlaced)).toThrow('interlaced');
  });
});
