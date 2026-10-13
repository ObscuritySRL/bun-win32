import { describe, expect, test } from 'bun:test';

import { isReduced, reduce, reducedLength, restore } from './resample';

function tile(columns: number, rows: number, color: (x: number, y: number) => [number, number, number]): Uint8Array {
  const pixels = new Uint8Array(columns * rows * 4);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const [blue, green, red] = color(x, y);
      pixels.set([blue, green, red, 255], (y * columns + x) * 4);
    }
  }
  return pixels;
}

describe('resample', () => {
  test('reduced and full sizes are always distinguishable', () => {
    for (const [columns, rows] of [
      [64, 64],
      [64, 32],
      [5, 64],
      [64, 3],
      [4, 4],
    ] as const) {
      expect(reducedLength(columns, rows)).toBeLessThan(columns * rows * 4);
      expect(isReduced(new Uint8Array(reducedLength(columns, rows)), columns, rows)).toBe(true);
      expect(isReduced(new Uint8Array(columns * rows * 4), columns, rows)).toBe(false);
    }
  });

  test('a flat tile survives the round trip exactly', () => {
    const flat = tile(64, 64, () => [10, 200, 30]);
    const restored = restore(reduce(flat, 64, 64), 64, 64);
    expect(restored.length).toBe(flat.length);
    expect([...restored]).toEqual([...flat]);
  });

  test('a gradient comes back close (blurred, not garbled)', () => {
    const gradient = tile(64, 32, (x, y) => [x * 4, y * 8, 128]);
    const restored = restore(reduce(gradient, 64, 32), 64, 32);
    let worst = 0;
    for (let index = 0; index < gradient.length; index += 1) worst = Math.max(worst, Math.abs(gradient[index]! - restored[index]!));
    expect(worst).toBeLessThanOrEqual(12);
  });

  test('edge tiles keep their shape', () => {
    const edge = tile(5, 3, (x) => [x * 50, 0, 0]);
    const reduced = reduce(edge, 5, 3);
    expect(reduced.length).toBe(reducedLength(5, 3));
    expect(restore(reduced, 5, 3).length).toBe(5 * 3 * 4);
  });
});
