// Clipboard read/write (Unicode text) — the reliable large-text path that sidesteps per-keystroke
// SendInput corruption (set the clipboard, then paste), plus the nut.js/robotjs clipboard parity and
// a creative "read selected text from any app" (copy → read) that works even where there's no a11y
// tree. CF_UNICODETEXT via OpenClipboard + the Global* heap; zero new bindings.

import { toArrayBuffer } from 'bun:ffi';

import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

import { sendKeys } from '../input/input';
import type { Bitmap } from '../capture/screen';

const CF_DIB = 8;
const CF_HDROP = 15;
const CF_UNICODETEXT = 13;
const GMEM_MOVEABLE = 0x0002;

/** The clipboard's change counter (User32.GetClipboardSequenceNumber) — bumps on every clipboard write. Compare it
 *  before/after a posted WM_COPY/WM_CUT to tell whether the control actually copied (the counter changed) or the
 *  clipboard is STALE (empty selection / a control that ignored the message), so a stale value is never returned. */
export function clipboardSequence(): number {
  return User32.GetClipboardSequenceNumber();
}

/** Read the clipboard's Unicode text, or '' if it is empty or not text. */
export function readClipboard(): string {
  if (User32.OpenClipboard(0n) === 0) return '';
  try {
    if (User32.IsClipboardFormatAvailable(CF_UNICODETEXT) === 0) return '';
    const handle = User32.GetClipboardData(CF_UNICODETEXT);
    if (handle === 0n) return '';
    const pointer = Kernel32.GlobalLock(handle);
    if (pointer === null) return '';
    try {
      const size = Number(Kernel32.GlobalSize(handle));
      const text = Buffer.from(toArrayBuffer(pointer, 0, size)).toString('utf16le');
      const terminator = text.indexOf('\0');
      return terminator === -1 ? text : text.slice(0, terminator);
    } finally {
      Kernel32.GlobalUnlock(handle);
    }
  } finally {
    User32.CloseClipboard();
  }
}

/** Read the file paths on the clipboard (CF_HDROP — what Explorer's Ctrl+C/Cut puts there), or [] if none. Parses the
 *  DROPFILES struct directly: a 20-byte x64 header (pFiles offset @0, fWide flag @16) then a double-NUL-terminated
 *  path list. Makes the Explorer copy/paste workflow visible to the agent. Zero new bindings. */
export function readClipboardFiles(): readonly string[] {
  if (User32.OpenClipboard(0n) === 0) return [];
  try {
    if (User32.IsClipboardFormatAvailable(CF_HDROP) === 0) return [];
    const handle = User32.GetClipboardData(CF_HDROP);
    if (handle === 0n) return [];
    const pointer = Kernel32.GlobalLock(handle);
    if (pointer === null) return [];
    try {
      const size = Number(Kernel32.GlobalSize(handle));
      const view = new DataView(toArrayBuffer(pointer, 0, size));
      const listOffset = view.getUint32(0, true); // DROPFILES.pFiles
      const wide = view.getUint32(16, true) !== 0; // DROPFILES.fWide
      const bytes = Buffer.from(toArrayBuffer(pointer, 0, size)).subarray(listOffset);
      const blob = wide ? bytes.toString('utf16le') : bytes.toString('latin1');
      return blob.split('\0').filter((path) => path.length > 0); // entries are NUL-separated; list ends with a double-NUL
    } finally {
      Kernel32.GlobalUnlock(handle);
    }
  } finally {
    User32.CloseClipboard();
  }
}

/** Put file paths on the clipboard as CF_HDROP (a DROPFILES drop) — the inverse of readClipboardFiles, so an agent can
 *  "copy" files for an Explorer (or any drop-target) Ctrl+V/paste, exactly like a human's Ctrl+C in Explorer. Pass real
 *  backslash paths. Returns true on success; false for an empty list. Zero new bindings. */
export function writeClipboardFiles(paths: readonly string[]): boolean {
  if (paths.length === 0) return false;
  // DROPFILES (x64): DWORD pFiles@0 (offset to the list = 20), POINT pt@4 (8B), BOOL fNC@12, BOOL fWide@16 (=1, wide);
  // then a double-NUL-terminated UTF-16LE path list.
  const list = Buffer.from(`${paths.join('\0')}\0\0`, 'utf16le');
  const blob = Buffer.alloc(20 + list.length);
  blob.writeUInt32LE(20, 0); // pFiles
  blob.writeUInt32LE(1, 16); // fWide = TRUE
  list.copy(blob, 20);
  const handle = Kernel32.GlobalAlloc(GMEM_MOVEABLE, BigInt(blob.length));
  if (handle === 0n) return false;
  const pointer = Kernel32.GlobalLock(handle);
  if (pointer === null) {
    Kernel32.GlobalFree(handle);
    return false;
  }
  new Uint8Array(toArrayBuffer(pointer, 0, blob.length)).set(blob);
  Kernel32.GlobalUnlock(handle);
  if (User32.OpenClipboard(0n) === 0) {
    Kernel32.GlobalFree(handle);
    return false;
  }
  try {
    User32.EmptyClipboard();
    if (User32.SetClipboardData(CF_HDROP, handle) === 0n) {
      Kernel32.GlobalFree(handle); // ownership not transferred on failure
      return false;
    }
    return true; // on success the system owns `handle` — do not free it
  } finally {
    User32.CloseClipboard();
  }
}

/** Pack a top-down RGB bitmap into a CF_DIB blob: a 40-byte BITMAPINFOHEADER + bottom-up 24-bit BGR rows padded to a
 *  4-byte stride (the canonical clipboard bitmap format every app pastes). */
function encodeDib(image: { rgb: Uint8Array; width: number; height: number }): Buffer {
  const stride = (image.width * 3 + 3) & ~3;
  const buffer = Buffer.alloc(40 + stride * image.height);
  buffer.writeUInt32LE(40, 0); // biSize
  buffer.writeInt32LE(image.width, 4);
  buffer.writeInt32LE(image.height, 8); // positive ⇒ bottom-up
  buffer.writeUInt16LE(1, 12); // biPlanes
  buffer.writeUInt16LE(24, 14); // biBitCount
  buffer.writeUInt32LE(0, 16); // biCompression = BI_RGB
  buffer.writeUInt32LE(stride * image.height, 20); // biSizeImage
  for (let y = 0; y < image.height; y += 1) {
    const sourceRow = image.height - 1 - y; // bottom-up: DIB row 0 is the source's last row
    for (let x = 0; x < image.width; x += 1) {
      const source = (sourceRow * image.width + x) * 3;
      const target = 40 + y * stride + x * 3;
      buffer[target] = image.rgb[source + 2]!; // B
      buffer[target + 1] = image.rgb[source + 1]!; // G
      buffer[target + 2] = image.rgb[source]!; // R
    }
  }
  return buffer;
}

/** Decode a packed CF_DIB blob into a top-down RGB Bitmap, handling 24/32-bpp, top-down or bottom-up rows, and any
 *  palette gap before the pixels. null for an unsupported (compressed / sub-24-bpp) DIB. */
function decodeDib(view: Buffer): Bitmap | null {
  if (view.length < 40) return null; // too small for a BITMAPINFOHEADER — bail before any fixed-offset read can throw
  const headerSize = view.readUInt32LE(0);
  if (headerSize < 40 || view.readUInt32LE(16) !== 0) return null; // only BITMAPINFOHEADER+ and BI_RGB
  const width = view.readInt32LE(4);
  const rawHeight = view.readInt32LE(8);
  const bitCount = view.readUInt16LE(14);
  if (bitCount !== 24 && bitCount !== 32) return null;
  const topDown = rawHeight < 0;
  const height = Math.abs(rawHeight);
  // The clipboard blob is UNTRUSTED. width is a SIGNED int32 (negative → RangeError on alloc); an absurd product OOMs.
  // Reject insane dimensions so readClipboardImage honors its Bitmap|null contract instead of throwing.
  if (width <= 0 || height <= 0 || width > 0x7fff || height > 0x7fff) return null;
  const clrUsed = view.readUInt32LE(32);
  const bytesPerPixel = bitCount / 8;
  const stride = (width * bytesPerPixel + 3) & ~3;
  const pixelOffset = headerSize + clrUsed * 4; // CF_DIB has no BITMAPFILEHEADER; palette (clrUsed entries) precedes pixels
  if (pixelOffset + stride * height > view.length) return null; // truncated / lying DIB — the pixels are not all present
  const rgb = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    const sourceRow = topDown ? y : height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const source = pixelOffset + sourceRow * stride + x * bytesPerPixel;
      const target = (y * width + x) * 3;
      rgb[target] = view[source + 2]!; // R ← BGR
      rgb[target + 1] = view[source + 1]!; // G
      rgb[target + 2] = view[source]!; // B
    }
  }
  return { rgb, width, height, originX: 0, originY: 0 };
}

/** Read an image off the clipboard (CF_DIB — what Snipping Tool / a browser "copy image" / any Ctrl+C of a picture
 *  leaves there) as a top-down RGB Bitmap, or null if the clipboard holds no (supported) image. Zero new bindings. */
export function readClipboardImage(): Bitmap | null {
  if (User32.OpenClipboard(0n) === 0) return null;
  try {
    if (User32.IsClipboardFormatAvailable(CF_DIB) === 0) return null;
    const handle = User32.GetClipboardData(CF_DIB);
    if (handle === 0n) return null;
    const pointer = Kernel32.GlobalLock(handle);
    if (pointer === null) return null;
    try {
      const size = Number(Kernel32.GlobalSize(handle));
      return decodeDib(Buffer.from(toArrayBuffer(pointer, 0, size)));
    } finally {
      Kernel32.GlobalUnlock(handle);
    }
  } finally {
    User32.CloseClipboard();
  }
}

/** Put a top-down RGB image (e.g. a captureScreen / captureWindowLive result) on the clipboard as CF_DIB, so it can be
 *  pasted into Paint / Word / chat / email like a human's screenshot copy. Returns true on success. */
export function writeClipboardImage(image: { rgb: Uint8Array; width: number; height: number }): boolean {
  const dib = encodeDib(image);
  const handle = Kernel32.GlobalAlloc(GMEM_MOVEABLE, BigInt(dib.length));
  if (handle === 0n) return false;
  const pointer = Kernel32.GlobalLock(handle);
  if (pointer === null) {
    Kernel32.GlobalFree(handle);
    return false;
  }
  new Uint8Array(toArrayBuffer(pointer, 0, dib.length)).set(dib);
  Kernel32.GlobalUnlock(handle);
  if (User32.OpenClipboard(0n) === 0) {
    Kernel32.GlobalFree(handle);
    return false;
  }
  try {
    User32.EmptyClipboard();
    if (User32.SetClipboardData(CF_DIB, handle) === 0n) {
      Kernel32.GlobalFree(handle); // ownership not transferred on failure
      return false;
    }
    return true; // on success the system owns `handle` — do not free it
  } finally {
    User32.CloseClipboard();
  }
}

/** Set the clipboard's Unicode text. Returns true on success. */
export function writeClipboard(text: string): boolean {
  const bytes = Buffer.from(`${text}\0`, 'utf16le');
  const handle = Kernel32.GlobalAlloc(GMEM_MOVEABLE, BigInt(bytes.length));
  if (handle === 0n) return false;
  const pointer = Kernel32.GlobalLock(handle);
  if (pointer === null) {
    Kernel32.GlobalFree(handle);
    return false;
  }
  new Uint8Array(toArrayBuffer(pointer, 0, bytes.length)).set(bytes);
  Kernel32.GlobalUnlock(handle);
  if (User32.OpenClipboard(0n) === 0) {
    Kernel32.GlobalFree(handle);
    return false;
  }
  try {
    User32.EmptyClipboard();
    if (User32.SetClipboardData(CF_UNICODETEXT, handle) === 0n) {
      Kernel32.GlobalFree(handle); // ownership not transferred on failure
      return false;
    }
    return true; // on success the system owns `handle` — do not free it
  } finally {
    User32.CloseClipboard();
  }
}

/** Set the clipboard to `text` and paste it (Ctrl+V) into the focused control — the reliable, fast
 *  large-text path (no per-character keystrokes). Needs an unlocked, foregrounded desktop. */
export function paste(text: string): void {
  writeClipboard(text);
  sendKeys('Control+V');
}

/** Copy the current selection (Ctrl+C) and read it back — read text from any app, even with no a11y tree. */
export async function copy(): Promise<string> {
  sendKeys('Control+C');
  await Bun.sleep(80);
  return readClipboard();
}
