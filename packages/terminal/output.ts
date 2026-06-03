// The shared byte sink. Both surfaces build a frame into one of these: a growable
// output buffer with a run-length SGR pen (a run of same-colour cells emits no
// escape), table-driven decimal emission, and minimal cursor moves. The pen
// persists across frames because the terminal keeps the last colour it was sent.

const stringToBytes = (text: string): Uint8Array => {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index++) bytes[index] = text.charCodeAt(index);
  return bytes;
};

// Decimal byte sequences for 0..255 — avoids the per-cell integer→string + division
// that dominated the colour-emit path.
const decimalBytes: Uint8Array[] = (() => {
  const table: Uint8Array[] = new Array(256);
  for (let value = 0; value < 256; value++) table[value] = stringToBytes(String(value));
  return table;
})();

const BACKGROUND_PALETTE_PREFIX = stringToBytes('\x1b[48;5;');
const BACKGROUND_TRUECOLOR_PARAMS = stringToBytes('48;2;');
const BACKGROUND_TRUECOLOR_PREFIX = stringToBytes('\x1b[48;2;');
const BOLD_OFF = stringToBytes('22');
const BOLD_ON = stringToBytes('1');
const CONTROL_SEQUENCE_INTRODUCER = stringToBytes('\x1b[');
const CURSOR_HOME = stringToBytes('\x1b[H');
const FOREGROUND_PALETTE_PREFIX = stringToBytes('\x1b[38;5;');
const FOREGROUND_TRUECOLOR_PARAMS = stringToBytes('38;2;'); // no CSI prefix — combined with bold
const FOREGROUND_TRUECOLOR_PREFIX = stringToBytes('\x1b[38;2;');
const LETTER_H = 0x48; // H
const LETTER_M = 0x6d; // m
const PALETTE_JOIN = stringToBytes(';48;5;');
const SEMICOLON = 0x3b; // ;
const TRUECOLOR_JOIN = stringToBytes(';48;2;');

export class OutputBuffer {
  #bytes = new Uint8Array(1 << 18);
  #position = 0;

  #digits = new Uint8Array(12);

  #penBackground = -1;
  #penBold = 0;
  #penForeground = -1;

  /** Number of bytes written since the last `reset()`. */
  get length(): number {
    return this.#position;
  }

  /** A view of the written bytes, valid only until the next mutation. */
  view(): Uint8Array {
    return this.#bytes.subarray(0, this.#position);
  }

  /** Rewind to the start of the buffer. Keeps the SGR pen — the terminal's colour persists across frames. */
  reset(): void {
    this.#position = 0;
  }

  /** Forget the SGR pen so the next colour is emitted unconditionally (used on a full repaint). */
  resetPen(): void {
    this.#penForeground = -1;
    this.#penBackground = -1;
    this.#penBold = 0;
  }

  #ensureCapacity(extra: number): void {
    if (this.#position + extra <= this.#bytes.length) return;
    let capacity = this.#bytes.length * 2;
    while (capacity < this.#position + extra) capacity *= 2;
    const grown = new Uint8Array(capacity);
    grown.set(this.#bytes.subarray(0, this.#position));
    this.#bytes = grown;
  }

  putByte(byte: number): void {
    this.#ensureCapacity(1);
    this.#bytes[this.#position++] = byte;
  }

  putBytes(bytes: Uint8Array): void {
    const count = bytes.length;
    this.#ensureCapacity(count);
    const target = this.#bytes;
    let position = this.#position;
    for (let index = 0; index < count; index++) target[position++] = bytes[index];
    this.#position = position;
  }

  putUnsignedInteger(value: number): void {
    if (value < 0) value = 0;
    let length = 0;
    const digits = this.#digits;
    do {
      digits[length++] = 48 + (value % 10);
      value = (value / 10) | 0;
    } while (value > 0);
    this.#ensureCapacity(length);
    const target = this.#bytes;
    let position = this.#position;
    for (let index = length - 1; index >= 0; index--) target[position++] = digits[index];
    this.#position = position;
  }

  /** Append the decimal byte sequence for a colour component (0..255), table-driven. */
  putDecimal(value: number): void {
    this.putBytes(decimalBytes[value]);
  }

  /** Emit `ESC[H` (cursor home). */
  home(): void {
    this.putBytes(CURSOR_HOME);
  }

  /** Emit a cursor move to the 1-based (row, column): `ESC[row;columnH`. */
  moveCursor(row: number, column: number): void {
    this.putBytes(CONTROL_SEQUENCE_INTRODUCER);
    this.putUnsignedInteger(row);
    this.putByte(SEMICOLON);
    this.putUnsignedInteger(column);
    this.putByte(LETTER_H);
  }

  /**
   * Set the truecolour pen to packed-RGB `foreground`/`background`, emitting the
   * minimal SGR. When both differ from the pen they go out as one combined escape
   * (`…38;2;…;48;2;…m`), halving the per-cell escape overhead.
   */
  setTruecolor(foreground: number, background: number): void {
    const needForeground = foreground !== this.#penForeground;
    const needBackground = background !== this.#penBackground;
    if (!needForeground && !needBackground) return;
    if (needForeground) {
      this.putBytes(FOREGROUND_TRUECOLOR_PREFIX);
      this.putDecimal((foreground >> 16) & 0xff);
      this.putByte(SEMICOLON);
      this.putDecimal((foreground >> 8) & 0xff);
      this.putByte(SEMICOLON);
      this.putDecimal(foreground & 0xff);
      if (needBackground) {
        this.putBytes(TRUECOLOR_JOIN);
        this.putDecimal((background >> 16) & 0xff);
        this.putByte(SEMICOLON);
        this.putDecimal((background >> 8) & 0xff);
        this.putByte(SEMICOLON);
        this.putDecimal(background & 0xff);
      }
      this.putByte(LETTER_M);
    } else {
      this.putBytes(BACKGROUND_TRUECOLOR_PREFIX);
      this.putDecimal((background >> 16) & 0xff);
      this.putByte(SEMICOLON);
      this.putDecimal((background >> 8) & 0xff);
      this.putByte(SEMICOLON);
      this.putDecimal(background & 0xff);
      this.putByte(LETTER_M);
    }
    this.#penForeground = foreground;
    this.#penBackground = background;
  }

  /** Set the palette pen to `foreground`/`background` indices (256- or 16-colour), emitting the minimal SGR. */
  setPaletteColor(foreground: number, background: number): void {
    const needForeground = foreground !== this.#penForeground;
    const needBackground = background !== this.#penBackground;
    if (!needForeground && !needBackground) return;
    if (needForeground) {
      this.putBytes(FOREGROUND_PALETTE_PREFIX);
      this.putDecimal(foreground);
      if (needBackground) {
        this.putBytes(PALETTE_JOIN);
        this.putDecimal(background);
      }
      this.putByte(LETTER_M);
    } else {
      this.putBytes(BACKGROUND_PALETTE_PREFIX);
      this.putDecimal(background);
      this.putByte(LETTER_M);
    }
    this.#penForeground = foreground;
    this.#penBackground = background;
  }

  /** Append a single Unicode code point as UTF-8 (1..4 bytes). */
  putCodePoint(codePoint: number): void {
    if (codePoint < 0x80) {
      this.putByte(codePoint);
      return;
    }
    if (codePoint < 0x800) {
      this.#ensureCapacity(2);
      this.#bytes[this.#position++] = 0xc0 | (codePoint >> 6);
      this.#bytes[this.#position++] = 0x80 | (codePoint & 0x3f);
      return;
    }
    if (codePoint < 0x10000) {
      this.#ensureCapacity(3);
      this.#bytes[this.#position++] = 0xe0 | (codePoint >> 12);
      this.#bytes[this.#position++] = 0x80 | ((codePoint >> 6) & 0x3f);
      this.#bytes[this.#position++] = 0x80 | (codePoint & 0x3f);
      return;
    }
    this.#ensureCapacity(4);
    this.#bytes[this.#position++] = 0xf0 | (codePoint >> 18);
    this.#bytes[this.#position++] = 0x80 | ((codePoint >> 12) & 0x3f);
    this.#bytes[this.#position++] = 0x80 | ((codePoint >> 6) & 0x3f);
    this.#bytes[this.#position++] = 0x80 | (codePoint & 0x3f);
  }

  /**
   * Set the truecolour pen with a bold flag, emitting one combined SGR escape
   * containing only the bold / foreground / background parameters that changed.
   */
  setBoldTruecolor(foreground: number, background: number, bold: number): void {
    const needBold = bold !== this.#penBold;
    const needForeground = foreground !== this.#penForeground;
    const needBackground = background !== this.#penBackground;
    if (!needBold && !needForeground && !needBackground) return;
    this.putBytes(CONTROL_SEQUENCE_INTRODUCER);
    let first = true;
    if (needBold) {
      this.putBytes(bold ? BOLD_ON : BOLD_OFF);
      this.#penBold = bold;
      first = false;
    }
    if (needForeground) {
      if (!first) this.putByte(SEMICOLON);
      this.putBytes(FOREGROUND_TRUECOLOR_PARAMS);
      this.putDecimal((foreground >> 16) & 0xff);
      this.putByte(SEMICOLON);
      this.putDecimal((foreground >> 8) & 0xff);
      this.putByte(SEMICOLON);
      this.putDecimal(foreground & 0xff);
      this.#penForeground = foreground;
      first = false;
    }
    if (needBackground) {
      if (!first) this.putByte(SEMICOLON);
      this.putBytes(BACKGROUND_TRUECOLOR_PARAMS);
      this.putDecimal((background >> 16) & 0xff);
      this.putByte(SEMICOLON);
      this.putDecimal((background >> 8) & 0xff);
      this.putByte(SEMICOLON);
      this.putDecimal(background & 0xff);
      this.#penBackground = background;
    }
    this.putByte(LETTER_M);
  }
}
