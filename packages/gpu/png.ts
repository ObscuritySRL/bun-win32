// Minimal pure-TS PNG encoder (adapted from @bun-win32/terminal). `Bun.deflateSync`
// returns a raw DEFLATE stream, so the IDAT payload is hand-wrapped in a zlib
// container (0x78 0x01 + data + Adler-32 of the unfiltered scanlines).

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array): number => {
  let value = 0xffffffff;
  for (let index = 0; index < bytes.length; index++) value = crcTable[(value ^ bytes[index]!) & 0xff]! ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};

const adler32 = (bytes: Uint8Array): number => {
  let low = 1;
  let high = 0;
  for (let index = 0; index < bytes.length; index++) {
    low = (low + bytes[index]!) % 65521;
    high = (high + low) % 65521;
  }
  return ((high << 16) | low) >>> 0;
};

const uint32BigEndian = (value: number): Uint8Array => Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);

const pngChunk = (type: string, data: Uint8Array): Uint8Array => {
  const typeBytes = Uint8Array.from(type, (character) => character.charCodeAt(0));
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);
  const chunk = new Uint8Array(4 + body.length + 4);
  chunk.set(uint32BigEndian(data.length), 0);
  chunk.set(body, 4);
  chunk.set(uint32BigEndian(crc32(body)), 4 + body.length);
  return chunk;
};

/** Encode a tightly packed width×height RGB8 buffer to a PNG byte array. */
export const encodePNG = (rgbPixels: Uint8Array, width: number, height: number): Uint8Array => {
  const scanlineLength = 1 + width * 3;
  const filtered = new Uint8Array(height * scanlineLength);
  for (let row = 0; row < height; row++) {
    filtered[row * scanlineLength] = 0;
    filtered.set(rgbPixels.subarray(row * width * 3, (row + 1) * width * 3), row * scanlineLength + 1);
  }
  const deflated = Bun.deflateSync(filtered);
  const zlib = new Uint8Array(2 + deflated.length + 4);
  zlib[0] = 0x78;
  zlib[1] = 0x01;
  zlib.set(deflated, 2);
  zlib.set(uint32BigEndian(adler32(filtered)), 2 + deflated.length);
  const headerData = new Uint8Array(13);
  headerData.set(uint32BigEndian(width), 0);
  headerData.set(uint32BigEndian(height), 4);
  headerData[8] = 8;
  headerData[9] = 2;
  const signature = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
  const chunks = [signature, pngChunk('IHDR', headerData), pngChunk('IDAT', zlib), pngChunk('IEND', new Uint8Array(0))];
  let totalLength = 0;
  for (const chunk of chunks) totalLength += chunk.length;
  const png = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    png.set(chunk, offset);
    offset += chunk.length;
  }
  return png;
};

export interface DecodedPNG {
  height: number;
  /** Tightly packed RGBA8 (palette/grayscale expanded; alpha 255 where the source has none). */
  pixels: Uint8Array;
  width: number;
}

function paethPredictor(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft;
  const deltaLeft = Math.abs(estimate - left);
  const deltaUp = Math.abs(estimate - up);
  const deltaUpLeft = Math.abs(estimate - upLeft);
  if (deltaLeft <= deltaUp && deltaLeft <= deltaUpLeft) return left;
  return deltaUp <= deltaUpLeft ? up : upLeft;
}

/**
 * Decode an 8-bit non-interlaced PNG (color types 0 grayscale, 2 RGB, 3 palette,
 * 6 RGBA) to tightly packed RGBA. Throws explicit errors for 16-bit, interlaced,
 * and grayscale+alpha inputs — the pinned v1 scope.
 */
export const decodePNG = (bytes: Uint8Array): DecodedPNG => {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let index = 0; index < 8; index += 1) {
    if (bytes[index] !== signature[index]) throw new Error('decodePNG: not a PNG (bad signature).');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  let colorType = 0;
  let palette: Uint8Array | null = null;
  const idatParts: Uint8Array[] = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(bytes[offset + 4]!, bytes[offset + 5]!, bytes[offset + 6]!, bytes[offset + 7]!);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      const bitDepth = bytes[offset + 16]!;
      colorType = bytes[offset + 17]!;
      const interlace = bytes[offset + 20]!;
      if (bitDepth !== 8) throw new Error(`decodePNG: only 8-bit channels are supported (got ${bitDepth}-bit).`);
      if (interlace !== 0) throw new Error('decodePNG: interlaced (Adam7) PNGs are not supported.');
      if (colorType !== 0 && colorType !== 2 && colorType !== 3 && colorType !== 6) throw new Error(`decodePNG: color type ${colorType} is not supported (grayscale 0, RGB 2, palette 3, RGBA 6 only).`);
    } else if (type === 'PLTE') {
      palette = data.slice();
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  if (width === 0 || height === 0) throw new Error('decodePNG: missing IHDR.');
  let zlibLength = 0;
  for (const part of idatParts) zlibLength += part.length;
  const zlib = new Uint8Array(zlibLength);
  let zlibOffset = 0;
  for (const part of idatParts) {
    zlib.set(part, zlibOffset);
    zlibOffset += part.length;
  }
  if ((zlib[0]! & 0x0f) !== 8) throw new Error('decodePNG: IDAT is not zlib/deflate.');
  if ((zlib[1]! & 0x20) !== 0) throw new Error('decodePNG: zlib preset dictionaries are not supported.');
  const raw = Bun.inflateSync(zlib.subarray(2, zlib.length - 4));

  const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : 1;
  const stride = width * channels;
  if (raw.length < (stride + 1) * height) throw new Error('decodePNG: truncated pixel data.');
  const unfiltered = new Uint8Array(stride * height);
  for (let row = 0; row < height; row += 1) {
    const filter = raw[row * (stride + 1)]!;
    const lineStart = row * (stride + 1) + 1;
    const outStart = row * stride;
    for (let column = 0; column < stride; column += 1) {
      const value = raw[lineStart + column]!;
      const left = column >= channels ? unfiltered[outStart + column - channels]! : 0;
      const up = row > 0 ? unfiltered[outStart - stride + column]! : 0;
      const upLeft = row > 0 && column >= channels ? unfiltered[outStart - stride + column - channels]! : 0;
      let decoded: number;
      if (filter === 0) decoded = value;
      else if (filter === 1) decoded = value + left;
      else if (filter === 2) decoded = value + up;
      else if (filter === 3) decoded = value + Math.floor((left + up) / 2);
      else if (filter === 4) decoded = value + paethPredictor(left, up, upLeft);
      else throw new Error(`decodePNG: unknown filter type ${filter} on row ${row}.`);
      unfiltered[outStart + column] = decoded & 0xff;
    }
  }

  const pixels = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    if (colorType === 0) {
      const value = unfiltered[index]!;
      pixels[index * 4] = value;
      pixels[index * 4 + 1] = value;
      pixels[index * 4 + 2] = value;
      pixels[index * 4 + 3] = 255;
    } else if (colorType === 2) {
      pixels[index * 4] = unfiltered[index * 3]!;
      pixels[index * 4 + 1] = unfiltered[index * 3 + 1]!;
      pixels[index * 4 + 2] = unfiltered[index * 3 + 2]!;
      pixels[index * 4 + 3] = 255;
    } else if (colorType === 3) {
      if (palette === null) throw new Error('decodePNG: palette image without a PLTE chunk.');
      const entry = unfiltered[index]! * 3;
      pixels[index * 4] = palette[entry]!;
      pixels[index * 4 + 1] = palette[entry + 1]!;
      pixels[index * 4 + 2] = palette[entry + 2]!;
      pixels[index * 4 + 3] = 255;
    } else {
      pixels[index * 4] = unfiltered[index * 4]!;
      pixels[index * 4 + 1] = unfiltered[index * 4 + 1]!;
      pixels[index * 4 + 2] = unfiltered[index * 4 + 2]!;
      pixels[index * 4 + 3] = unfiltered[index * 4 + 3]!;
    }
  }
  return { height, pixels, width };
};

/** Encode a BGRA buffer with an arbitrary row stride (the swap-chain layout) to a PNG byte array. */
export const encodePNGFromBGRA = (bgraPixels: Uint8Array, width: number, height: number, rowStride = width * 4): Uint8Array => {
  const rgb = new Uint8Array(width * height * 3);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const source = row * rowStride + column * 4;
      const target = (row * width + column) * 3;
      rgb[target] = bgraPixels[source + 2]!;
      rgb[target + 1] = bgraPixels[source + 1]!;
      rgb[target + 2] = bgraPixels[source]!;
    }
  }
  return encodePNG(rgb, width, height);
};
