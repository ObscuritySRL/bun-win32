// Minimal pure-TS PNG encoder (adapted from @bun-win32/terminal's png.ts) for PrintWindow screenshots.
// `Bun.deflateSync` returns a raw DEFLATE stream, so the IDAT payload is hand-wrapped in a zlib
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
