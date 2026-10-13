// A packed CF_DIB — BITMAPINFOHEADER followed by bottom-up 32-bit rows — the image format every
// Windows app accepts from the clipboard. Built in the worker so the eye only copies bytes.

/** Build a CF_DIB from a top-down BGRA bitmap (runs in the worker; the eye only copies it). */
export function packDib(bitmap: Uint8Array, width: number, height: number): Uint8Array<ArrayBuffer> {
  const header = 0x28;
  const rowBytes = width * 4;
  const dib = new Uint8Array(new ArrayBuffer(header + rowBytes * height));
  const view = new DataView(dib.buffer);
  view.setUint32(0x00, header, true);
  view.setInt32(0x04, width, true);
  view.setInt32(0x08, height, true);
  view.setUint16(0x0c, 1, true);
  view.setUint16(0x0e, 32, true);
  view.setUint32(0x14, rowBytes * height, true);
  for (let row = 0; row < height; row += 1) {
    const source = row * rowBytes;
    dib.set(bitmap.subarray(source, source + rowBytes), header + (height - 1 - row) * rowBytes);
  }
  for (let alpha = header + 3; alpha < dib.length; alpha += 4) dib[alpha] = 0xff;
  return dib;
}
