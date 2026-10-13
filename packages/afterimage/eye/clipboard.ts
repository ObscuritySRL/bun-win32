// The clipboard, both ways: an image of a moment out (CF_DIB, which every Windows app pastes), and
// plain text in for the Go to field. The worker builds the DIB; this only copies it into the
// global memory the clipboard owns.

import { toArrayBuffer } from 'bun:ffi';

import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

const formatDib = 0x8;
const formatUnicodeText = 0xd;
const movable = 0x2;

/** Put a packed CF_DIB (BITMAPINFOHEADER + bottom-up 32-bit rows) on the clipboard. */
export function copyImage(owner: bigint, dib: Uint8Array): boolean {
  const memory = Kernel32.GlobalAlloc(movable, BigInt(dib.byteLength));
  if (memory === 0n) return false;
  const pointer = Kernel32.GlobalLock(memory);
  if (pointer === null) {
    Kernel32.GlobalFree(memory);
    return false;
  }
  new Uint8Array(toArrayBuffer(pointer, 0, dib.byteLength)).set(dib);
  Kernel32.GlobalUnlock(memory);
  if (!User32.OpenClipboard(owner)) {
    Kernel32.GlobalFree(memory);
    return false;
  }
  User32.EmptyClipboard();
  const placed = User32.SetClipboardData(formatDib, memory) !== 0n;
  User32.CloseClipboard();
  if (!placed) Kernel32.GlobalFree(memory);
  return placed;
}

/** The clipboard's text, or '' when it holds none. */
export function readText(owner: bigint): string {
  if (!User32.OpenClipboard(owner)) return '';
  try {
    const handle = User32.GetClipboardData(formatUnicodeText);
    if (handle === 0n) return '';
    const size = Number(Kernel32.GlobalSize(handle));
    const pointer = Kernel32.GlobalLock(handle);
    if (pointer === null) return '';
    const text = Buffer.from(toArrayBuffer(pointer, 0, size)).toString('utf16le');
    Kernel32.GlobalUnlock(handle);
    return text.replace(/\0.*$/s, '');
  } finally {
    User32.CloseClipboard();
  }
}
