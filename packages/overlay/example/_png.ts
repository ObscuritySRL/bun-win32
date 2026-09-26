// Shared by the overlay examples: encode Overlay.capture() output (pre-multiplied RGBA) as a transparent PNG, so
// demos can honor CAPTURE_PNG and render headless stills for visual checks.

import { deflateSync } from 'node:zlib';

const SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

/**
 * Pre-multiplied RGBA to PNG bytes (straight alpha, 8-bit RGBA, no filtering).
 * @example
 * ```ts
 * await Bun.write('frame.png', encodePNG(overlay.capture(), overlay.width, overlay.height));
 * ```
 */
export function encodePNG(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const rows = new Uint8Array((width * 4 + 1) * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0, source = y * width * 4, target = y * (width * 4 + 1) + 1; x < width; x++, source += 4, target += 4) {
      const alpha = rgba[source + 3];
      const scale = alpha === 0 ? 0 : 255 / alpha;

      rows[target] = Math.min(255, Math.round(rgba[source] * scale));
      rows[target + 1] = Math.min(255, Math.round(rgba[source + 1] * scale));
      rows[target + 2] = Math.min(255, Math.round(rgba[source + 2] * scale));
      rows[target + 3] = alpha;
    }
  }

  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);

  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8; // bit depth
  header[9] = 6; // color type: RGBA

  const chunks = [chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', new Uint8Array(0))];
  const output = new Uint8Array(SIGNATURE.length + chunks.reduce((total, part) => total + part.length, 0));

  output.set(SIGNATURE, 0);

  for (let offset = SIGNATURE.length, index = 0; index < chunks.length; offset += chunks[index].length, index++) {
    output.set(chunks[index], offset);
  }

  return output;
}

/** Length, type, data, CRC-32 of type + data */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const output = new Uint8Array(12 + data.length);
  const view = new DataView(output.buffer);

  view.setUint32(0, data.length);
  output.set(new TextEncoder().encode(type), 4);
  output.set(data, 8);
  view.setUint32(8 + data.length, Bun.hash.crc32(output.subarray(4, 8 + data.length)));

  return output;
}
