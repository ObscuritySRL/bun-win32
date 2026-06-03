import { channelDelta, quantizeTo16, quantizeTo256 } from './color';
import { PIXEL_FONT_HEIGHT, PIXEL_FONT_WIDTH, pixelFont } from './font5x7';
import {
  MODE_DIMENSIONS,
  asciiRampBytes,
  brailleBitLayout,
  brailleGlyphs,
  halfBlockGlyph,
  quadrantBitLayout,
  quadrantGlyphs,
  sextantBitLayout,
  sextantGlyphs,
} from './glyphs';
import { OutputBuffer } from './output';
import { encodePNG } from './png';
import { standardOutput } from './stdout';
import type { MouseState, TermDepth, TermDiff, TermMode, TermOptions } from './types';

const ASCII_RAMP_LAST = asciiRampBytes.length - 1;
const SOLID_LUMA_SPAN = 6 * 1000; // luma span below which a multi-mode cell is treated as solid
const SUBPIXEL_CAPACITY = 8; // braille's 2×4 is the largest cell

// Per-cell sub-pixel scratch. buildFrame is synchronous and non-reentrant, so
// module-level scratch is alloc-free and safe to share across surfaces.
const subpixelBlue = new Uint8Array(SUBPIXEL_CAPACITY);
const subpixelGreen = new Uint8Array(SUBPIXEL_CAPACITY);
const subpixelLuma = new Int32Array(SUBPIXEL_CAPACITY);
const subpixelRed = new Uint8Array(SUBPIXEL_CAPACITY);

/**
 * A 24-bit RGB framebuffer rendered to the terminal as Unicode block glyphs. The
 * character grid is fixed at `columns × rows`; the pixel grid `width × height`
 * depends on the mode's sub-cell packing. Write pixels into `pixels`, then
 * `present()` (or `buildFrame()` for headless use).
 *
 * @example
 * const surface = new Term(120, 40, { mode: 'half' });
 * surface.clear();
 * surface.setPixel(0, 0, 255, 0, 0);
 * surface.present();
 */
export class Term {
  /** `width / height`. */
  aspect: number;
  /** Pixel grid height = rows × mode pixel height. Re-derived by `reconfigure()`. */
  height: number;
  /** Row-major RGB framebuffer, length `width × height × 3`. Written directly by callers. */
  pixels: Uint8Array;
  /** Pixel grid width = columns × mode pixel width. Re-derived by `reconfigure()`. */
  width: number;

  readonly columns: number;
  readonly rows: number;

  depth: TermDepth;
  diff: TermDiff;
  mode: TermMode;
  threshold: number;

  /** Pointer state, updated by the app loop when mouse reporting is enabled. Coordinates are pixels. */
  readonly mouse: MouseState = { active: false, down: false, inside: false, sequence: 0, wheel: 0, x: -1, y: -1 };

  #bitLayout: readonly number[] | null = null;
  #glyphTable: Uint8Array[] | null = null;
  #pixelHeight = 2;
  #pixelWidth = 1;
  #subpixelCount = 2;

  #firstFrame = true;
  #output = new OutputBuffer();

  // Per-cell diff cache. For exact/none these hold the last EMITTED key (packed RGB
  // for truecolour, palette index otherwise); for threshold they hold the last-SENT
  // source RGB so accumulated drift stays bounded by `threshold`.
  #previousBackground: Int32Array;
  #previousForeground: Int32Array;
  #previousGlyph: Int32Array;

  constructor(columns: number, rows: number, options?: TermOptions) {
    this.mode = options?.mode ?? 'half';
    this.diff = options?.diff ?? 'exact';
    this.depth = options?.depth ?? 'truecolor';
    this.threshold = options?.threshold ?? 8;
    this.columns = columns;
    this.rows = rows;
    this.#selectMode();
    this.width = columns * this.#pixelWidth;
    this.height = rows * this.#pixelHeight;
    this.aspect = this.width / this.height;
    this.pixels = new Uint8Array(this.width * this.height * 3);
    const cellCount = columns * rows;
    this.#previousForeground = new Int32Array(cellCount).fill(-1);
    this.#previousBackground = new Int32Array(cellCount).fill(-1);
    this.#previousGlyph = new Int32Array(cellCount).fill(-1);
  }

  #selectMode(): void {
    const [pixelWidth, pixelHeight] = MODE_DIMENSIONS[this.mode];
    this.#pixelWidth = pixelWidth;
    this.#pixelHeight = pixelHeight;
    this.#subpixelCount = pixelWidth * pixelHeight;
    switch (this.mode) {
      case 'braille':
        this.#bitLayout = brailleBitLayout;
        this.#glyphTable = brailleGlyphs;
        break;
      case 'quad':
        this.#bitLayout = quadrantBitLayout;
        this.#glyphTable = quadrantGlyphs;
        break;
      case 'sextant':
        this.#bitLayout = sextantBitLayout;
        this.#glyphTable = sextantGlyphs;
        break;
      default:
        this.#bitLayout = null;
        this.#glyphTable = null;
    }
  }

  /**
   * Switch mode / diff / depth / threshold on a live surface. Re-derives the pixel
   * grid (reallocating `pixels` only when width or height changes) and forces a full
   * repaint. The character-cell count is invariant, so the layout never shifts; after
   * a mode change the caller must redraw at the new `width × height`.
   */
  reconfigure(options: TermOptions): void {
    if (options.mode !== undefined) this.mode = options.mode;
    if (options.diff !== undefined) this.diff = options.diff;
    if (options.depth !== undefined) this.depth = options.depth;
    if (options.threshold !== undefined) this.threshold = options.threshold;
    this.#selectMode();
    const width = this.columns * this.#pixelWidth;
    const height = this.rows * this.#pixelHeight;
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.aspect = width / height;
      this.pixels = new Uint8Array(width * height * 3);
    }
    this.invalidate();
  }

  /** Fill the framebuffer with a solid colour. */
  clear(red = 0, green = 0, blue = 0): void {
    const pixels = this.pixels;
    if (red === green && green === blue) {
      pixels.fill(red);
      return;
    }
    for (let index = 0; index < pixels.length; index += 3) {
      pixels[index] = red;
      pixels[index + 1] = green;
      pixels[index + 2] = blue;
    }
  }

  /** Write one pixel, bounds-checked, clamping each channel to 0..255. */
  setPixel(x: number, y: number, red: number, green: number, blue: number): void {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const index = (y * this.width + x) * 3;
    this.pixels[index] = red < 0 ? 0 : red > 255 ? 255 : red;
    this.pixels[index + 1] = green < 0 ? 0 : green > 255 ? 255 : green;
    this.pixels[index + 2] = blue < 0 ? 0 : blue > 255 ? 255 : blue;
  }

  /** Additively blend a colour into one pixel (clamps the high end only). */
  addPixel(x: number, y: number, red: number, green: number, blue: number): void {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const index = (y * this.width + x) * 3;
    const pixels = this.pixels;
    const sumRed = pixels[index] + red;
    const sumGreen = pixels[index + 1] + green;
    const sumBlue = pixels[index + 2] + blue;
    pixels[index] = sumRed > 255 ? 255 : sumRed;
    pixels[index + 1] = sumGreen > 255 ? 255 : sumGreen;
    pixels[index + 2] = sumBlue > 255 ? 255 : sumBlue;
  }

  /** Alpha-over blend a colour into one pixel. `alpha` ≤ 0 is a no-op; ≥ 1 overwrites. */
  blendPixel(x: number, y: number, red: number, green: number, blue: number, alpha: number): void {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height || alpha <= 0) return;
    if (alpha >= 1) return this.setPixel(x, y, red, green, blue);
    const index = (y * this.width + x) * 3;
    const pixels = this.pixels;
    const inverseAlpha = 1 - alpha;
    pixels[index] = (pixels[index] * inverseAlpha + red * alpha) | 0;
    pixels[index + 1] = (pixels[index + 1] * inverseAlpha + green * alpha) | 0;
    pixels[index + 2] = (pixels[index + 2] * inverseAlpha + blue * alpha) | 0;
  }

  /** Darken a rectangle toward black (a HUD backdrop plate). */
  plate(x: number, y: number, width: number, height: number, alpha = 0.55): void {
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) this.blendPixel(x + column, y + row, 0, 0, 0, alpha);
    }
  }

  /** Draw text with the 5×7 font into the framebuffer. Returns the advance width in pixels. */
  text(x: number, y: number, text: string, red: number, green: number, blue: number, scale = 1, shadow = true): number {
    let cursorX = x;
    for (const rawCharacter of text) {
      const character = pixelFont.has(rawCharacter) ? rawCharacter : pixelFont.has(rawCharacter.toUpperCase()) ? rawCharacter.toUpperCase() : ' ';
      const bitmap = pixelFont.get(character)!;
      for (let glyphRow = 0; glyphRow < PIXEL_FONT_HEIGHT; glyphRow++) {
        for (let glyphColumn = 0; glyphColumn < PIXEL_FONT_WIDTH; glyphColumn++) {
          if (!bitmap[glyphRow * PIXEL_FONT_WIDTH + glyphColumn]) continue;
          for (let scaleY = 0; scaleY < scale; scaleY++) {
            for (let scaleX = 0; scaleX < scale; scaleX++) {
              const pixelX = cursorX + glyphColumn * scale + scaleX;
              const pixelY = y + glyphRow * scale + scaleY;
              if (shadow) this.setPixel(pixelX + 1, pixelY + 1, 0, 0, 0);
              this.setPixel(pixelX, pixelY, red, green, blue);
            }
          }
        }
      }
      cursorX += (PIXEL_FONT_WIDTH + 1) * scale;
    }
    return cursorX - x;
  }

  /** Advance width, in pixels, of `text` rendered at `scale`. */
  static textWidth(text: string, scale = 1): number {
    return text.length * (PIXEL_FONT_WIDTH + 1) * scale;
  }

  /** Build the diffed frame into the output buffer (no I/O). Returns the byte length. */
  buildFrame(): number {
    this.#output.reset();
    this.#output.home();
    if (this.mode === 'half') this.#emitHalf();
    else if (this.mode === 'ascii') this.#emitAscii();
    else this.#emitMulti();
    this.#firstFrame = false;
    return this.#output.length;
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

  /** Force the next frame to fully repaint (after a resize or screen disturbance). */
  invalidate(): void {
    this.#firstFrame = true;
    this.#output.resetPen();
    this.#previousForeground.fill(-1);
    this.#previousBackground.fill(-1);
    this.#previousGlyph.fill(-1);
  }

  /** Encode the current framebuffer to a PNG byte array. */
  toPNG(): Uint8Array {
    return encodePNG(this.pixels, this.width, this.height);
  }

  #emitColor(isTruecolor: boolean, foreground: number, background: number): void {
    if (isTruecolor) this.#output.setTruecolor(foreground, background);
    else this.#output.setPaletteColor(foreground, background);
  }

  // Colour-ASCII: average each cell's 1×2 sub-pixels, pick a glyph from the
  // luminance ramp, and tint it with the average colour over a black background.
  #emitAscii(): void {
    const { columns, rows, width } = this;
    const pixels = this.pixels;
    const previousForeground = this.#previousForeground;
    const previousGlyph = this.#previousGlyph;
    const output = this.#output;
    const isFirstFrame = this.#firstFrame;
    const isTruecolor = this.depth === 'truecolor';
    const is256 = this.depth === '256';
    const thresholdLimit = this.diff === 'threshold' ? this.threshold : -1;
    const repaintAll = this.diff === 'none';
    const blackBackground = isTruecolor ? 0 : is256 ? quantizeTo256(0, 0, 0) : quantizeTo16(0, 0, 0);
    let currentRow = 0;
    let currentColumn = 0;
    for (let row = 0; row < rows; row++) {
      const topRowBase = row * 2 * width * 3;
      const bottomRowBase = (row * 2 + 1) * width * 3;
      const cellRowBase = row * columns;
      for (let column = 0; column < columns; column++) {
        const topIndex = topRowBase + column * 3;
        const bottomIndex = bottomRowBase + column * 3;
        const red = (pixels[topIndex] + pixels[bottomIndex]) >> 1;
        const green = (pixels[topIndex + 1] + pixels[bottomIndex + 1]) >> 1;
        const blue = (pixels[topIndex + 2] + pixels[bottomIndex + 2]) >> 1;
        const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
        let rampIndex = ((luminance * ASCII_RAMP_LAST) / 255 + 0.5) | 0;
        if (rampIndex < 0) rampIndex = 0;
        else if (rampIndex > ASCII_RAMP_LAST) rampIndex = ASCII_RAMP_LAST;
        const foregroundRgb = (red << 16) | (green << 8) | blue;
        const emittedForeground = isTruecolor ? foregroundRgb : is256 ? quantizeTo256(red, green, blue) : quantizeTo16(red, green, blue);
        const cellIndex = cellRowBase + column;
        if (!isFirstFrame && !repaintAll) {
          if (thresholdLimit < 0) {
            if (previousGlyph[cellIndex] === rampIndex && previousForeground[cellIndex] === emittedForeground) continue;
            previousForeground[cellIndex] = emittedForeground;
          } else {
            const previous = previousForeground[cellIndex];
            if (previousGlyph[cellIndex] === rampIndex && previous >= 0 && channelDelta(previous, red, green, blue) <= thresholdLimit) continue;
            previousForeground[cellIndex] = foregroundRgb;
          }
        } else if (thresholdLimit < 0) {
          previousForeground[cellIndex] = emittedForeground;
        } else {
          previousForeground[cellIndex] = foregroundRgb;
        }
        previousGlyph[cellIndex] = rampIndex;
        if (currentRow !== row || currentColumn !== column) {
          output.moveCursor(row + 1, column + 1);
          currentRow = row;
          currentColumn = column;
        }
        this.#emitColor(isTruecolor, emittedForeground, blackBackground);
        output.putBytes(asciiRampBytes[rampIndex]);
        currentColumn++;
        if (currentColumn >= columns) currentRow = -1;
      }
    }
  }

  #emitHalf(): void {
    if (this.depth === 'truecolor' && this.diff !== 'threshold') this.#emitHalfFast();
    else this.#emitHalfGeneral();
  }

  // Hottest path: half-block, truecolour, exact (or none) diff.
  #emitHalfFast(): void {
    const { columns, rows, width } = this;
    const pixels = this.pixels;
    const previousForeground = this.#previousForeground;
    const previousBackground = this.#previousBackground;
    const output = this.#output;
    const skipUnchanged = !this.#firstFrame && this.diff !== 'none';
    let currentRow = 0;
    let currentColumn = 0;
    for (let row = 0; row < rows; row++) {
      const topRowBase = row * 2 * width * 3;
      const bottomRowBase = (row * 2 + 1) * width * 3;
      const cellRowBase = row * columns;
      for (let column = 0; column < columns; column++) {
        const topIndex = topRowBase + column * 3;
        const bottomIndex = bottomRowBase + column * 3;
        const foregroundKey = (pixels[topIndex] << 16) | (pixels[topIndex + 1] << 8) | pixels[topIndex + 2];
        const backgroundKey = (pixels[bottomIndex] << 16) | (pixels[bottomIndex + 1] << 8) | pixels[bottomIndex + 2];
        const cellIndex = cellRowBase + column;
        if (skipUnchanged && previousForeground[cellIndex] === foregroundKey && previousBackground[cellIndex] === backgroundKey) continue;
        previousForeground[cellIndex] = foregroundKey;
        previousBackground[cellIndex] = backgroundKey;
        if (currentRow !== row || currentColumn !== column) {
          output.moveCursor(row + 1, column + 1);
          currentRow = row;
          currentColumn = column;
        }
        output.setTruecolor(foregroundKey, backgroundKey);
        output.putBytes(halfBlockGlyph);
        currentColumn++;
        if (currentColumn >= columns) currentRow = -1;
      }
    }
  }

  // General half-block path: palette depths and/or threshold diffing.
  #emitHalfGeneral(): void {
    const { columns, rows, width } = this;
    const pixels = this.pixels;
    const previousForeground = this.#previousForeground;
    const previousBackground = this.#previousBackground;
    const output = this.#output;
    const isFirstFrame = this.#firstFrame;
    const isTruecolor = this.depth === 'truecolor';
    const is256 = this.depth === '256';
    const thresholdLimit = this.diff === 'threshold' ? this.threshold : -1;
    const repaintAll = this.diff === 'none';
    let currentRow = 0;
    let currentColumn = 0;
    for (let row = 0; row < rows; row++) {
      const topRowBase = row * 2 * width * 3;
      const bottomRowBase = (row * 2 + 1) * width * 3;
      const cellRowBase = row * columns;
      for (let column = 0; column < columns; column++) {
        const topIndex = topRowBase + column * 3;
        const bottomIndex = bottomRowBase + column * 3;
        const topRed = pixels[topIndex];
        const topGreen = pixels[topIndex + 1];
        const topBlue = pixels[topIndex + 2];
        const bottomRed = pixels[bottomIndex];
        const bottomGreen = pixels[bottomIndex + 1];
        const bottomBlue = pixels[bottomIndex + 2];
        const foregroundRgb = (topRed << 16) | (topGreen << 8) | topBlue;
        const backgroundRgb = (bottomRed << 16) | (bottomGreen << 8) | bottomBlue;
        const emittedForeground = isTruecolor ? foregroundRgb : is256 ? quantizeTo256(topRed, topGreen, topBlue) : quantizeTo16(topRed, topGreen, topBlue);
        const emittedBackground = isTruecolor ? backgroundRgb : is256 ? quantizeTo256(bottomRed, bottomGreen, bottomBlue) : quantizeTo16(bottomRed, bottomGreen, bottomBlue);
        const cellIndex = cellRowBase + column;
        if (!isFirstFrame && !repaintAll) {
          if (thresholdLimit < 0) {
            if (previousForeground[cellIndex] === emittedForeground && previousBackground[cellIndex] === emittedBackground) continue;
            previousForeground[cellIndex] = emittedForeground;
            previousBackground[cellIndex] = emittedBackground;
          } else {
            const previousForegroundRgb = previousForeground[cellIndex];
            const previousBackgroundRgb = previousBackground[cellIndex];
            if (
              previousForegroundRgb >= 0 &&
              previousBackgroundRgb >= 0 &&
              channelDelta(previousForegroundRgb, topRed, topGreen, topBlue) <= thresholdLimit &&
              channelDelta(previousBackgroundRgb, bottomRed, bottomGreen, bottomBlue) <= thresholdLimit
            )
              continue;
            previousForeground[cellIndex] = foregroundRgb;
            previousBackground[cellIndex] = backgroundRgb;
          }
        } else if (thresholdLimit < 0) {
          previousForeground[cellIndex] = emittedForeground;
          previousBackground[cellIndex] = emittedBackground;
        } else {
          previousForeground[cellIndex] = foregroundRgb;
          previousBackground[cellIndex] = backgroundRgb;
        }
        if (currentRow !== row || currentColumn !== column) {
          output.moveCursor(row + 1, column + 1);
          currentRow = row;
          currentColumn = column;
        }
        this.#emitColor(isTruecolor, emittedForeground, emittedBackground);
        output.putBytes(halfBlockGlyph);
        currentColumn++;
        if (currentColumn >= columns) currentRow = -1;
      }
    }
  }

  // quad/sextant/braille: gather the cell's sub-pixels, split them into a bright
  // (foreground) and dark (background) group at the mid-luma, average each group,
  // and pick the glyph whose lit sub-cells match the bright group.
  #emitMulti(): void {
    const { columns, rows, width } = this;
    const pixels = this.pixels;
    const pixelWidth = this.#pixelWidth;
    const pixelHeight = this.#pixelHeight;
    const subpixelCount = this.#subpixelCount;
    const previousForeground = this.#previousForeground;
    const previousBackground = this.#previousBackground;
    const previousGlyph = this.#previousGlyph;
    const bitLayout = this.#bitLayout!;
    const glyphTable = this.#glyphTable!;
    const output = this.#output;
    const isFirstFrame = this.#firstFrame;
    const isTruecolor = this.depth === 'truecolor';
    const is256 = this.depth === '256';
    const thresholdLimit = this.diff === 'threshold' ? this.threshold : -1;
    const repaintAll = this.diff === 'none';
    let currentRow = 0;
    let currentColumn = 0;
    for (let row = 0; row < rows; row++) {
      const cellRowBase = row * columns;
      const pixelRowBase = row * pixelHeight;
      for (let column = 0; column < columns; column++) {
        const pixelColumnBase = column * pixelWidth;
        let minimumLuma = 0x7fffffff;
        let maximumLuma = -1;
        for (let subRow = 0; subRow < pixelHeight; subRow++) {
          const rowOffset = ((pixelRowBase + subRow) * width + pixelColumnBase) * 3;
          for (let subColumn = 0; subColumn < pixelWidth; subColumn++) {
            const offset = rowOffset + subColumn * 3;
            const subRed = pixels[offset];
            const subGreen = pixels[offset + 1];
            const subBlue = pixels[offset + 2];
            const subIndex = subRow * pixelWidth + subColumn;
            subpixelRed[subIndex] = subRed;
            subpixelGreen[subIndex] = subGreen;
            subpixelBlue[subIndex] = subBlue;
            const luma = subRed * 299 + subGreen * 587 + subBlue * 114;
            subpixelLuma[subIndex] = luma;
            if (luma < minimumLuma) minimumLuma = luma;
            if (luma > maximumLuma) maximumLuma = luma;
          }
        }
        let foregroundRed: number;
        let foregroundGreen: number;
        let foregroundBlue: number;
        let backgroundRed: number;
        let backgroundGreen: number;
        let backgroundBlue: number;
        let glyphMask: number;
        if (maximumLuma - minimumLuma < SOLID_LUMA_SPAN) {
          let sumRed = 0;
          let sumGreen = 0;
          let sumBlue = 0;
          for (let subIndex = 0; subIndex < subpixelCount; subIndex++) {
            sumRed += subpixelRed[subIndex];
            sumGreen += subpixelGreen[subIndex];
            sumBlue += subpixelBlue[subIndex];
          }
          foregroundRed = backgroundRed = (sumRed / subpixelCount) | 0;
          foregroundGreen = backgroundGreen = (sumGreen / subpixelCount) | 0;
          foregroundBlue = backgroundBlue = (sumBlue / subpixelCount) | 0;
          glyphMask = 0;
        } else {
          const midLuma = (minimumLuma + maximumLuma) >> 1;
          let brightRed = 0;
          let brightGreen = 0;
          let brightBlue = 0;
          let brightCount = 0;
          let darkRed = 0;
          let darkGreen = 0;
          let darkBlue = 0;
          let darkCount = 0;
          glyphMask = 0;
          for (let subIndex = 0; subIndex < subpixelCount; subIndex++) {
            if (subpixelLuma[subIndex] >= midLuma) {
              brightRed += subpixelRed[subIndex];
              brightGreen += subpixelGreen[subIndex];
              brightBlue += subpixelBlue[subIndex];
              brightCount++;
              glyphMask |= 1 << bitLayout[subIndex];
            } else {
              darkRed += subpixelRed[subIndex];
              darkGreen += subpixelGreen[subIndex];
              darkBlue += subpixelBlue[subIndex];
              darkCount++;
            }
          }
          foregroundRed = (brightRed / brightCount) | 0;
          foregroundGreen = (brightGreen / brightCount) | 0;
          foregroundBlue = (brightBlue / brightCount) | 0;
          backgroundRed = (darkRed / darkCount) | 0;
          backgroundGreen = (darkGreen / darkCount) | 0;
          backgroundBlue = (darkBlue / darkCount) | 0;
        }
        const foregroundRgb = (foregroundRed << 16) | (foregroundGreen << 8) | foregroundBlue;
        const backgroundRgb = (backgroundRed << 16) | (backgroundGreen << 8) | backgroundBlue;
        const emittedForeground = isTruecolor ? foregroundRgb : is256 ? quantizeTo256(foregroundRed, foregroundGreen, foregroundBlue) : quantizeTo16(foregroundRed, foregroundGreen, foregroundBlue);
        const emittedBackground = isTruecolor ? backgroundRgb : is256 ? quantizeTo256(backgroundRed, backgroundGreen, backgroundBlue) : quantizeTo16(backgroundRed, backgroundGreen, backgroundBlue);
        const cellIndex = cellRowBase + column;
        if (!isFirstFrame && !repaintAll) {
          if (thresholdLimit < 0) {
            if (previousGlyph[cellIndex] === glyphMask && previousForeground[cellIndex] === emittedForeground && previousBackground[cellIndex] === emittedBackground) continue;
            previousForeground[cellIndex] = emittedForeground;
            previousBackground[cellIndex] = emittedBackground;
          } else {
            const previousForegroundRgb = previousForeground[cellIndex];
            const previousBackgroundRgb = previousBackground[cellIndex];
            if (
              previousGlyph[cellIndex] === glyphMask &&
              previousForegroundRgb >= 0 &&
              previousBackgroundRgb >= 0 &&
              channelDelta(previousForegroundRgb, foregroundRed, foregroundGreen, foregroundBlue) <= thresholdLimit &&
              channelDelta(previousBackgroundRgb, backgroundRed, backgroundGreen, backgroundBlue) <= thresholdLimit
            )
              continue;
            previousForeground[cellIndex] = foregroundRgb;
            previousBackground[cellIndex] = backgroundRgb;
          }
        } else if (thresholdLimit < 0) {
          previousForeground[cellIndex] = emittedForeground;
          previousBackground[cellIndex] = emittedBackground;
        } else {
          previousForeground[cellIndex] = foregroundRgb;
          previousBackground[cellIndex] = backgroundRgb;
        }
        previousGlyph[cellIndex] = glyphMask;
        if (currentRow !== row || currentColumn !== column) {
          output.moveCursor(row + 1, column + 1);
          currentRow = row;
          currentColumn = column;
        }
        this.#emitColor(isTruecolor, emittedForeground, emittedBackground);
        output.putBytes(glyphTable[glyphMask]);
        currentColumn++;
        if (currentColumn >= columns) currentRow = -1;
      }
    }
  }
}
