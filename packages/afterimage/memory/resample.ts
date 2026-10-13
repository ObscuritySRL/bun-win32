// Spatial level of detail for "hot" tiles (video, games, long scrolls): kept at a quarter of the
// resolution in each axis (1/16 the bytes) and restored bilinearly. A reduced blob is recognized
// by its decompressed length alone, which never collides with a full tile's.

const factor = 4;

/** True when `pixels` is the reduced form of a columns × rows tile. */
export function isReduced(pixels: Uint8Array, columns: number, rows: number): boolean {
  return pixels.length === reducedLength(columns, rows);
}

/** Box-filter a tightly packed BGRA tile down by 4 in each axis. */
export function reduce(pixels: Uint8Array, columns: number, rows: number): Uint8Array {
  const reducedColumns = Math.ceil(columns / factor);
  const reducedRows = Math.ceil(rows / factor);
  const reduced = new Uint8Array(reducedColumns * reducedRows * 4);
  for (let reducedY = 0; reducedY < reducedRows; reducedY += 1) {
    const top = reducedY * factor;
    const bottom = Math.min(rows, top + factor);
    for (let reducedX = 0; reducedX < reducedColumns; reducedX += 1) {
      const left = reducedX * factor;
      const right = Math.min(columns, left + factor);
      let blue = 0;
      let green = 0;
      let red = 0;
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const offset = (y * columns + x) * 4;
          blue += pixels[offset]!;
          green += pixels[offset + 1]!;
          red += pixels[offset + 2]!;
        }
      }
      const count = (bottom - top) * (right - left);
      const target = (reducedY * reducedColumns + reducedX) * 4;
      reduced[target] = Math.round(blue / count);
      reduced[target + 1] = Math.round(green / count);
      reduced[target + 2] = Math.round(red / count);
      reduced[target + 3] = 255;
    }
  }
  return reduced;
}

export function reducedLength(columns: number, rows: number): number {
  return Math.ceil(columns / factor) * Math.ceil(rows / factor) * 4;
}

/** Bilinear upsample of a reduced tile back to columns × rows. */
export function restore(reduced: Uint8Array, columns: number, rows: number): Uint8Array {
  const reducedColumns = Math.ceil(columns / factor);
  const reducedRows = Math.ceil(rows / factor);
  const pixels = new Uint8Array(columns * rows * 4);
  for (let y = 0; y < rows; y += 1) {
    const sourceY = Math.min(reducedRows - 1, Math.max(0, (y + 0.5) / factor - 0.5));
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(reducedRows - 1, y0 + 1);
    const weightY = sourceY - y0;
    for (let x = 0; x < columns; x += 1) {
      const sourceX = Math.min(reducedColumns - 1, Math.max(0, (x + 0.5) / factor - 0.5));
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(reducedColumns - 1, x0 + 1);
      const weightX = sourceX - x0;
      const target = (y * columns + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const top = reduced[(y0 * reducedColumns + x0) * 4 + channel]! * (1 - weightX) + reduced[(y0 * reducedColumns + x1) * 4 + channel]! * weightX;
        const bottom = reduced[(y1 * reducedColumns + x0) * 4 + channel]! * (1 - weightX) + reduced[(y1 * reducedColumns + x1) * 4 + channel]! * weightX;
        pixels[target + channel] = Math.round(top * (1 - weightY) + bottom * weightY);
      }
      pixels[target + 3] = 255;
    }
  }
  return pixels;
}
