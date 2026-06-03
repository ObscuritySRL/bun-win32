import { BOX } from './boxdrawing';
import type { BoxStyle } from './boxdrawing';
import { CHAR_FONT_HEIGHT, CHAR_FONT_WIDTH, charFont } from './font6x10';
import { OutputBuffer } from './output';
import { encodePNG } from './png';
import { standardOutput } from './stdout';
import type { MouseState, RGB } from './types';

const SPACE_CODE_POINT = 0x20;
const DEFAULT_FOREGROUND = 0xc8c8d0;

const clampChannel = (value: number): number => (value < 0 ? 0 : value > 255 ? 255 : value) | 0;

/** Pack three 0..255 channels into a single 24-bit key (also the per-cell diff key). */
const packRgb = (red: number, green: number, blue: number): number =>
  (clampChannel(red) << 16) | (clampChannel(green) << 8) | clampChannel(blue);

/**
 * A character-cell grid for terminal user interfaces. Each cell carries a code
 * point, foreground and background colours, and a bold flag. Draw with the cell
 * primitives, then `present()` (or `buildFrame()` for headless use).
 *
 * @example
 * const surface = new CharTerm(80, 24);
 * surface.clear();
 * surface.box(0, 0, 20, 5, 'rounded', [200, 200, 210]);
 * surface.text(2, 2, 'Hello', [255, 255, 255]);
 * surface.present();
 */
export class CharTerm {
  /** `columns / rows` (a grid ratio; cell aspect is not applied). */
  readonly aspect: number;
  readonly columns: number;
  readonly rows: number;

  /** Per-cell packed-RGB background. */
  readonly background: Int32Array;
  /** Per-cell bold flag (0 or 1). */
  readonly bold: Uint8Array;
  /** Per-cell code point. Written directly by callers that bypass the draw primitives. */
  readonly characters: Int32Array;
  /** Per-cell packed-RGB foreground. */
  readonly foreground: Int32Array;

  /** Pointer state, updated by the app loop when mouse reporting is enabled. Coordinates are cells. */
  readonly mouse: MouseState = { active: false, down: false, inside: false, sequence: 0, wheel: 0, x: -1, y: -1 };

  #firstFrame = true;
  #output = new OutputBuffer();

  #previousBackground: Int32Array;
  #previousBold: Uint8Array;
  #previousCharacters: Int32Array;
  #previousForeground: Int32Array;

  constructor(columns: number, rows: number) {
    this.columns = columns;
    this.rows = rows;
    this.aspect = columns / rows;
    const cellCount = columns * rows;
    this.characters = new Int32Array(cellCount).fill(SPACE_CODE_POINT);
    this.foreground = new Int32Array(cellCount).fill(DEFAULT_FOREGROUND);
    this.background = new Int32Array(cellCount);
    this.bold = new Uint8Array(cellCount);
    this.#previousCharacters = new Int32Array(cellCount).fill(-1);
    this.#previousForeground = new Int32Array(cellCount).fill(-1);
    this.#previousBackground = new Int32Array(cellCount).fill(-1);
    this.#previousBold = new Uint8Array(cellCount).fill(255);
  }

  #inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
  }

  /** Reset every cell to a space with the default foreground over the given background. */
  clear(backgroundRed = 0, backgroundGreen = 0, backgroundBlue = 0): void {
    this.characters.fill(SPACE_CODE_POINT);
    this.foreground.fill(DEFAULT_FOREGROUND);
    this.background.fill(packRgb(backgroundRed, backgroundGreen, backgroundBlue));
    this.bold.fill(0);
  }

  /** Place one glyph. `glyph` is a string (first code point used) or a code point. */
  put(x: number, y: number, glyph: string | number, foreground: RGB, background?: RGB, bold = false): void {
    x |= 0;
    y |= 0;
    if (!this.#inBounds(x, y)) return;
    const cellIndex = y * this.columns + x;
    this.characters[cellIndex] = typeof glyph === 'number' ? glyph : glyph.codePointAt(0) ?? SPACE_CODE_POINT;
    this.foreground[cellIndex] = packRgb(foreground[0], foreground[1], foreground[2]);
    if (background) this.background[cellIndex] = packRgb(background[0], background[1], background[2]);
    this.bold[cellIndex] = bold ? 1 : 0;
  }

  /** Write a string left to right from (x, y), one cell per code point. */
  text(x: number, y: number, text: string, foreground: RGB, background?: RGB, bold = false): void {
    x |= 0;
    y |= 0;
    if (y < 0 || y >= this.rows) return;
    const packedForeground = packRgb(foreground[0], foreground[1], foreground[2]);
    const hasBackground = background !== undefined;
    const packedBackground = hasBackground ? packRgb(background[0], background[1], background[2]) : 0;
    const boldFlag = bold ? 1 : 0;
    const columns = this.columns;
    let column = x;
    for (const character of text) {
      if (column >= 0 && column < columns) {
        const cellIndex = y * columns + column;
        this.characters[cellIndex] = character.codePointAt(0) ?? SPACE_CODE_POINT;
        this.foreground[cellIndex] = packedForeground;
        if (hasBackground) this.background[cellIndex] = packedBackground;
        this.bold[cellIndex] = boldFlag;
      }
      column++;
    }
  }

  /** Fill a rectangle's background and clear its glyphs to spaces. */
  fillRect(x: number, y: number, width: number, height: number, background: RGB): void {
    const packedBackground = packRgb(background[0], background[1], background[2]);
    const startColumn = Math.max(0, x | 0);
    const startRow = Math.max(0, y | 0);
    const endColumn = Math.min(this.columns, (x | 0) + (width | 0));
    const endRow = Math.min(this.rows, (y | 0) + (height | 0));
    const columns = this.columns;
    for (let row = startRow; row < endRow; row++) {
      let cellIndex = row * columns + startColumn;
      for (let column = startColumn; column < endColumn; column++, cellIndex++) {
        this.characters[cellIndex] = SPACE_CODE_POINT;
        this.background[cellIndex] = packedBackground;
      }
    }
  }

  /** Blend a rectangle's background toward a colour (alpha 0..1), keeping the glyphs. */
  shadeRect(x: number, y: number, width: number, height: number, red: number, green: number, blue: number, alpha: number): void {
    if (alpha <= 0) return;
    const inverseAlpha = alpha >= 1 ? 0 : 1 - alpha;
    const startColumn = Math.max(0, x | 0);
    const startRow = Math.max(0, y | 0);
    const endColumn = Math.min(this.columns, (x | 0) + (width | 0));
    const endRow = Math.min(this.rows, (y | 0) + (height | 0));
    const columns = this.columns;
    const background = this.background;
    for (let row = startRow; row < endRow; row++) {
      let cellIndex = row * columns + startColumn;
      for (let column = startColumn; column < endColumn; column++, cellIndex++) {
        const current = background[cellIndex];
        const blendedRed = ((current >> 16) & 0xff) * inverseAlpha + red * alpha;
        const blendedGreen = ((current >> 8) & 0xff) * inverseAlpha + green * alpha;
        const blendedBlue = (current & 0xff) * inverseAlpha + blue * alpha;
        background[cellIndex] = packRgb(blendedRed, blendedGreen, blendedBlue);
      }
    }
  }

  /** Draw a horizontal run of one glyph. */
  hline(x: number, y: number, width: number, glyph: string, foreground: RGB, background?: RGB): void {
    const codePoint = glyph.codePointAt(0) ?? SPACE_CODE_POINT;
    for (let offset = 0; offset < width; offset++) this.put(x + offset, y, codePoint, foreground, background);
  }

  /** Draw a vertical run of one glyph. */
  vline(x: number, y: number, height: number, glyph: string, foreground: RGB, background?: RGB): void {
    const codePoint = glyph.codePointAt(0) ?? SPACE_CODE_POINT;
    for (let offset = 0; offset < height; offset++) this.put(x, y + offset, codePoint, foreground, background);
  }

  /** Draw a box outline. `width`/`height` are the full outer extent (≥ 2). */
  box(x: number, y: number, width: number, height: number, style: BoxStyle, foreground: RGB, background?: RGB): void {
    if (width < 2 || height < 2) return;
    const characters = BOX[style];
    const rightColumn = x + width - 1;
    const bottomRow = y + height - 1;
    this.put(x, y, characters.tl, foreground, background);
    this.put(rightColumn, y, characters.tr, foreground, background);
    this.put(x, bottomRow, characters.bl, foreground, background);
    this.put(rightColumn, bottomRow, characters.br, foreground, background);
    for (let column = x + 1; column < rightColumn; column++) {
      this.put(column, y, characters.h, foreground, background);
      this.put(column, bottomRow, characters.h, foreground, background);
    }
    for (let row = y + 1; row < bottomRow; row++) {
      this.put(x, row, characters.v, foreground, background);
      this.put(rightColumn, row, characters.v, foreground, background);
    }
  }

  /** Build the diffed frame into the output buffer (no I/O). Returns the byte length. */
  buildFrame(): number {
    const { columns, rows } = this;
    const characters = this.characters;
    const foreground = this.foreground;
    const background = this.background;
    const bold = this.bold;
    const previousCharacters = this.#previousCharacters;
    const previousForeground = this.#previousForeground;
    const previousBackground = this.#previousBackground;
    const previousBold = this.#previousBold;
    const output = this.#output;
    output.reset();
    output.home();
    const isFirstFrame = this.#firstFrame;
    let currentRow = -1;
    let currentColumn = -1;
    for (let row = 0; row < rows; row++) {
      const rowBase = row * columns;
      for (let column = 0; column < columns; column++) {
        const cellIndex = rowBase + column;
        const cellCharacter = characters[cellIndex];
        const cellForeground = foreground[cellIndex];
        const cellBackground = background[cellIndex];
        const cellBold = bold[cellIndex];
        if (
          !isFirstFrame &&
          previousCharacters[cellIndex] === cellCharacter &&
          previousForeground[cellIndex] === cellForeground &&
          previousBackground[cellIndex] === cellBackground &&
          previousBold[cellIndex] === cellBold
        )
          continue;
        previousCharacters[cellIndex] = cellCharacter;
        previousForeground[cellIndex] = cellForeground;
        previousBackground[cellIndex] = cellBackground;
        previousBold[cellIndex] = cellBold;
        if (currentRow !== row || currentColumn !== column) {
          output.moveCursor(row + 1, column + 1);
          currentRow = row;
          currentColumn = column;
        }
        output.setBoldTruecolor(cellForeground, cellBackground, cellBold);
        output.putCodePoint(cellCharacter === 0 ? SPACE_CODE_POINT : cellCharacter);
        currentColumn++;
        if (currentColumn >= columns) {
          currentColumn = -1;
          currentRow = -1;
        }
      }
    }
    this.#firstFrame = false;
    return output.length;
  }

  /** The bytes from the most recent `buildFrame()`, as a view valid until the next build. */
  frameBytes(): Uint8Array {
    return this.#output.view();
  }

  /** Build and flush the frame to the terminal in one write. */
  present(): void {
    this.buildFrame();
    standardOutput.write(this.#output.view());
    standardOutput.flush();
  }

  /** Force the next frame to fully repaint. */
  invalidate(): void {
    this.#firstFrame = true;
    this.#output.resetPen();
  }

  /** Rasterise the cell grid to a tightly packed RGB image (`cellWidth × cellHeight` per cell). */
  rasterize(cellWidth = CHAR_FONT_WIDTH + 1, cellHeight = CHAR_FONT_HEIGHT + 1): { height: number; pixels: Uint8Array; width: number } {
    const width = this.columns * cellWidth;
    const height = this.rows * cellHeight;
    const pixels = new Uint8Array(width * height * 3);
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        const cellIndex = row * this.columns + column;
        const cellBackground = this.background[cellIndex];
        const backgroundRed = (cellBackground >> 16) & 0xff;
        const backgroundGreen = (cellBackground >> 8) & 0xff;
        const backgroundBlue = cellBackground & 0xff;
        const cellPixelX = column * cellWidth;
        const cellPixelY = row * cellHeight;
        for (let pixelRow = 0; pixelRow < cellHeight; pixelRow++) {
          let offset = ((cellPixelY + pixelRow) * width + cellPixelX) * 3;
          for (let pixelColumn = 0; pixelColumn < cellWidth; pixelColumn++) {
            pixels[offset] = backgroundRed;
            pixels[offset + 1] = backgroundGreen;
            pixels[offset + 2] = backgroundBlue;
            offset += 3;
          }
        }
      }
    }
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        const cellIndex = row * this.columns + column;
        const codePoint = this.characters[cellIndex];
        if (codePoint === SPACE_CODE_POINT || codePoint === 0) continue;
        const cellForeground = this.foreground[cellIndex];
        const foregroundRed = (cellForeground >> 16) & 0xff;
        const foregroundGreen = (cellForeground >> 8) & 0xff;
        const foregroundBlue = cellForeground & 0xff;
        this.#rasterGlyph(pixels, width, column * cellWidth, row * cellHeight, cellWidth, cellHeight, codePoint, foregroundRed, foregroundGreen, foregroundBlue);
      }
    }
    return { height, pixels, width };
  }

  // Rasterise one glyph into the image. Block / shade / box-drawing glyphs are drawn
  // procedurally by code point; ASCII / Latin come from the bitmap font.
  #rasterGlyph(
    pixels: Uint8Array,
    imageWidth: number,
    cellPixelX: number,
    cellPixelY: number,
    cellWidth: number,
    cellHeight: number,
    codePoint: number,
    foregroundRed: number,
    foregroundGreen: number,
    foregroundBlue: number,
  ): void {
    const setAlpha = (x: number, y: number, alpha: number): void => {
      if (alpha <= 0 || x < 0 || y < 0 || x >= imageWidth) return;
      const offset = (y * imageWidth + x) * 3;
      if (alpha >= 1) {
        pixels[offset] = foregroundRed;
        pixels[offset + 1] = foregroundGreen;
        pixels[offset + 2] = foregroundBlue;
      } else {
        const inverseAlpha = 1 - alpha;
        pixels[offset] = (pixels[offset] * inverseAlpha + foregroundRed * alpha) | 0;
        pixels[offset + 1] = (pixels[offset + 1] * inverseAlpha + foregroundGreen * alpha) | 0;
        pixels[offset + 2] = (pixels[offset + 2] * inverseAlpha + foregroundBlue * alpha) | 0;
      }
    };
    const fillArea = (startX: number, startY: number, endX: number, endY: number, alpha: number): void => {
      for (let y = startY; y < endY; y++) for (let x = startX; x < endX; x++) setAlpha(cellPixelX + x, cellPixelY + y, alpha);
    };

    switch (codePoint) {
      case 0x2588: // █ full block
        fillArea(0, 0, cellWidth, cellHeight, 1);
        return;
      case 0x2580: // ▀ upper half
        fillArea(0, 0, cellWidth, cellHeight >> 1, 1);
        return;
      case 0x2584: // ▄ lower half
        fillArea(0, cellHeight >> 1, cellWidth, cellHeight, 1);
        return;
      case 0x258c: // ▌ left half
        fillArea(0, 0, cellWidth >> 1, cellHeight, 1);
        return;
      case 0x2590: // ▐ right half
        fillArea(cellWidth >> 1, 0, cellWidth, cellHeight, 1);
        return;
      case 0x2591: // ░ light shade
        fillArea(0, 0, cellWidth, cellHeight, 0.25);
        return;
      case 0x2592: // ▒ medium shade
        fillArea(0, 0, cellWidth, cellHeight, 0.5);
        return;
      case 0x2593: // ▓ dark shade
        fillArea(0, 0, cellWidth, cellHeight, 0.75);
        return;
      case 0x2022: // • bullet
        fillArea((cellWidth >> 1) - 1, (cellHeight >> 1) - 1, (cellWidth >> 1) + 1, (cellHeight >> 1) + 1, 1);
        return;
    }

    const centerX = cellWidth >> 1;
    const centerY = cellHeight >> 1;
    const drawHorizontalBar = (alpha: number): void => {
      for (let x = 0; x < cellWidth; x++) setAlpha(cellPixelX + x, cellPixelY + centerY, alpha);
    };
    const drawVerticalBar = (alpha: number): void => {
      for (let y = 0; y < cellHeight; y++) setAlpha(cellPixelX + centerX, cellPixelY + y, alpha);
    };
    const drawHalfBarLeft = (alpha: number): void => {
      for (let x = 0; x <= centerX; x++) setAlpha(cellPixelX + x, cellPixelY + centerY, alpha);
    };
    const drawHalfBarRight = (alpha: number): void => {
      for (let x = centerX; x < cellWidth; x++) setAlpha(cellPixelX + x, cellPixelY + centerY, alpha);
    };
    const drawHalfBarUp = (alpha: number): void => {
      for (let y = 0; y <= centerY; y++) setAlpha(cellPixelX + centerX, cellPixelY + y, alpha);
    };
    const drawHalfBarDown = (alpha: number): void => {
      for (let y = centerY; y < cellHeight; y++) setAlpha(cellPixelX + centerX, cellPixelY + y, alpha);
    };
    switch (codePoint) {
      case 0x2500: // ─
      case 0x2550: // ═
        drawHorizontalBar(1);
        return;
      case 0x2502: // │
      case 0x2551: // ║
        drawVerticalBar(1);
        return;
      case 0x250c: // ┌
      case 0x2554: // ╔
      case 0x256d: // ╭
        drawHalfBarRight(1);
        drawHalfBarDown(1);
        return;
      case 0x2510: // ┐
      case 0x2557: // ╗
      case 0x256e: // ╮
        drawHalfBarLeft(1);
        drawHalfBarDown(1);
        return;
      case 0x2514: // └
      case 0x255a: // ╚
      case 0x2570: // ╰
        drawHalfBarRight(1);
        drawHalfBarUp(1);
        return;
      case 0x2518: // ┘
      case 0x255d: // ╝
      case 0x256f: // ╯
        drawHalfBarLeft(1);
        drawHalfBarUp(1);
        return;
      case 0x251c: // ├
      case 0x2560: // ╠
        drawVerticalBar(1);
        drawHalfBarRight(1);
        return;
      case 0x2524: // ┤
      case 0x2563: // ╣
        drawVerticalBar(1);
        drawHalfBarLeft(1);
        return;
      case 0x252c: // ┬
      case 0x2566: // ╦
        drawHorizontalBar(1);
        drawHalfBarDown(1);
        return;
      case 0x2534: // ┴
      case 0x2569: // ╩
        drawHorizontalBar(1);
        drawHalfBarUp(1);
        return;
      case 0x253c: // ┼
      case 0x256c: // ╬
        drawHorizontalBar(1);
        drawVerticalBar(1);
        return;
    }

    const bitmap = charFont.get(codePoint);
    if (!bitmap) {
      fillArea(centerX - 1, centerY - 1, centerX + 1, centerY + 1, 0.6);
      return;
    }
    const offsetX = (cellWidth - CHAR_FONT_WIDTH) >> 1;
    const offsetY = (cellHeight - CHAR_FONT_HEIGHT) >> 1;
    for (let glyphRow = 0; glyphRow < CHAR_FONT_HEIGHT; glyphRow++) {
      for (let glyphColumn = 0; glyphColumn < CHAR_FONT_WIDTH; glyphColumn++) {
        if (bitmap[glyphRow * CHAR_FONT_WIDTH + glyphColumn]) setAlpha(cellPixelX + offsetX + glyphColumn, cellPixelY + offsetY + glyphRow, 1);
      }
    }
  }

  /** Encode the current grid to a PNG byte array. */
  toPNG(): Uint8Array {
    const { height, pixels, width } = this.rasterize();
    return encodePNG(pixels, width, height);
  }
}
