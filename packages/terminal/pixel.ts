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
import { SYNCHRONIZED_OUTPUT_BEGIN, SYNCHRONIZED_OUTPUT_END, standardOutput } from './stdout';
import type { MouseState, PresentOptions, TermDepth, TermDiff, TermMode, TermOptions } from './types';

const { abs, max, min } = Math;
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

  #bitLayout: Uint8Array | null = null;
  #glyphTable: Uint8Array[] | null = null;
  #pixelHeight = 2;
  #pixelWidth = 1;
  #subpixelCount = 2;

  #clipBottom = 0;
  #clipLeft = 0;
  #clipRight = 0;
  #clipTop = 0;

  #firstFrame = true;
  #output = new OutputBuffer();

  // Per-cell diff cache. For exact/none these hold the last EMITTED key (packed RGB
  // for truecolour, palette index otherwise); for threshold they hold the last-SENT
  // source RGB so accumulated drift stays bounded by `threshold`.
  #previousBackground: Int32Array;
  #previousForeground: Int32Array;
  #previousGlyph: Int32Array;

  constructor(columns: number, rows: number, options?: TermOptions) {
    this.columns = columns;
    this.rows = rows;
    this.depth = options?.depth ?? 'truecolor';
    this.diff = options?.diff ?? 'exact';
    this.mode = options?.mode ?? 'half';
    this.threshold = options?.threshold ?? 8;
    this.#selectMode();
    this.height = rows * this.#pixelHeight;
    this.width = columns * this.#pixelWidth;
    this.aspect = this.width / this.height;
    this.pixels = new Uint8Array(this.width * this.height * 3);
    this.noClip();
    const cellCount = columns * rows;
    this.#previousBackground = new Int32Array(cellCount).fill(-1);
    this.#previousForeground = new Int32Array(cellCount).fill(-1);
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
    this.noClip();
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

  /** Restrict `line`/`rect`/`fillRect`/`circle`/`fillCircle`/`blit` to a sub-rectangle (clamped to the framebuffer). */
  clip(x: number, y: number, width: number, height: number): void {
    this.#clipBottom = min(this.height, (y | 0) + (height | 0));
    this.#clipLeft = max(0, x | 0);
    this.#clipRight = min(this.width, (x | 0) + (width | 0));
    this.#clipTop = max(0, y | 0);
  }

  /** Remove the clip rectangle (draw to the whole framebuffer). */
  noClip(): void {
    this.#clipBottom = this.height;
    this.#clipLeft = 0;
    this.#clipRight = this.width;
    this.#clipTop = 0;
  }

  #plot(x: number, y: number, red: number, green: number, blue: number): void {
    if (x < this.#clipLeft || y < this.#clipTop || x >= this.#clipRight || y >= this.#clipBottom) return;
    const index = (y * this.width + x) * 3;
    this.pixels[index] = red < 0 ? 0 : red > 255 ? 255 : red;
    this.pixels[index + 1] = green < 0 ? 0 : green > 255 ? 255 : green;
    this.pixels[index + 2] = blue < 0 ? 0 : blue > 255 ? 255 : blue;
  }

  /** Draw a 1px line with a Bresenham trace (respects the clip rectangle). */
  line(startX: number, startY: number, endX: number, endY: number, red: number, green: number, blue: number): void {
    let x = startX | 0;
    let y = startY | 0;
    const targetX = endX | 0;
    const targetY = endY | 0;
    const deltaX = abs(targetX - x);
    const deltaY = -abs(targetY - y);
    const stepX = x < targetX ? 1 : -1;
    const stepY = y < targetY ? 1 : -1;
    let error = deltaX + deltaY;
    for (;;) {
      this.#plot(x, y, red, green, blue);
      if (x === targetX && y === targetY) break;
      const doubleError = error * 2;
      if (doubleError >= deltaY) {
        error += deltaY;
        x += stepX;
      }
      if (doubleError <= deltaX) {
        error += deltaX;
        y += stepY;
      }
    }
  }

  /** Draw a rectangle outline (respects the clip rectangle). */
  rect(x: number, y: number, width: number, height: number, red: number, green: number, blue: number): void {
    const right = (x | 0) + (width | 0) - 1;
    const bottom = (y | 0) + (height | 0) - 1;
    this.line(x, y, right, y, red, green, blue);
    this.line(x, bottom, right, bottom, red, green, blue);
    this.line(x, y, x, bottom, red, green, blue);
    this.line(right, y, right, bottom, red, green, blue);
  }

  /** Fill a rectangle (respects the clip rectangle). */
  fillRect(x: number, y: number, width: number, height: number, red: number, green: number, blue: number): void {
    const startX = x | 0;
    const startY = y | 0;
    const endX = startX + (width | 0);
    const endY = startY + (height | 0);
    for (let row = startY; row < endY; row++) for (let column = startX; column < endX; column++) this.#plot(column, row, red, green, blue);
  }

  /** Draw a circle outline with the midpoint algorithm (respects the clip rectangle). */
  circle(centerX: number, centerY: number, radius: number, red: number, green: number, blue: number): void {
    const cx = centerX | 0;
    const cy = centerY | 0;
    let offsetX = radius | 0;
    let offsetY = 0;
    let error = 1 - offsetX;
    while (offsetX >= offsetY) {
      this.#plot(cx + offsetX, cy + offsetY, red, green, blue);
      this.#plot(cx + offsetY, cy + offsetX, red, green, blue);
      this.#plot(cx - offsetY, cy + offsetX, red, green, blue);
      this.#plot(cx - offsetX, cy + offsetY, red, green, blue);
      this.#plot(cx - offsetX, cy - offsetY, red, green, blue);
      this.#plot(cx - offsetY, cy - offsetX, red, green, blue);
      this.#plot(cx + offsetY, cy - offsetX, red, green, blue);
      this.#plot(cx + offsetX, cy - offsetY, red, green, blue);
      offsetY++;
      if (error < 0) {
        error += 2 * offsetY + 1;
      } else {
        offsetX--;
        error += 2 * (offsetY - offsetX) + 1;
      }
    }
  }

  /** Fill a circle (respects the clip rectangle). */
  fillCircle(centerX: number, centerY: number, radius: number, red: number, green: number, blue: number): void {
    const cx = centerX | 0;
    const cy = centerY | 0;
    const radiusSquared = radius * radius;
    const extent = radius | 0;
    for (let offsetY = -extent; offsetY <= extent; offsetY++) {
      for (let offsetX = -extent; offsetX <= extent; offsetX++) {
        if (offsetX * offsetX + offsetY * offsetY <= radiusSquared) this.#plot(cx + offsetX, cy + offsetY, red, green, blue);
      }
    }
  }

  /** Copy a tightly packed source RGB image into the framebuffer at (destinationX, destinationY), respecting the clip rectangle. */
  blit(sourcePixels: Uint8Array, sourceWidth: number, sourceHeight: number, destinationX: number, destinationY: number): void {
    const baseX = destinationX | 0;
    const baseY = destinationY | 0;
    for (let row = 0; row < sourceHeight; row++) {
      const sourceRowBase = row * sourceWidth * 3;
      for (let column = 0; column < sourceWidth; column++) {
        const sourceIndex = sourceRowBase + column * 3;
        this.#plot(baseX + column, baseY + row, sourcePixels[sourceIndex], sourcePixels[sourceIndex + 1], sourcePixels[sourceIndex + 2]);
      }
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

  /** Build and flush the frame. Writes to the terminal by default; `options.sink` redirects it, `options.sync` swaps it atomically. */
  present(options?: PresentOptions): void {
    this.buildFrame();
    const bytes = this.#output.view();
    if (options?.sink) {
      options.sink(bytes);
      return;
    }
    if (options?.sync) {
      standardOutput.write(SYNCHRONIZED_OUTPUT_BEGIN);
      standardOutput.write(bytes);
      standardOutput.write(SYNCHRONIZED_OUTPUT_END);
    } else {
      standardOutput.write(bytes);
    }
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
        if (isTruecolor) output.emitCellTruecolor(emittedForeground, blackBackground, asciiRampBytes[rampIndex]);
        else output.emitCellPalette(emittedForeground, blackBackground, asciiRampBytes[rampIndex]);
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
        output.emitCellTruecolor(foregroundKey, backgroundKey, halfBlockGlyph);
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
        if (isTruecolor) output.emitCellTruecolor(emittedForeground, emittedBackground, halfBlockGlyph);
        else output.emitCellPalette(emittedForeground, emittedBackground, halfBlockGlyph);
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
        let totalRed = 0;
        let totalGreen = 0;
        let totalBlue = 0;
        // Every sub-cell mode that reaches here is 2 pixels wide (quad 2×2,
        // sextant 2×3, braille 2×4); only the height varies. Unrolling the
        // two-wide inner pair drops the column loop, its bounds check, and the
        // per-subpixel index multiply. The running totals make the solid-cell
        // branch a divide with no second pass.
        for (let subRow = 0; subRow < pixelHeight; subRow++) {
          const rowOffset = ((pixelRowBase + subRow) * width + pixelColumnBase) * 3;
          const subIndex = subRow << 1;
          const leftRed = pixels[rowOffset];
          const leftGreen = pixels[rowOffset + 1];
          const leftBlue = pixels[rowOffset + 2];
          subpixelRed[subIndex] = leftRed;
          subpixelGreen[subIndex] = leftGreen;
          subpixelBlue[subIndex] = leftBlue;
          const leftLuma = leftRed * 299 + leftGreen * 587 + leftBlue * 114;
          subpixelLuma[subIndex] = leftLuma;
          if (leftLuma < minimumLuma) minimumLuma = leftLuma;
          if (leftLuma > maximumLuma) maximumLuma = leftLuma;
          const rightRed = pixels[rowOffset + 3];
          const rightGreen = pixels[rowOffset + 4];
          const rightBlue = pixels[rowOffset + 5];
          subpixelRed[subIndex + 1] = rightRed;
          subpixelGreen[subIndex + 1] = rightGreen;
          subpixelBlue[subIndex + 1] = rightBlue;
          const rightLuma = rightRed * 299 + rightGreen * 587 + rightBlue * 114;
          subpixelLuma[subIndex + 1] = rightLuma;
          if (rightLuma < minimumLuma) minimumLuma = rightLuma;
          if (rightLuma > maximumLuma) maximumLuma = rightLuma;
          totalRed += leftRed + rightRed;
          totalGreen += leftGreen + rightGreen;
          totalBlue += leftBlue + rightBlue;
        }
        let foregroundRed: number;
        let foregroundGreen: number;
        let foregroundBlue: number;
        let backgroundRed: number;
        let backgroundGreen: number;
        let backgroundBlue: number;
        let glyphMask: number;
        if (maximumLuma - minimumLuma < SOLID_LUMA_SPAN) {
          foregroundRed = backgroundRed = (totalRed / subpixelCount) | 0;
          foregroundGreen = backgroundGreen = (totalGreen / subpixelCount) | 0;
          foregroundBlue = backgroundBlue = (totalBlue / subpixelCount) | 0;
          glyphMask = 0;
        } else {
          const midLuma = (minimumLuma + maximumLuma) >> 1;
          let brightRed = 0;
          let brightGreen = 0;
          let brightBlue = 0;
          let brightCount = 0;
          glyphMask = 0;
          // Accumulate only the bright group; the dark group is the remainder of
          // the running totals (total − bright). The solid-span guard guarantees
          // both groups are non-empty, so neither divisor is zero.
          for (let subIndex = 0; subIndex < subpixelCount; subIndex++) {
            if (subpixelLuma[subIndex] >= midLuma) {
              brightRed += subpixelRed[subIndex];
              brightGreen += subpixelGreen[subIndex];
              brightBlue += subpixelBlue[subIndex];
              brightCount++;
              glyphMask |= 1 << bitLayout[subIndex];
            }
          }
          const darkCount = subpixelCount - brightCount;
          foregroundRed = (brightRed / brightCount) | 0;
          foregroundGreen = (brightGreen / brightCount) | 0;
          foregroundBlue = (brightBlue / brightCount) | 0;
          backgroundRed = ((totalRed - brightRed) / darkCount) | 0;
          backgroundGreen = ((totalGreen - brightGreen) / darkCount) | 0;
          backgroundBlue = ((totalBlue - brightBlue) / darkCount) | 0;
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
        if (isTruecolor) output.emitCellTruecolor(emittedForeground, emittedBackground, glyphTable[glyphMask]);
        else output.emitCellPalette(emittedForeground, emittedBackground, glyphTable[glyphMask]);
        currentColumn++;
        if (currentColumn >= columns) currentRow = -1;
      }
    }
  }
}
