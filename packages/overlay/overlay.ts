/**
 * High-performance OpenGL overlay renderer
 *
 * Design goals:
 * - 1000+ FPS capable
 * - Zero allocations in hot path (draw calls, update)
 * - Full FFI encapsulation - no native handles exposed
 * - Pre-multiplied alpha for correct layered window compositing
 *
 * How a frame flows:
 * - Draw calls tessellate on the CPU into interleaved streams (position, atlas texel, packed color). No GL calls.
 * - Untextured geometry samples a white texel of the glyph/image atlas, so shapes, text and images share one
 *   texture and batch into one glDrawElements per run. Runs only split on clip or 3D line width changes.
 * - 3D is the bottom layer and 2D the top: one projection switch per frame, however calls interleave.
 * - Edges are feathered with a 1px coverage ring: anti-aliasing without multisampling or shaders.
 * - update() submits the frame and, in alpha mode, reads back only the rectangle that changed since the last
 *   frame, handing exactly that rectangle to UpdateLayeredWindowIndirect.
 */

import * as GL from './constants';
import { fadeColor, Gradient, packColor } from './paint';
import type { Color, GradientStop, Image, OverlayConfig, Paint, Point3D, Points2D, Points3D, RGBA, RenderMode, ShapeStyle, Style, TextBaseline, TextStyle } from './types';

import GDI32 from '@bun-win32/gdi32';
import Kernel32 from '@bun-win32/kernel32';
import OpenGL32 from '@bun-win32/opengl32';
import User32 from '@bun-win32/user32';

import { CFunction, FFIType, JSCallback, type Pointer, toArrayBuffer } from 'bun:ffi';

// Initialized first: the segment table below evaluates with them at module load
const { PI, SQRT1_2, abs, acos, ceil, cos, floor, max, min, round, sin, sqrt, tan } = Math;

/** Atlas size in texels: fixed width, the height doubles on demand up to the maximum */
const ATLAS_MAX_HEIGHT = 4_096;
const ATLAS_WIDTH = 1_024;

const BLEND_FUNCTION = Buffer.from([GL.AC_SRC_OVER, 0x00, 0xff, GL.AC_SRC_ALPHA]);

/** Box corners by bit: x (1), y (2), z (4). Triangles wind counter-clockwise seen from outside. */
const BOX_EDGES = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7]);
const BOX_TRIANGLES = new Uint8Array([0, 2, 1, 1, 2, 3, 4, 5, 6, 5, 7, 6, 0, 4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5, 0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7]);

// Stroke caps
const CAP_BUTT = 0;
const CAP_ROUND = 1;
const CAP_SQUARE = 2;

/** Circle segments by integer pixel radius: chord error <= 0.2px, a multiple of 4 in [8, 256] */
const CIRCLE_SEGMENTS = new Uint16Array(1_025);

for (let radius = 0; radius < 1_025; radius++) {
  const segments = radius < 1 ? 8 : ceil(PI / acos(1 - 0.2 / radius));

  CIRCLE_SEGMENTS[radius] = min(256, max(8, (segments + 3) & ~3));
}

/** Anti-aliasing ring coverage: opaque inner ring, transparent outer ring */
const EDGE_COVERAGE = new Float64Array([1, 0]);

/** Font cache entry */
interface FontEntry {
  readonly ascent: number;
  readonly descent: number;
  /** Latin-1 glyphs, dense */
  readonly glyphs: (Glyph | undefined)[];
  readonly handle: bigint;
  readonly height: number;
  readonly margin: number;
  /** Everything above Latin-1 */
  readonly others: Map<number, Glyph>;
  readonly size: number;
}

/** Rasterized glyph: quadrilateral relative to the pen on the baseline, packed atlas texels per corner */
interface Glyph {
  readonly advance: number;
  readonly bottomLeft: number;
  readonly bottomRight: number;
  readonly height: number;
  readonly topLeft: number;
  readonly topRight: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

// LayeredWindowAttributes flags
const LWA_COLORKEY = 0x00000001;

// Pre-allocated static buffers (shared across instances for single-threaded use)
const MESSAGE_BUFFER = Buffer.alloc(48);
const MESSAGE_POINTER = MESSAGE_BUFFER.ptr;

/** Joins longer than MITER_LIMIT half-widths are clamped; stored squared to compare against the inverse miter scale */
const MITER_LIMIT = 4;
const MITER_SCALE_LIMIT = MITER_LIMIT * MITER_LIMIT;

/** Text outline: eight unit offsets around each glyph */
const OUTLINE_OFFSETS = new Float64Array([1, 0, SQRT1_2, SQRT1_2, 0, 1, -SQRT1_2, SQRT1_2, -1, 0, -SQRT1_2, -SQRT1_2, 0, -1, SQRT1_2, -SQRT1_2]);

export class Overlay {
  // Resolved style of the shape being drawn
  #alpha = 1;
  #cap = CAP_BUTT;
  #dash: readonly number[] | undefined = undefined;
  #dashOffset = 0;
  #fillColor = 0;
  #gradientFill: Gradient | null = null;
  #gradientStroke: Gradient | null = null;
  #hasFill = false;
  #hasStroke = false;
  #radius = 0;
  #segments = 0;
  #shadow: ShapeStyle['shadow'] = undefined;
  #strokeColor = 0;
  #strokeWidth = 1;

  // Private handles (never exposed)
  readonly #antialias: boolean;
  readonly #deviceContext: bigint;
  readonly #glyphDeviceContext: bigint;
  readonly #offscreenBitmap: bigint;
  readonly #offscreenDeviceContext: bigint;
  readonly #pixels: number;
  readonly #renderingContext: bigint;
  readonly #texture: number;
  readonly #window: bigint;

  // Atlas (RGBA, pre-multiplied) mirrored on the CPU; dirty rows upload in update()
  #atlas: Uint8Array;
  #atlasDirtyBottom = 0;
  #atlasDirtyTop = 0;
  #atlasHeight = 512;
  #atlasResized = true;
  #shelfHeight = 4;
  #shelfX = 4;
  #shelfY = 0;

  // Window state (blank: the last presented frame was empty)
  #blank = false;
  #closed = false;
  #hidden = false;
  #left: number;
  #top: number;

  // Text
  readonly #characterBuffer = new Uint16Array(2);
  readonly #fonts = new Map<string, Map<number, FontEntry>>();
  #glyphBitmap = 0n;
  #glyphCanvas = new Uint8Array(0);
  #glyphCanvasHeight = 0;
  #glyphCanvasWidth = 0;
  readonly #metricsBuffer = new Int32Array(16);
  #selectedFont = 0n;
  readonly #widthBuffer = new Int32Array(1);

  // Clip rectangles (window pixels: left, top, right, bottom); index 0 is unclipped
  #clipCount = 1;
  #clipIndex = 0;
  #clips = new Int32Array(64);

  // Scratch geometry in local space, grown together (capacity in points = order.length)
  #dashPoints = new Float64Array(256);
  #miters = new Float64Array(1_024);
  #normals = new Float64Array(1_024);
  #order = new Int32Array(512);
  #path = new Float64Array(1_024);
  readonly #ringOffsets = new Float64Array(5);
  readonly #rowOffsets = new Float64Array(4);
  readonly #rowOpaque = new Uint8Array(4);
  #spare = new Float64Array(1_024);
  #values = new Float64Array(512);

  // Drawing state: save() stack depth, feather width in local units, transform (canvas a-f) and its uniform scale
  #depth = 0;
  #fringe = 1;
  #lineWidth = 1;
  #pixelScale = 1;
  #stack = new Float64Array(8 * 16);
  readonly #transform = new Float64Array([1, 0, 0, 1, 0, 0]);

  // Pre-allocated buffers for update() hot path (alpha mode only)
  readonly #dirtyRectangle = new Int32Array(4);
  readonly #layeredInformation = Buffer.alloc(80);
  readonly #layeredPointer: Pointer;
  readonly #sizeBuffer = Buffer.alloc(8);
  readonly #sourcePoint = Buffer.alloc(8);

  // 3D (column-major, as GL consumes them)
  #frontFace = GL.GL_CCW;
  readonly #orthographic = new Float32Array(16);
  readonly #projected = { x: 0, y: 0 };
  readonly #projection = new Float32Array(16);
  readonly #view = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  readonly #viewProjection = new Float64Array(16);

  // Gradient mapping of the shape being drawn: t = (x - originX) * scaleX + (y - originY) * scaleY (radial: length)
  #gradientOriginX = 0;
  #gradientOriginY = 0;
  #gradientScaleX = 0;
  #gradientScaleY = 0;

  // Vertex streams (16-byte stride) and index streams
  #has3D = false;
  #indexCount = 0;
  #indices = new Uint32Array(49_152);
  #lineCount = 0;
  #lineIndices = new Uint32Array(8_192);
  #solidCount = 0;
  #solidIndices = new Uint32Array(12_288);
  #surfaceCount = 0;
  #surfaceIndices = new Uint32Array(4_096);
  #vertexCount2D = 0;
  #vertexCount3D = 0;
  #vertices2D = new Float32Array(16_384 * STRIDE);
  #vertices3D = new Float32Array(4_096 * STRIDE);
  #words2D = new Uint32Array(this.#vertices2D.buffer);
  #words3D = new Uint32Array(this.#vertices3D.buffer);

  // Bounds drawn last frame (window pixels); their pixels must be cleared this frame
  #previousBottom: number;
  #previousLeft = 0;
  #previousRight: number;
  #previousTop = 0;

  // Runs: index ranges sharing a clip and 3D line width
  #runCount = 0;
  #runDirty = true;
  #runs = new Float64Array(64 * RUN_STRIDE);

  // Path API: points and subpath records (first point, closed)
  #subpathCount = 0;
  #subpaths = new Uint32Array(64);
  #userCount = 0;
  #userPath = new Float64Array(512);

  /** Opacity multiplier for everything drawn afterwards. Saved by save(), reset to 1 every frame. */
  public globalAlpha = 1;
  public readonly height: number;
  public readonly renderMode: RenderMode;
  public readonly width: number;

  constructor(config: OverlayConfig) {
    const { antialias, colorKey = '#ff00ff', height, mode = 'alpha', title = 'Overlay', verticalSync = false, width } = config;

    this.#antialias = antialias ?? mode !== 'colorkey';
    this.#fringe = this.#antialias ? 1 : 0;
    this.height = height;
    this.#previousBottom = height;
    this.#previousRight = width;
    this.renderMode = mode;
    this.width = width;

    // DPI awareness, or Windows bitmap-stretches the overlay on scaled displays.
    // FALSE when the process already chose an awareness (manifest or earlier call) - that choice stands.
    void User32.SetProcessDPIAware();

    // Parse colorKey to COLORREF (0x00BBGGRR)
    const key = packColor(colorKey);
    const colorKeyValue = ((key & 0xff) << 16) | (key & 0xff00) | ((key >>> 16) & 0xff);

    this.#sizeBuffer.writeInt32LE(width, 0);
    this.#sizeBuffer.writeInt32LE(height, 4);

    // Get module handle
    const moduleHandle = Kernel32.GetModuleHandleW(null);

    if (!moduleHandle) {
      throw new Error(`GetModuleHandleW failed: ${Kernel32.GetLastError()}`);
    }

    // Calculate position (center if not specified)
    const screenHeight = User32.GetSystemMetrics(GL.SM_CYSCREEN);
    const screenWidth = User32.GetSystemMetrics(GL.SM_CXSCREEN);

    this.#left = config.x ?? (screenWidth - width) >> 1;
    this.#top = config.y ?? (screenHeight - height) >> 1;

    // Window style depends on mode
    const extendedStyle = mode === 'opaque' ? GL.WS_EX_TOPMOST | GL.WS_EX_NOACTIVATE : GL.WS_EX_OVERLAY;

    // Create window
    const className = Buffer.from('STATIC\0', 'utf16le');
    const windowName = Buffer.from(`${title}\0`, 'utf16le');

    this.#window = User32.CreateWindowExW(extendedStyle, className.ptr, windowName.ptr, GL.WS_POPUP, this.#left, this.#top, width, height, 0n, 0n, moduleHandle, null);

    if (!this.#window) {
      throw new Error(`CreateWindowExW failed: ${Kernel32.GetLastError()}`);
    }

    // Set window procedure
    if (!User32.SetWindowLongPtrW(this.#window, GL.GWLP_WNDPROC, BigInt(windowProcedureCallback.ptr!))) {
      throw new Error(`SetWindowLongPtrW failed: ${Kernel32.GetLastError()}`);
    }

    // Get device context
    this.#deviceContext = User32.GetDC(this.#window);

    if (!this.#deviceContext) {
      throw new Error(`GetDC failed: ${Kernel32.GetLastError()}`);
    }

    // Setup pixel format
    const pixelFormat = GDI32.ChoosePixelFormat(this.#deviceContext, PIXEL_FORMAT_DESCRIPTOR.ptr);

    if (!pixelFormat) {
      throw new Error(`ChoosePixelFormat failed: ${Kernel32.GetLastError()}`);
    }

    if (!GDI32.SetPixelFormat(this.#deviceContext, pixelFormat, PIXEL_FORMAT_DESCRIPTOR.ptr)) {
      throw new Error(`SetPixelFormat failed: ${Kernel32.GetLastError()}`);
    }

    // Create OpenGL context
    this.#renderingContext = OpenGL32.wglCreateContext(this.#deviceContext);

    if (!this.#renderingContext) {
      throw new Error(`wglCreateContext failed: ${Kernel32.GetLastError()}`);
    }

    if (!OpenGL32.wglMakeCurrent(this.#deviceContext, this.#renderingContext)) {
      throw new Error(`wglMakeCurrent failed: ${Kernel32.GetLastError()}`);
    }

    // Setup based on render mode
    if (mode === 'alpha') {
      // Create offscreen DIB for UpdateLayeredWindowIndirect; glReadPixels writes straight into it
      this.#offscreenDeviceContext = GDI32.CreateCompatibleDC(0n);

      if (!this.#offscreenDeviceContext) {
        throw new Error(`CreateCompatibleDC failed: ${Kernel32.GetLastError()}`);
      }

      const bitmapInfo = Buffer.alloc(0x28);
      bitmapInfo.writeUInt32LE(0x28, 0x00); // biSize
      bitmapInfo.writeInt32LE(width, 0x04); // biWidth
      bitmapInfo.writeInt32LE(height, 0x08); // biHeight (bottom-up, like GL)
      bitmapInfo.writeUInt16LE(0x01, 0x0c); // biPlanes
      bitmapInfo.writeUInt16LE(0x20, 0x0e); // biBitCount = 32
      bitmapInfo.writeUInt32LE(0x00, 0x10); // biCompression = BI_RGB

      const bitsPointer = Buffer.alloc(8);
      this.#offscreenBitmap = GDI32.CreateDIBSection(this.#offscreenDeviceContext, bitmapInfo.ptr, GL.DIB_RGB_COLORS, bitsPointer.ptr, 0n, 0);

      if (!this.#offscreenBitmap) {
        throw new Error(`CreateDIBSection failed: ${Kernel32.GetLastError()}`);
      }

      this.#pixels = Number(bitsPointer.readBigUInt64LE());
      GDI32.SelectObject(this.#offscreenDeviceContext, this.#offscreenBitmap);
    } else {
      this.#offscreenBitmap = 0n;
      this.#offscreenDeviceContext = 0n;
      this.#pixels = 0;

      // SetLayeredWindowAttributes for color key
      if (mode === 'colorkey' && !User32.SetLayeredWindowAttributes(this.#window, colorKeyValue, 0, LWA_COLORKEY)) {
        throw new Error(`SetLayeredWindowAttributes failed: ${Kernel32.GetLastError()}`);
      }
    }

    // UPDATELAYEREDWINDOWINFO: only the dirty rectangle (prcDirty) changes per frame
    const information = this.#layeredInformation;
    information.writeUInt32LE(80, 0); // cbSize
    information.writeBigUInt64LE(BigInt(this.#sizeBuffer.ptr), 24); // psize
    information.writeBigUInt64LE(this.#offscreenDeviceContext, 32); // hdcSrc
    information.writeBigUInt64LE(BigInt(this.#sourcePoint.ptr), 40); // pptSrc
    information.writeBigUInt64LE(BigInt(BLEND_FUNCTION.ptr), 56); // pblend
    information.writeUInt32LE(GL.ULW_ALPHA, 64); // dwFlags
    information.writeBigUInt64LE(BigInt(this.#dirtyRectangle.ptr), 72); // prcDirty
    this.#layeredPointer = information.ptr;

    // Glyphs rasterize through GDI into a DIB, then copy into the atlas
    this.#glyphDeviceContext = GDI32.CreateCompatibleDC(0n);

    if (!this.#glyphDeviceContext) {
      throw new Error(`CreateCompatibleDC failed: ${Kernel32.GetLastError()}`);
    }

    GDI32.SetBkMode(this.#glyphDeviceContext, GL.TRANSPARENT);
    GDI32.SetTextColor(this.#glyphDeviceContext, 0x00ff_ffff);

    // Atlas starts with a 4x4 white block that untextured geometry samples
    this.#atlas = new Uint8Array(ATLAS_WIDTH * this.#atlasHeight * 4);

    for (let row = 0; row < 4; row++) {
      this.#atlas.fill(0xff, row * ATLAS_WIDTH * 4, (row * ATLAS_WIDTH + 4) * 4);
    }

    // Initialize OpenGL state
    const name = new Uint32Array(1);
    OpenGL32.glGenTextures(1, name.ptr);
    this.#texture = name[0];

    this.#initializeGL(colorKeyValue, verticalSync);
    this.setPerspective();

    // Show window
    User32.ShowWindow(this.#window, GL.SW_SHOWNOACTIVATE);

    if (!User32.UpdateWindow(this.#window)) {
      throw new Error(`UpdateWindow failed: ${Kernel32.GetLastError()}`);
    }
  }

  /** Reserves a `width` x `height` atlas rectangle (shelf packing); returns `y << 16 | x` */
  #allocate(width: number, height: number): number {
    if (width > ATLAS_WIDTH) {
      throw new Error(`Image is wider than the ${ATLAS_WIDTH}pointX atlas: ${width}pointX`);
    }

    // Next shelf (order matters: the finished shelf's height advances y before it resets)
    if (this.#shelfX + width > ATLAS_WIDTH) {
      this.#shelfY += this.#shelfHeight;
      this.#shelfHeight = 0;
      this.#shelfX = 0;
    }

    const x = this.#shelfX;
    const y = this.#shelfY;

    if (y + height > this.#atlasHeight) {
      let atlasHeight = this.#atlasHeight * 2;

      while (atlasHeight < y + height) {
        atlasHeight *= 2;
      }

      if (atlasHeight > ATLAS_MAX_HEIGHT) {
        throw new Error(`Texture atlas is full (${ATLAS_WIDTH}x${ATLAS_MAX_HEIGHT})`);
      }

      const atlas = new Uint8Array(ATLAS_WIDTH * atlasHeight * 4);
      atlas.set(this.#atlas);

      this.#atlas = atlas;
      this.#atlasHeight = atlasHeight;
      this.#atlasResized = true;
    }

    this.#atlasDirtyBottom = max(this.#atlasDirtyBottom, y + height);
    this.#atlasDirtyTop = min(this.#atlasDirtyTop, y);
    this.#shelfHeight = max(this.#shelfHeight, height);
    this.#shelfX += width;

    return (y << 16) | x;
  }

  /** Writes an arc (or a pie: center first) into the scratch path by rotation recurrence - two trig calls total */
  #arcPath(x: number, y: number, radius: number, start: number, sweep: number, steps: number, pie: boolean): number {
    const count = steps + (pie ? 2 : 1);

    this.#ensurePath(count);

    const path = this.#path;
    const step = sweep / steps;
    const stepCosine = cos(step);
    const stepSine = sin(step);

    let o = 0;
    let rimCosine = cos(start);
    let rimSine = sin(start);

    if (pie) {
      o = 2;
      path[0] = x;
      path[1] = y;
    }

    for (let i = 0; i <= steps; i++, o += 2) {
      path[o] = x + rimCosine * radius;
      path[o + 1] = y + rimSine * radius;

      const next = rimCosine * stepCosine - rimSine * stepSine;

      rimSine = rimSine * stepCosine + rimCosine * stepSine;
      rimCosine = next;
    }

    return count;
  }

  /** Connects ring `from` to ring `to` (both `count` vertices); `fan`: `from` is a single center vertex */
  #bridge(from: number, to: number, count: number, fan: boolean, k: number): number {
    const indices = this.#indices;

    for (let i = 0; i < count; i++) {
      const j = i + 1 === count ? 0 : i + 1;

      if (fan) {
        indices[k] = from;
        indices[k + 1] = to + i;
        indices[k + 2] = to + j;
        k += 3;
      } else {
        indices[k] = from + i;
        indices[k + 1] = from + j;
        indices[k + 2] = to + j;
        indices[k + 3] = from + i;
        indices[k + 4] = to + j;
        indices[k + 5] = to + i;
        k += 6;
      }
    }

    return k;
  }

  /** Records where the current run ends */
  #closeRun(): void {
    const offset = (this.#runCount - 1) * RUN_STRIDE;
    const runs = this.#runs;

    runs[offset + 3] = this.#indexCount;
    runs[offset + 5] = this.#solidCount;
    runs[offset + 7] = this.#surfaceCount;
    runs[offset + 9] = this.#lineCount;
  }

  /** Makes sure a subpath is open to extend; returns false when (x, y) only started one */
  #continuePath(x: number, y: number): boolean {
    if (this.#subpathCount === 0) {
      this.moveTo(x, y);
      return false;
    }

    // After closePath() the next segment starts a new subpath at the closed one's first point
    const offset = (this.#subpathCount - 1) << 1;

    if (this.#subpaths[offset + 1] === 1) {
      const first = this.#subpaths[offset] << 1;
      this.moveTo(this.#userPath[first], this.#userPath[first + 1]);
    }

    return true;
  }

  #convex(points: Float64Array, count: number, sign: number): boolean {
    for (let i = 0, p = 0; i < count; i++, p += 2) {
      const next = i + 1 === count ? 0 : p + 2;
      const previous = i === 0 ? (count - 1) << 1 : p - 2;
      const cross = (points[p] - points[previous]) * (points[next + 1] - points[p + 1]) - (points[p + 1] - points[previous + 1]) * (points[next] - points[p]);

      if (cross * sign < -1e-9) {
        return false;
      }
    }

    return true;
  }

  /** Writes box corners (bit 1: +width, bit 2: +height, bit 4: +depth) and reserves indices; returns the first vertex */
  #corners3D(x: number, y: number, z: number, width: number, height: number, depth: number, corners: number, color: number, surface: number, lines: number): number {
    this.#reserve3D(corners, corners === 8 ? surface : 0, corners === 8 ? 0 : surface, lines);

    const vertices = this.#vertices3D;
    const words = this.#words3D;
    const base = this.#vertexCount3D;

    for (let corner = 0, o = base * STRIDE; corner < corners; corner++, o += STRIDE) {
      vertices[o] = corner & 1 ? x + width : x;
      vertices[o + 1] = corner & 2 ? y + height : y;
      vertices[o + 2] = corner & 4 ? z + depth : z;
      words[o + 3] = color;
    }

    this.#vertexCount3D = base + corners;

    return base;
  }

  /** Appends a dash point at `index`; returns the new count */
  #dashPoint(index: number, x: number, y: number): number {
    if ((index + 1) << 1 > this.#dashPoints.length) {
      const dashPoints = new Float64Array(this.#dashPoints.length * 2);
      dashPoints.set(this.#dashPoints);
      this.#dashPoints = dashPoints;
    }

    this.#dashPoints[index << 1] = x;
    this.#dashPoints[(index << 1) + 1] = y;

    return index + 1;
  }

  /** Walks the scratch path through the dash pattern, stroking each dash as an open piece */
  #dashed(count: number, closed: boolean, color: number, gradient: Gradient | null): void {
    const pattern = this.#dash!;
    const patternLength = pattern.length;

    let cycle = 0;

    for (let i = 0; i < patternLength; i++) {
      cycle += max(0, pattern[i]);
    }

    if (!(cycle > 0)) {
      this.#strokePath(this.#path, count, closed, null, color, gradient, 0, 0);
      return;
    }

    // Odd patterns repeat twice to alternate (CSS/SVG)
    const period = patternLength & 1 ? patternLength * 2 : patternLength;

    if (patternLength & 1) {
      cycle *= 2;
    }

    const points = this.#path;
    const segments = closed ? count : count - 1;

    let total = 0;

    for (let p = 0, s = 0; s < segments; p += 2, s++) {
      const q = s + 1 === count ? 0 : p + 2;
      total += sqrt((points[q] - points[p]) ** 2 + (points[q + 1] - points[p + 1]) ** 2);
    }

    // Skip into the pattern by the dash offset
    let element = 0;
    let phase = ((this.#dashOffset % cycle) + cycle) % cycle;
    let remaining = max(0, pattern[0]);

    while (phase > 0) {
      if (phase >= remaining) {
        element = element + 1 === period ? 0 : element + 1;
        phase -= remaining;
        remaining = max(0, pattern[element % patternLength]);
      } else {
        remaining -= phase;
        phase = 0;
      }
    }

    let dashCount = 0;
    let dashStart = 0;
    let on = (element & 1) === 0;
    let traveled = 0;

    if (on) {
      dashCount = this.#dashPoint(0, points[0], points[1]);
    }

    for (let p = 0, s = 0; s < segments; p += 2, s++) {
      const q = s + 1 === count ? 0 : p + 2;
      const startX = points[p];
      const startY = points[p + 1];
      const deltaX = points[q] - startX;
      const deltaY = points[q + 1] - startY;
      const segmentLength = sqrt(deltaX * deltaX + deltaY * deltaY);

      let position = 0;

      for (;;) {
        const step = min(remaining, segmentLength - position);

        position += step;
        remaining -= step;

        if (remaining > 0) {
          break;
        }

        // Element boundary
        const ratio = segmentLength > 0 ? position / segmentLength : 0;
        const x = startX + deltaX * ratio;
        const y = startY + deltaY * ratio;

        if (on) {
          dashCount = this.#dashPoint(dashCount, x, y);
          this.#strokePath(this.#dashPoints, dashCount, false, null, color, gradient, dashStart, total);
        }

        element = element + 1 === period ? 0 : element + 1;
        on = !on;
        remaining = max(0, pattern[element % patternLength]);

        if (on) {
          dashCount = this.#dashPoint(0, x, y);
          dashStart = traveled + position;
        }

        if (position >= segmentLength && remaining > 0) {
          break;
        }
      }

      if (on) {
        dashCount = this.#dashPoint(dashCount, points[q], points[q + 1]);
      }

      traveled += segmentLength;
    }

    if (on && dashCount > 1) {
      this.#strokePath(this.#dashPoints, dashCount, false, null, color, gradient, dashStart, total);
    }
  }

  /** Zero-length stroke piece: a round or square dot */
  #dot(x: number, y: number, radius: number, color: number): void {
    const half = this.#fringe * 0.5;
    const offsets = this.#ringOffsets;
    const rings = half > 0 ? 2 : 1;

    offsets[0] = -half;
    offsets[1] = half;

    if (this.#cap === CAP_ROUND) {
      const segments = this.#segmentsFor(radius);
      const unit = unitCircle(segments);

      this.#ensurePath(segments);

      const spare = this.#spare;

      for (let p = 0; p < segments << 1; p += 2) {
        spare[p] = x + unit[p] * radius;
        spare[p + 1] = y + unit[p + 1] * radius;
      }

      this.#fillPath(spare, segments, true, unit, color, null, offsets, EDGE_COVERAGE, rings, false);
      return;
    }

    const spare = this.#spare;

    spare[0] = x - radius;
    spare[1] = y - radius;
    spare[2] = x + radius;
    spare[3] = y - radius;
    spare[4] = x + radius;
    spare[5] = y + radius;
    spare[6] = x - radius;
    spare[7] = y + radius;

    this.#fillPath(spare, 4, true, RECTANGLE_MITERS, color, null, offsets, EDGE_COVERAGE, rings, false);
  }

  /** Submits the frame: the 3D layer, then 2D on top - one projection switch however calls interleaved */
  #draw(): void {
    if (this.#runCount === 0) {
      return;
    }

    this.#closeRun();
    this.#uploadAtlas();

    let clip = 0;

    if (this.#has3D) {
      clip = this.#draw3D(clip);
    }

    if (this.#indexCount > 0) {
      clip = this.#draw2D(clip);
    }

    if (clip !== 0) {
      OpenGL32.glDisable(GL.GL_SCISSOR_TEST);
    }
  }

  /** Draws the 2D layer, merging neighboring runs that share a clip; returns the active clip */
  #draw2D(clip: number): number {
    const runCount = this.#runCount;
    const runs = this.#runs;
    const indices = this.#indices.ptr;
    const last = runCount * RUN_STRIDE;

    let end = 0;
    let pending = -1;
    let start = 0;

    this.#enter2D();

    for (let offset = 0; offset <= last; offset += RUN_STRIDE) {
      const done = offset === last;

      if (!done && runs[offset + 3] === runs[offset + 2]) {
        continue;
      }

      // 2D ranges are appended in order, so equal clips mean one contiguous range
      if (!done && runs[offset] === pending) {
        end = runs[offset + 3];
        continue;
      }

      if (pending >= 0) {
        clip = this.#scissor(pending, clip);
        OpenGL32.glDrawElements(GL.GL_TRIANGLES, end - start, GL.GL_UNSIGNED_INT, (indices + start * 4) as Pointer);
      }

      if (!done) {
        end = runs[offset + 3];
        pending = runs[offset];
        start = runs[offset + 2];
      }
    }

    return clip;
  }

  /** Draws the 3D layer, merging neighboring runs that share a clip and line width; returns the active clip */
  #draw3D(clip: number): number {
    const runCount = this.#runCount;
    const runs = this.#runs;
    const last = runCount * RUN_STRIDE;
    const lineIndices = this.#lineIndices.ptr;
    const solidIndices = this.#solidIndices.ptr;
    const surfaceIndices = this.#surfaceIndices.ptr;

    let lineEnd = 0;
    let lineStart = 0;
    let lineWidth = -1;
    let pending = -1;
    let pendingWidth = 0;
    let solidEnd = 0;
    let solidStart = 0;
    let surfaceEnd = 0;
    let surfaceStart = 0;

    this.#enter3D();

    for (let offset = 0; offset <= last; offset += RUN_STRIDE) {
      const done = offset === last;

      if (!done && runs[offset + 5] === runs[offset + 4] && runs[offset + 7] === runs[offset + 6] && runs[offset + 9] === runs[offset + 8]) {
        continue;
      }

      if (!done && runs[offset] === pending && runs[offset + 1] === pendingWidth) {
        lineEnd = runs[offset + 9];
        solidEnd = runs[offset + 5];
        surfaceEnd = runs[offset + 7];
        continue;
      }

      if (pending >= 0) {
        clip = this.#scissor(pending, clip);

        if (solidEnd > solidStart) {
          OpenGL32.glEnable(GL.GL_CULL_FACE);
          OpenGL32.glDrawElements(GL.GL_TRIANGLES, solidEnd - solidStart, GL.GL_UNSIGNED_INT, (solidIndices + solidStart * 4) as Pointer);
          OpenGL32.glDisable(GL.GL_CULL_FACE);
        }

        if (surfaceEnd > surfaceStart) {
          OpenGL32.glDrawElements(GL.GL_TRIANGLES, surfaceEnd - surfaceStart, GL.GL_UNSIGNED_INT, (surfaceIndices + surfaceStart * 4) as Pointer);
        }

        if (lineEnd > lineStart) {
          if (pendingWidth !== lineWidth) {
            lineWidth = pendingWidth;
            OpenGL32.glLineWidth(lineWidth);
          }

          OpenGL32.glDrawElements(GL.GL_LINES, lineEnd - lineStart, GL.GL_UNSIGNED_INT, (lineIndices + lineStart * 4) as Pointer);
        }
      }

      if (!done) {
        lineEnd = runs[offset + 9];
        lineStart = runs[offset + 8];
        pending = runs[offset];
        pendingWidth = runs[offset + 1];
        solidEnd = runs[offset + 5];
        solidStart = runs[offset + 4];
        surfaceEnd = runs[offset + 7];
        surfaceStart = runs[offset + 6];
      }
    }

    return clip;
  }

  /** Writes an ellipse into the scratch path; returns its point count (a circle's miters are its unit table) */
  #ellipsePath(x: number, y: number, radiusX: number, radiusY: number): number {
    const segments = this.#segmentsFor(max(radiusX, radiusY));
    const unit = unitCircle(segments);

    this.#ensurePath(segments);

    const path = this.#path;

    for (let p = 0; p < segments << 1; p += 2) {
      path[p] = x + unit[p] * radiusX;
      path[p + 1] = y + unit[p + 1] * radiusY;
    }

    return segments;
  }

  #ensureGlyphCanvas(width: number, height: number): void {
    if (width <= this.#glyphCanvasWidth && height <= this.#glyphCanvasHeight) {
      return;
    }

    height = max(height, this.#glyphCanvasHeight);
    width = max(width, this.#glyphCanvasWidth);

    const bitmapInfo = Buffer.alloc(0x28);
    bitmapInfo.writeUInt32LE(0x28, 0x00); // biSize
    bitmapInfo.writeInt32LE(width, 0x04); // biWidth
    bitmapInfo.writeInt32LE(-height, 0x08); // biHeight (top-down)
    bitmapInfo.writeUInt16LE(0x01, 0x0c); // biPlanes
    bitmapInfo.writeUInt16LE(0x20, 0x0e); // biBitCount = 32
    bitmapInfo.writeUInt32LE(0x00, 0x10); // biCompression = BI_RGB

    const bitsPointer = Buffer.alloc(8);
    const bitmap = GDI32.CreateDIBSection(this.#glyphDeviceContext, bitmapInfo.ptr, GL.DIB_RGB_COLORS, bitsPointer.ptr, 0n, 0);

    if (!bitmap) {
      throw new Error(`CreateDIBSection failed: ${Kernel32.GetLastError()}`);
    }

    GDI32.SelectObject(this.#glyphDeviceContext, bitmap);

    if (this.#glyphBitmap) {
      GDI32.DeleteObject(this.#glyphBitmap);
    }

    this.#glyphBitmap = bitmap;
    this.#glyphCanvas = new Uint8Array(toArrayBuffer(Number(bitsPointer.readBigUInt64LE()) as Pointer, 0, width * height * 4));
    this.#glyphCanvasHeight = height;
    this.#glyphCanvasWidth = width;
  }

  /** Grows every scratch buffer to hold `points` points */
  #ensurePath(points: number): void {
    if (points <= this.#order.length) {
      return;
    }

    let size = this.#order.length * 2;

    while (size < points) {
      size *= 2;
    }

    const miters = new Float64Array(size * 2);
    const normals = new Float64Array(size * 2);
    const path = new Float64Array(size * 2);
    const spare = new Float64Array(size * 2);
    const values = new Float64Array(size);

    miters.set(this.#miters);
    normals.set(this.#normals);
    path.set(this.#path);
    spare.set(this.#spare);
    values.set(this.#values);

    this.#miters = miters;
    this.#normals = normals;
    this.#order = new Int32Array(size);
    this.#path = path;
    this.#spare = spare;
    this.#values = values;
  }

  #enter2D(): void {
    const pointer = this.#vertices2D.ptr;

    OpenGL32.glMatrixMode(GL.GL_PROJECTION);
    OpenGL32.glLoadMatrixf(this.#orthographic.ptr);
    OpenGL32.glMatrixMode(GL.GL_MODELVIEW);
    OpenGL32.glLoadIdentity();

    OpenGL32.glDepthMask(GL.GL_FALSE);
    OpenGL32.glDisable(GL.GL_DEPTH_TEST);
    OpenGL32.glEnable(GL.GL_TEXTURE_2D);
    OpenGL32.glEnableClientState(GL.GL_TEXTURE_COORD_ARRAY);

    OpenGL32.glColorPointer(4, GL.GL_UNSIGNED_BYTE, 16, (pointer + 12) as Pointer);
    OpenGL32.glTexCoordPointer(2, GL.GL_SHORT, 16, (pointer + 8) as Pointer);
    OpenGL32.glVertexPointer(2, GL.GL_FLOAT, 16, pointer);
  }

  #enter3D(): void {
    const pointer = this.#vertices3D.ptr;

    OpenGL32.glMatrixMode(GL.GL_PROJECTION);
    OpenGL32.glLoadMatrixf(this.#projection.ptr);
    OpenGL32.glMatrixMode(GL.GL_MODELVIEW);
    OpenGL32.glLoadMatrixf(this.#view.ptr);

    OpenGL32.glDepthMask(GL.GL_TRUE);
    OpenGL32.glDisable(GL.GL_TEXTURE_2D);
    OpenGL32.glDisableClientState(GL.GL_TEXTURE_COORD_ARRAY);
    OpenGL32.glEnable(GL.GL_DEPTH_TEST);
    OpenGL32.glFrontFace(this.#frontFace);

    OpenGL32.glColorPointer(4, GL.GL_UNSIGNED_BYTE, 16, (pointer + 12) as Pointer);
    OpenGL32.glVertexPointer(3, GL.GL_FLOAT, 16, pointer);
  }

  /**
   * Fills `count` points of `source` (local space).
   * Ring k sits `offsets[k]` along the outward miter with `coverage[k]`; ring 0 bounds the interior.
   * `fan`: star-shaped from vertex 0, skip the convexity test. `miters`: precomputed outward miters, or null.
   * `rounded`: offset along unit normals (soft, round corners - shadows) and never inset a concave outline.
   */
  #fillPath(source: Float64Array, count: number, fan: boolean, miters: Float64Array | null, color: number, gradient: Gradient | null, offsets: Float64Array, coverage: Float64Array, rings: number, rounded: boolean): void {
    // A closing point that repeats the first is implied
    if (count > 3 && source[0] === source[(count - 1) << 1] && source[1] === source[((count - 1) << 1) + 1]) {
      count--;
    }

    if (count < 3) {
      return;
    }

    // Orientation (shoelace) and bounds
    let area = 0;
    let maximumX = -Infinity;
    let maximumY = -Infinity;
    let minimumX = Infinity;
    let minimumY = Infinity;

    for (let p = 0, q = (count - 1) << 1; p < count << 1; q = p, p += 2) {
      const x = source[p];
      const y = source[p + 1];

      area += source[q] * y - x * source[q + 1];

      if (x < minimumX) {
        minimumX = x;
      }

      if (x > maximumX) {
        maximumX = x;
      }

      if (y < minimumY) {
        minimumY = y;
      }

      if (y > maximumY) {
        maximumY = y;
      }
    }

    if (!(abs(area) > 1e-12)) {
      return;
    }

    const sign = area > 0 ? 1 : -1;
    const convex = fan || this.#convex(source, count, sign);

    // An inset concave outline folds over itself: rounded rings start at the edge and only grow outward
    if (rounded && !convex) {
      const shift = offsets[0];

      for (let ring = 0; ring < rings; ring++) {
        offsets[ring] -= shift;
      }
    }

    // Never inset past the middle of the shape
    const inset = min(maximumX - minimumX, maximumY - minimumY) * 0.5;

    for (let ring = 0; ring < rings; ring++) {
      if (offsets[ring] < -inset) {
        offsets[ring] = -inset;
      }
    }

    // Gradient parameter per vertex. Vertex interpolation is exact within one ramp segment, so convex shapes get
    // extra vertices where the color changes slope (linear) or extra rays for concentric rings (radial).
    const bands = gradient !== null && convex && gradient.kind !== 'radial' && !gradient.simple;
    const radial = gradient !== null && convex && gradient.kind === 'radial';

    let points = source;

    if (gradient !== null) {
      this.#prepareGradient(gradient, minimumX, minimumY, maximumX - minimumX, maximumY - minimumY);

      if (radial) {
        count = this.#subdivide(source, count, max(maximumX - minimumX, maximumY - minimumY) * 0.5);
        miters = null;
        points = this.#spare;
      } else if (bands) {
        count = this.#split(source, count, gradient);
        miters = null;
        points = this.#spare;
      } else {
        this.#ensurePath(count);

        const gradientOriginX = this.#gradientOriginX;
        const gradientOriginY = this.#gradientOriginY;
        const gradientScaleX = this.#gradientScaleX;
        const gradientScaleY = this.#gradientScaleY;
        const values = this.#values;
        const circular = gradient.kind === 'radial';

        for (let i = 0, p = 0; i < count; i++, p += 2) {
          const u = (source[p] - gradientOriginX) * gradientScaleX;
          const v = (source[p + 1] - gradientOriginY) * gradientScaleY;

          values[i] = circular ? sqrt(u * u + v * v) : u + v;
        }
      }
    }

    if (miters === null) {
      miters = this.#miter(points, count, sign);

      // Miters reach up to MITER_LIMIT at sharp corners: fine for a 1px feather, spikes under a blur
      if (rounded) {
        for (let p = 0; p < count << 1; p += 2) {
          const length = sqrt(miters[p] * miters[p] + miters[p + 1] * miters[p + 1]);

          if (length > 0) {
            miters[p] /= length;
            miters[p + 1] /= length;
          }
        }
      }
    }

    // Radial interior: concentric rings at each stop between the center and the edge
    let innerRings = 0;
    let maximumT = 0;

    if (radial) {
      for (let i = 0; i < count; i++) {
        maximumT = max(maximumT, this.#values[i]);
      }

      const stops = gradient!.offsets;

      for (let stop = 0; stop < stops.length; stop++) {
        if (stops[stop] > 0 && stops[stop] < maximumT) {
          innerRings++;
        }
      }
    }

    const stopCount = gradient !== null ? gradient.offsets.length : 0;
    const indexTotal = (rings - 1) * count * 6 + (radial ? count * 3 + innerRings * count * 6 : bands ? (count + 4 * (stopCount + 1)) * 3 : (count - 2) * 3);
    const vertexTotal = count * rings + (radial ? 1 + innerRings * count : bands ? count + 4 * (stopCount + 1) : 0);

    this.#reserve2D(vertexTotal, indexTotal);

    const indices = this.#indices;
    const transform = this.#transform;
    const vertices = this.#vertices2D;
    const words = this.#words2D;
    const a = transform[0];
    const alpha = this.#alpha;
    const b = transform[1];
    const base = this.#vertexCount2D;
    const c = transform[2];
    const d = transform[3];
    const e = transform[4];
    const f = transform[5];
    const pointValues = this.#values;

    let k = this.#indexCount;
    let o = base * STRIDE;

    // Rings: ring 0 bounds the interior, each further ring feathers outward
    for (let ring = 0; ring < rings; ring++) {
      const offset = offsets[ring];
      const weight = coverage[ring];

      if (gradient === null) {
        const ringColor = fadeColor(color, weight);

        for (let p = 0; p < count << 1; p += 2, o += STRIDE) {
          const x = points[p] + miters[p] * offset;
          const y = points[p + 1] + miters[p + 1] * offset;

          vertices[o] = a * x + c * y + e;
          vertices[o + 1] = b * x + d * y + f;
          words[o + 2] = WHITE_TEXEL;
          words[o + 3] = ringColor;
        }
      } else {
        const ringAlpha = alpha * weight;

        for (let i = 0, p = 0; i < count; i++, p += 2, o += STRIDE) {
          const x = points[p] + miters[p] * offset;
          const y = points[p + 1] + miters[p + 1] * offset;

          vertices[o] = a * x + c * y + e;
          vertices[o + 1] = b * x + d * y + f;
          words[o + 2] = WHITE_TEXEL;
          words[o + 3] = gradient.at(pointValues[i], ringAlpha);
        }
      }
    }

    for (let ring = 1; ring < rings; ring++) {
      const inner = base + (ring - 1) * count;
      const outer = inner + count;

      for (let i = 0; i < count; i++, k += 6) {
        const j = i + 1 === count ? 0 : i + 1;

        indices[k] = inner + i;
        indices[k + 1] = inner + j;
        indices[k + 2] = outer + j;
        indices[k + 3] = inner + i;
        indices[k + 4] = outer + j;
        indices[k + 5] = outer + i;
      }
    }

    const edge = offsets[0];

    if (radial) {
      // Center, then one ring per stop; ring positions are clamped to the edge along each ray
      const center = base + count * rings;
      const centerX = this.#gradientOriginX;
      const centerY = this.#gradientOriginY;
      const stops = gradient!.offsets;

      vertices[o] = a * centerX + c * centerY + e;
      vertices[o + 1] = b * centerX + d * centerY + f;
      words[o + 2] = WHITE_TEXEL;
      words[o + 3] = gradient!.at(0, alpha);
      o += STRIDE;

      let previous = center;

      for (let stop = 0; stop < stops.length; stop++) {
        const value = stops[stop];

        if (!(value > 0 && value < maximumT)) {
          continue;
        }

        const ringStart = (o / STRIDE) | 0;
        const stopColor = gradient!.stop(stop, alpha);

        for (let i = 0, p = 0; i < count; i++, p += 2, o += STRIDE) {
          const edgeX = points[p] + miters[p] * edge;
          const edgeY = points[p + 1] + miters[p + 1] * edge;
          const reach = pointValues[i] > value ? value / pointValues[i] : 1;
          const x = centerX + (edgeX - centerX) * reach;
          const y = centerY + (edgeY - centerY) * reach;

          vertices[o] = a * x + c * y + e;
          vertices[o + 1] = b * x + d * y + f;
          words[o + 2] = WHITE_TEXEL;
          words[o + 3] = reach < 1 ? stopColor : gradient!.at(pointValues[i], alpha);
        }

        k = this.#bridge(previous, ringStart, count, previous === center, k);
        previous = ringStart;
      }

      k = this.#bridge(previous, base, count, previous === center, k);
    } else if (bands) {
      // One convex piece per ramp segment, with its own vertices so hard stops stay hard
      const stops = gradient!.offsets;

      for (let band = 0; band <= stops.length; band++) {
        const lower = band === 0 ? -Infinity : stops[band - 1];
        const upper = band === stops.length ? Infinity : stops[band];

        if (band > 0 && band < stops.length && !(upper > lower)) {
          continue;
        }

        let first = -1;
        let previous = -1;

        for (let i = 0, p = 0; i < count; i++, p += 2) {
          const value = pointValues[i];

          if (value < lower || value > upper) {
            continue;
          }

          const vertex = (o / STRIDE) | 0;
          const x = points[p] + miters[p] * edge;
          const y = points[p + 1] + miters[p + 1] * edge;

          vertices[o] = a * x + c * y + e;
          vertices[o + 1] = b * x + d * y + f;
          words[o + 2] = WHITE_TEXEL;
          words[o + 3] = gradient!.band(value, band, alpha);
          o += STRIDE;

          if (first < 0) {
            first = vertex;
          } else if (previous >= 0) {
            indices[k] = first;
            indices[k + 1] = previous;
            indices[k + 2] = vertex;
            k += 3;
          }

          if (first !== vertex) {
            previous = vertex;
          }
        }
      }
    } else if (convex) {
      for (let i = 1; i < count - 1; i++, k += 3) {
        indices[k] = base;
        indices[k + 1] = base + i;
        indices[k + 2] = base + i + 1;
      }
    } else {
      k = this.#triangulate(points, count, sign, base, k);
    }

    this.#indexCount = k;
    this.#vertexCount2D = (o / STRIDE) | 0;
  }

  #fillResolved(source: Float64Array, count: number, fan: boolean, miters: Float64Array | null): void {
    const half = this.#fringe * 0.5;
    const offsets = this.#ringOffsets;

    offsets[0] = -half;
    offsets[1] = half;

    this.#fillPath(source, count, fan, miters, this.#fillColor, this.#gradientFill, offsets, EDGE_COVERAGE, half > 0 ? 2 : 1, false);
  }

  #font(face: string, size: number, weight: number): FontEntry {
    let sizes = this.#fonts.get(face);

    if (sizes === undefined) {
      sizes = new Map();
      this.#fonts.set(face, sizes);
    }

    const key = size * 1_000 + weight;

    let font = sizes.get(key);

    if (font !== undefined) {
      return font;
    }

    const faceName = Buffer.from(`${face}\0`, 'utf16le');
    const pixels = max(1, round(size));
    const handle = GDI32.CreateFontW(-pixels, 0, 0, 0, weight, 0, 0, 0, GL.DEFAULT_CHARSET, GL.OUT_TT_PRECIS, 0, GL.ANTIALIASED_QUALITY, 0, faceName.ptr);

    if (!handle) {
      throw new Error(`CreateFontW failed: ${Kernel32.GetLastError()}`);
    }

    if (!GDI32.SelectObject(this.#glyphDeviceContext, handle)) {
      GDI32.DeleteObject(handle);
      throw new Error(`SelectObject failed: ${Kernel32.GetLastError()}`);
    }

    this.#selectedFont = handle;

    // TEXTMETRICW: tmHeight, tmAscent, tmDescent
    if (!GDI32.GetTextMetricsW(this.#glyphDeviceContext, this.#metricsBuffer.ptr)) {
      throw new Error(`GetTextMetricsW failed: ${Kernel32.GetLastError()}`);
    }

    const metrics = this.#metricsBuffer;

    font = { ascent: metrics[1], descent: metrics[2], glyphs: new Array<Glyph | undefined>(256).fill(undefined), handle, height: metrics[0], margin: (pixels >> 1) + 2, others: new Map(), size: pixels };
    sizes.set(key, font);

    return font;
  }

  #glyph(font: FontEntry, code: number): Glyph {
    return (code < 256 ? font.glyphs[code] : font.others.get(code)) ?? this.#rasterize(font, code);
  }

  /** Emits one pass of glyph quads for `text` (lines, alignment, ellipsis truncation) */
  #glyphRun(text: string, font: FontEntry, x: number, y: number, align: number, maximumWidth: number, color: number, gradient: Gradient | null, alpha: number): void {
    const length = text.length;

    // Upper bound: every character plus an ellipsis per line
    this.#reserve2D((length * 2 + 1) * 4, (length * 2 + 1) * 6);

    const gradientOriginX = this.#gradientOriginX;
    const gradientOriginY = this.#gradientOriginY;
    const gradientScaleX = this.#gradientScaleX;
    const gradientScaleY = this.#gradientScaleY;
    const indices = this.#indices;
    const transform = this.#transform;
    const vertices = this.#vertices2D;
    const words = this.#words2D;
    const a = transform[0];
    const b = transform[1];
    const c = transform[2];
    const d = transform[3];
    const e = transform[4];
    const ellipsis = maximumWidth < Infinity ? this.#glyph(font, 0x2026) : null;
    const f = transform[5];
    const radial = gradient !== null && gradient.kind === 'radial';

    let baseline = y;
    let k = this.#indexCount;
    let o = this.#vertexCount2D * STRIDE;
    let start = 0;
    let vertex = this.#vertexCount2D;

    while (start <= length) {
      let end = start;

      while (end < length && text.charCodeAt(end) !== 10) {
        end++;
      }

      let cut = end;
      let truncated = false;
      let width = 0;

      if (align !== 0 || ellipsis !== null) {
        for (let i = start; i < end; i++) {
          width += this.#glyph(font, text.charCodeAt(i)).advance;
        }

        if (ellipsis !== null && width > maximumWidth) {
          const limit = maximumWidth - ellipsis.advance;

          width = 0;

          for (cut = start; cut < end; cut++) {
            const advance = this.#glyph(font, text.charCodeAt(cut)).advance;

            if (width + advance > limit) {
              break;
            }

            width += advance;
          }

          truncated = true;
          width += ellipsis.advance;
        }
      }

      let pen = x - width * align;

      for (let i = start; i <= cut; i++) {
        const glyph = i < cut ? this.#glyph(font, text.charCodeAt(i)) : truncated ? ellipsis! : null;

        if (glyph === null) {
          break;
        }

        if (glyph.width !== 0) {
          const left = pen + glyph.x;
          const top = baseline + glyph.y;
          const bottom = top + glyph.height;
          const right = left + glyph.width;

          vertices[o] = a * left + c * top + e;
          vertices[o + 1] = b * left + d * top + f;
          words[o + 2] = glyph.topLeft;
          vertices[o + 4] = a * right + c * top + e;
          vertices[o + 5] = b * right + d * top + f;
          words[o + 6] = glyph.topRight;
          vertices[o + 8] = a * right + c * bottom + e;
          vertices[o + 9] = b * right + d * bottom + f;
          words[o + 10] = glyph.bottomRight;
          vertices[o + 12] = a * left + c * bottom + e;
          vertices[o + 13] = b * left + d * bottom + f;
          words[o + 14] = glyph.bottomLeft;

          if (gradient === null) {
            words[o + 3] = color;
            words[o + 7] = color;
            words[o + 11] = color;
            words[o + 15] = color;
          } else {
            const bottomY = (bottom - gradientOriginY) * gradientScaleY;
            const leftX = (left - gradientOriginX) * gradientScaleX;
            const rightX = (right - gradientOriginX) * gradientScaleX;
            const topY = (top - gradientOriginY) * gradientScaleY;

            words[o + 3] = gradient.at(radial ? sqrt(leftX * leftX + topY * topY) : leftX + topY, alpha);
            words[o + 7] = gradient.at(radial ? sqrt(rightX * rightX + topY * topY) : rightX + topY, alpha);
            words[o + 11] = gradient.at(radial ? sqrt(rightX * rightX + bottomY * bottomY) : rightX + bottomY, alpha);
            words[o + 15] = gradient.at(radial ? sqrt(leftX * leftX + bottomY * bottomY) : leftX + bottomY, alpha);
          }

          indices[k] = vertex;
          indices[k + 1] = vertex + 1;
          indices[k + 2] = vertex + 2;
          indices[k + 3] = vertex;
          indices[k + 4] = vertex + 2;
          indices[k + 5] = vertex + 3;

          k += 6;
          o += 16;
          vertex += 4;
        }

        pen += glyph.advance;
      }

      baseline += font.height;
      start = end + 1;
    }

    this.#indexCount = k;
    this.#vertexCount2D = vertex;
  }

  #growIndices(source: Uint32Array<ArrayBuffer>, required: number): Uint32Array<ArrayBuffer> {
    let capacity = source.length * 2;

    while (capacity < required) {
      capacity *= 2;
    }

    const indices = new Uint32Array(capacity);
    indices.set(source);

    return indices;
  }

  #initializeGL(colorKeyValue: number, verticalSync: boolean): void {
    const height = this.height;
    const orthographic = this.#orthographic;
    const renderMode = this.renderMode;
    const texture = this.#texture;
    const width = this.width;

    OpenGL32.glViewport(0, 0, width, height);

    // Disable expensive features not needed for overlays
    OpenGL32.glDisable(GL.GL_DEPTH_TEST);
    OpenGL32.glDisable(GL.GL_DITHER);
    OpenGL32.glDisable(GL.GL_LINE_SMOOTH);
    OpenGL32.glDisable(GL.GL_POLYGON_SMOOTH);
    OpenGL32.glDisable(GL.GL_SAMPLE_ALPHA_TO_COVERAGE);

    // Pre-multiplied alpha in every mode: exact layered-window compositing, fringe-free gradients
    OpenGL32.glBlendFunc(GL.GL_ONE, GL.GL_ONE_MINUS_SRC_ALPHA);
    OpenGL32.glDepthFunc(GL.GL_LEQUAL);
    OpenGL32.glEnable(GL.GL_BLEND);

    // Color key is all-or-nothing: drop partial coverage instead of blending it with the key color
    if (renderMode === 'colorkey') {
      OpenGL32.glAlphaFunc(GL.GL_GREATER, 0.5);
      OpenGL32.glEnable(GL.GL_ALPHA_TEST);
    }

    // Interleaved client arrays, enabled once
    OpenGL32.glEnableClientState(GL.GL_COLOR_ARRAY);
    OpenGL32.glEnableClientState(GL.GL_VERTEX_ARRAY);

    // Readback rows land at the DIB stride, so sub-rectangles read in place
    OpenGL32.glPixelStorei(GL.GL_PACK_ALIGNMENT, 4);
    OpenGL32.glPixelStorei(GL.GL_PACK_ROW_LENGTH, width);
    OpenGL32.glPixelStorei(GL.GL_UNPACK_ALIGNMENT, 4);

    // Atlas texture: texels are addressed in integer units, the texture matrix normalizes them
    OpenGL32.glBindTexture(GL.GL_TEXTURE_2D, texture);
    OpenGL32.glTexParameteri(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_MAG_FILTER, GL.GL_LINEAR);
    OpenGL32.glTexParameteri(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_MIN_FILTER, GL.GL_LINEAR);
    OpenGL32.glTexParameteri(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_WRAP_S, GL.GL_CLAMP_TO_EDGE);
    OpenGL32.glTexParameteri(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_WRAP_T, GL.GL_CLAMP_TO_EDGE);

    // 2D projection: glOrtho(0, width, height, 0, -1, 1)
    orthographic[0] = 2 / width;
    orthographic[5] = -2 / height;
    orthographic[10] = -1;
    orthographic[12] = -1;
    orthographic[13] = 1;
    orthographic[15] = 1;

    // Clear color depends on mode
    if (renderMode === 'colorkey') {
      OpenGL32.glClearColor((colorKeyValue & 0xff) / 255, ((colorKeyValue >> 8) & 0xff) / 255, ((colorKeyValue >> 16) & 0xff) / 255, 1);
    } else {
      OpenGL32.glClearColor(0, 0, 0, 0);
    }

    OpenGL32.glClearDepth(1.0);
    OpenGL32.glClear(GL.GL_COLOR_BUFFER_BIT | GL.GL_DEPTH_BUFFER_BIT);

    // Swap interval (WGL_EXT_swap_control): SwapBuffers waits for vblank only when asked to
    const swapInterval = OpenGL32.wglGetProcAddress(Buffer.from('wglSwapIntervalEXT\0').ptr);

    if (swapInterval) {
      CFunction({ args: [FFIType.i32], ptr: swapInterval, returns: FFIType.i32 })(verticalSync ? 1 : 0);
    }
  }

  #measure(text: string, font: FontEntry, maximumWidth: number): number {
    let widest = 0;
    let width = 0;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);

      if (code === 10) {
        widest = max(widest, width);
        width = 0;
      } else {
        width += this.#glyph(font, code).advance;
      }
    }

    return min(max(widest, width), maximumWidth);
  }

  /** Outward miters for a closed path of `count` points (into `miters`) */
  #miter(points: Float64Array, count: number, sign: number): Float64Array {
    const last = (count - 1) << 1;
    const miters = this.#miters;

    // The closing edge seeds the previous normal
    let deltaX = points[0] - points[last];
    let deltaY = points[1] - points[last + 1];
    let length = sqrt(deltaX * deltaX + deltaY * deltaY);
    let previousX = length > 0 ? (sign * deltaY) / length : 0;
    let previousY = length > 0 ? (-sign * deltaX) / length : 0;

    for (let i = 0, p = 0; i < count; i++, p += 2) {
      const q = i + 1 === count ? 0 : p + 2;

      deltaX = points[q] - points[p];
      deltaY = points[q + 1] - points[p + 1];
      length = sqrt(deltaX * deltaX + deltaY * deltaY);

      const normalX = length > 0 ? (sign * deltaY) / length : previousX;
      const normalY = length > 0 ? (-sign * deltaX) / length : previousY;

      let miterX = (previousX + normalX) * 0.5;
      let miterY = (previousY + normalY) * 0.5;

      const squared = miterX * miterX + miterY * miterY;

      if (squared > 1e-6) {
        const scale = min(1 / squared, MITER_SCALE_LIMIT);

        miterX *= scale;
        miterY *= scale;
      }

      miters[p] = miterX;
      miters[p + 1] = miterY;
      previousX = normalX;
      previousY = normalY;
    }

    return miters;
  }

  /** Closes the current run and opens one with the current clip and line width */
  #openRun(): void {
    if (this.#runCount > 0) {
      this.#closeRun();
    }

    const offset = this.#runCount * RUN_STRIDE;

    if (offset + RUN_STRIDE > this.#runs.length) {
      const runs = new Float64Array(this.#runs.length * 2);
      runs.set(this.#runs);
      this.#runs = runs;
    }

    const runs = this.#runs;

    runs[offset] = this.#clipIndex;
    runs[offset + 1] = this.#lineWidth;
    runs[offset + 2] = this.#indexCount;
    runs[offset + 3] = this.#indexCount;
    runs[offset + 4] = this.#solidCount;
    runs[offset + 5] = this.#solidCount;
    runs[offset + 6] = this.#surfaceCount;
    runs[offset + 7] = this.#surfaceCount;
    runs[offset + 8] = this.#lineCount;
    runs[offset + 9] = this.#lineCount;

    this.#runCount++;
    this.#runDirty = false;
  }

  #pathPoint(x: number, y: number): void {
    const offset = this.#userCount << 1;

    if (offset + 2 > this.#userPath.length) {
      const userPath = new Float64Array(this.#userPath.length * 2);
      userPath.set(this.#userPath);
      this.#userPath = userPath;
    }

    this.#userCount++;
    this.#userPath[offset] = x;
    this.#userPath[offset + 1] = y;
  }

  /** Copies 2D points into the scratch path; returns their count */
  #points(points: Points2D): number {
    const flat = points.length > 0 && typeof points[0] === 'number';
    const count = flat ? points.length >> 1 : points.length;

    this.#ensurePath(count);

    const path = this.#path;

    if (flat) {
      const values = points as ArrayLike<number>;

      for (let i = 0; i < count << 1; i++) {
        path[i] = values[i];
      }
    } else {
      const list = points as readonly { x: number; y: number }[];

      for (let i = 0, p = 0; i < count; i++, p += 2) {
        path[p] = list[i].x;
        path[p + 1] = list[i].y;
      }
    }

    return count;
  }

  /** Writes 3D points and reserves indices; returns the first vertex */
  #points3D(points: Points3D, flat: boolean, count: number, color: number, surface: number, lines: number): number {
    this.#reserve3D(count, 0, surface, lines);

    const vertices = this.#vertices3D;
    const words = this.#words3D;
    const base = this.#vertexCount3D;

    for (let i = 0, o = base * STRIDE; i < count; i++, o += STRIDE) {
      if (flat) {
        const values = points as ArrayLike<number>;

        vertices[o] = values[i * 3];
        vertices[o + 1] = values[i * 3 + 1];
        vertices[o + 2] = values[i * 3 + 2];
      } else {
        const point = (points as readonly Point3D[])[i];

        vertices[o] = point.x;
        vertices[o + 1] = point.y;
        vertices[o + 2] = point.z;
      }

      words[o + 3] = color;
    }

    this.#vertexCount3D = base + count;

    return base;
  }

  /** Maps a gradient onto the local bounds of the shape being drawn */
  #prepareGradient(gradient: Gradient, x: number, y: number, width: number, height: number): void {
    if (gradient.kind === 'radial') {
      this.#gradientOriginX = x + width * 0.5;
      this.#gradientOriginY = y + height * 0.5;
      this.#gradientScaleX = width > 0 ? 2 / width : 0;
      this.#gradientScaleY = height > 0 ? 2 / height : 0;
      return;
    }

    // CSS gradient line: through the center, long enough that the corners take the end colors
    const directionX = sin(gradient.angle);
    const directionY = -cos(gradient.angle);
    const length = abs(width * directionX) + abs(height * directionY);

    this.#gradientOriginX = x + width * 0.5 - directionX * length * 0.5;
    this.#gradientOriginY = y + height * 0.5 - directionY * length * 0.5;
    this.#gradientScaleX = length > 0 ? directionX / length : 0;
    this.#gradientScaleY = length > 0 ? directionY / length : 0;
  }

  /** Reads back the region that changed since the last frame and updates only that part of the layered window */
  #presentLayered(): void {
    const { height, width } = this;

    let bottom = 0;
    let left = width;
    let right = 0;
    let top = height;

    if (this.#has3D) {
      bottom = height;
      left = 0;
      right = width;
      top = 0;
    } else if (this.#vertexCount2D > 0) {
      const end = this.#vertexCount2D * STRIDE;
      const vertices = this.#vertices2D;

      let maximumX = -Infinity;
      let maximumY = -Infinity;
      let minimumX = Infinity;
      let minimumY = Infinity;

      for (let o = 0; o < end; o += STRIDE) {
        const x = vertices[o];
        const y = vertices[o + 1];

        if (x < minimumX) {
          minimumX = x;
        }

        if (x > maximumX) {
          maximumX = x;
        }

        if (y < minimumY) {
          minimumY = y;
        }

        if (y > maximumY) {
          maximumY = y;
        }
      }

      // Linear filtering can reach one pixel past a vertex
      bottom = min(height, ceil(maximumY) + 1);
      left = max(0, floor(minimumX) - 1);
      right = min(width, ceil(maximumX) + 1);
      top = max(0, floor(minimumY) - 1);
    }

    const previousBottom = this.#previousBottom;
    const previousLeft = this.#previousLeft;
    const previousRight = this.#previousRight;
    const previousTop = this.#previousTop;

    this.#previousBottom = bottom;
    this.#previousLeft = left;
    this.#previousRight = right;
    this.#previousTop = top;

    // Whatever was drawn last frame must be erased from the window this frame
    if (previousRight > previousLeft && previousBottom > previousTop) {
      if (right > left && bottom > top) {
        bottom = max(bottom, previousBottom);
        left = min(left, previousLeft);
        right = max(right, previousRight);
        top = min(top, previousTop);
      } else {
        bottom = previousBottom;
        left = previousLeft;
        right = previousRight;
        top = previousTop;
      }
    }

    if (right <= left || bottom <= top) {
      return;
    }

    // Both GL and the DIB are bottom-up: read the rectangle in place
    const bottomRow = height - bottom;
    const rectangle = this.#dirtyRectangle;

    OpenGL32.glReadPixels(left, bottomRow, right - left, bottom - top, GL.GL_BGRA, GL.GL_UNSIGNED_BYTE, (this.#pixels + (bottomRow * width + left) * 4) as Pointer);

    rectangle[0] = left;
    rectangle[1] = top;
    rectangle[2] = right;
    rectangle[3] = bottom;

    if (!User32.UpdateLayeredWindowIndirect(this.#window, this.#layeredPointer)) {
      throw new Error(`UpdateLayeredWindowIndirect failed: ${Kernel32.GetLastError()}`);
    }
  }

  /** Writes a textured quadrilateral (4 vertices, 6 indices) - space must be reserved */
  #quadrilateral(left: number, top: number, right: number, bottom: number, topLeft: number, topRight: number, bottomRight: number, bottomLeft: number, color: number): void {
    const indices = this.#indices;
    const transform = this.#transform;
    const vertices = this.#vertices2D;
    const words = this.#words2D;
    const a = transform[0];
    const b = transform[1];
    const c = transform[2];
    const d = transform[3];
    const e = transform[4];
    const f = transform[5];
    const k = this.#indexCount;
    const o = this.#vertexCount2D * STRIDE;
    const vertex = this.#vertexCount2D;

    vertices[o] = a * left + c * top + e;
    vertices[o + 1] = b * left + d * top + f;
    words[o + 2] = topLeft;
    words[o + 3] = color;
    vertices[o + 4] = a * right + c * top + e;
    vertices[o + 5] = b * right + d * top + f;
    words[o + 6] = topRight;
    words[o + 7] = color;
    vertices[o + 8] = a * right + c * bottom + e;
    vertices[o + 9] = b * right + d * bottom + f;
    words[o + 10] = bottomRight;
    words[o + 11] = color;
    vertices[o + 12] = a * left + c * bottom + e;
    vertices[o + 13] = b * left + d * bottom + f;
    words[o + 14] = bottomLeft;
    words[o + 15] = color;

    indices[k] = vertex;
    indices[k + 1] = vertex + 1;
    indices[k + 2] = vertex + 2;
    indices[k + 3] = vertex;
    indices[k + 4] = vertex + 2;
    indices[k + 5] = vertex + 3;

    this.#indexCount = k + 6;
    this.#vertexCount2D = vertex + 4;
  }

  /** Renders one glyph with GDI (grayscale anti-aliasing), trims it and copies its coverage into the atlas */
  #rasterize(font: FontEntry, code: number): Glyph {
    let glyph: Glyph;

    if (code < 32 || (code >= 127 && code < 160)) {
      // Control characters: only tab advances (four spaces)
      glyph = { advance: code === 9 ? this.#glyph(font, 32).advance * 4 : 0, bottomLeft: 0, bottomRight: 0, height: 0, topLeft: 0, topRight: 0, width: 0, x: 0, y: 0 };
    } else {
      const glyphDeviceContext = this.#glyphDeviceContext;
      const { margin } = font;
      const cellHeight = font.height + margin * 2;
      const cellWidth = font.size * 2 + margin * 2;

      this.#ensureGlyphCanvas(cellWidth, cellHeight);

      if (this.#selectedFont !== font.handle) {
        GDI32.SelectObject(glyphDeviceContext, font.handle);
        this.#selectedFont = font.handle;
      }

      const canvas = this.#glyphCanvas;
      const stride = this.#glyphCanvasWidth * 4;

      canvas.fill(0, 0, cellHeight * stride);
      this.#characterBuffer[0] = code;

      if (!GDI32.TextOutW(glyphDeviceContext, margin, margin, this.#characterBuffer.ptr, 1)) {
        throw new Error(`TextOutW failed: ${Kernel32.GetLastError()}`);
      }

      GDI32.GdiFlush();

      if (!GDI32.GetCharWidth32W(glyphDeviceContext, code, code, this.#widthBuffer.ptr)) {
        throw new Error(`GetCharWidth32W failed: ${Kernel32.GetLastError()}`);
      }

      const advance = this.#widthBuffer[0];

      // Coverage bounds (grayscale anti-aliasing writes equal R, G, B - read G)
      let maximumX = -1;
      let maximumY = -1;
      let minimumX = cellWidth;
      let minimumY = cellHeight;

      for (let row = 0; row < cellHeight; row++) {
        for (let column = 0, index = row * stride + 1; column < cellWidth; column++, index += 4) {
          if (canvas[index] !== 0) {
            maximumX = max(maximumX, column);
            maximumY = row;
            minimumX = min(minimumX, column);
            minimumY = min(minimumY, row);
          }
        }
      }

      if (maximumX < 0) {
        glyph = { advance, bottomLeft: 0, bottomRight: 0, height: 0, topLeft: 0, topRight: 0, width: 0, x: 0, y: 0 };
      } else {
        // One transparent texel of padding on every side keeps linear filtering from bleeding
        const height = maximumY - minimumY + 3;
        const width = maximumX - minimumX + 3;
        const slot = this.#allocate(width, height);
        const u = slot & 0xffff;
        const v = slot >>> 16;
        const atlas = this.#atlas;

        for (let row = minimumY; row <= maximumY; row++) {
          for (let column = minimumX, source = row * stride + minimumX * 4 + 1, target = ((v + 1 + row - minimumY) * ATLAS_WIDTH + u + 1) * 4; column <= maximumX; column++, source += 4, target += 4) {
            const coverage = canvas[source];

            atlas[target] = coverage;
            atlas[target + 1] = coverage;
            atlas[target + 2] = coverage;
            atlas[target + 3] = coverage;
          }
        }

        glyph = {
          advance,
          bottomLeft: u | ((v + height) << 16),
          bottomRight: (u + width) | ((v + height) << 16),
          height,
          topLeft: u | (v << 16),
          topRight: (u + width) | (v << 16),
          width,
          x: minimumX - margin - 1,
          y: minimumY - margin - font.ascent - 1,
        };
      }
    }

    if (code < 256) {
      font.glyphs[code] = glyph;
    } else {
      font.others.set(code, glyph);
    }

    return glyph;
  }

  /** Ensures room for 2D geometry in the current run */
  #reserve2D(vertices: number, indices: number): void {
    if (this.#runDirty) {
      this.#openRun();
    }

    const vertexNeed = this.#vertexCount2D + vertices;

    if (vertexNeed * STRIDE > this.#vertices2D.length) {
      let capacity = this.#vertices2D.length * 2;

      while (capacity < vertexNeed * STRIDE) {
        capacity *= 2;
      }

      const words = new Uint32Array(capacity);
      words.set(this.#words2D);

      this.#vertices2D = new Float32Array(words.buffer);
      this.#words2D = words;
    }

    if (this.#indexCount + indices > this.#indices.length) {
      this.#indices = this.#growIndices(this.#indices, this.#indexCount + indices);
    }
  }

  /** Ensures room for 3D geometry in the current run */
  #reserve3D(vertices: number, solid: number, surface: number, lines: number): void {
    if (this.#runDirty) {
      this.#openRun();
    }

    this.#has3D = true;

    const vertexNeed = this.#vertexCount3D + vertices;

    if (vertexNeed * STRIDE > this.#vertices3D.length) {
      let capacity = this.#vertices3D.length * 2;

      while (capacity < vertexNeed * STRIDE) {
        capacity *= 2;
      }

      const words = new Uint32Array(capacity);
      words.set(this.#words3D);

      this.#vertices3D = new Float32Array(words.buffer);
      this.#words3D = words;
    }

    if (this.#lineCount + lines > this.#lineIndices.length) {
      this.#lineIndices = this.#growIndices(this.#lineIndices, this.#lineCount + lines);
    }

    if (this.#solidCount + solid > this.#solidIndices.length) {
      this.#solidIndices = this.#growIndices(this.#solidIndices, this.#solidCount + solid);
    }

    if (this.#surfaceCount + surface > this.#surfaceIndices.length) {
      this.#surfaceIndices = this.#growIndices(this.#surfaceIndices, this.#surfaceCount + surface);
    }
  }

  /** Starts the next frame: empty streams, identity transform, no clip */
  #reset(): void {
    this.#clipCount = 1;
    this.#clipIndex = 0;
    this.#depth = 0;
    this.globalAlpha = 1;
    this.#has3D = false;
    this.#indexCount = 0;
    this.#lineCount = 0;
    this.#runCount = 0;
    this.#runDirty = true;
    this.#solidCount = 0;
    this.#surfaceCount = 0;
    this.#vertexCount2D = 0;
    this.#vertexCount3D = 0;
    this.resetTransform();
  }

  /** Resolves `style` into fill/stroke paint and options. A bare paint strokes when `strokeShorthand`, else fills. */
  #resolve(style: Style | undefined, strokeShorthand: boolean): void {
    let fill: Paint | undefined;
    let opacity = 1;
    let stroke: Paint | undefined;

    this.#cap = CAP_BUTT;
    this.#dash = undefined;
    this.#dashOffset = 0;
    this.#radius = 0;
    this.#segments = 0;
    this.#shadow = undefined;
    this.#strokeWidth = this.#lineWidth;

    if (style === undefined || typeof style !== 'object' || style instanceof Gradient || (style as RGBA).r !== undefined) {
      if (strokeShorthand) {
        stroke = (style as Paint | undefined) ?? WHITE;
      } else {
        fill = (style as Paint | undefined) ?? WHITE;
      }
    } else {
      const shape = style as ShapeStyle;

      fill = shape.fill;
      stroke = shape.stroke;

      if (fill === undefined && stroke === undefined) {
        if (strokeShorthand) {
          stroke = WHITE;
        } else {
          fill = WHITE;
        }
      }

      if (shape.cap !== undefined) {
        this.#cap = shape.cap === 'round' ? CAP_ROUND : shape.cap === 'square' ? CAP_SQUARE : CAP_BUTT;
      }

      if (shape.strokeWidth !== undefined) {
        this.#strokeWidth = shape.strokeWidth;
      }

      opacity = shape.opacity ?? 1;
      this.#dash = shape.dash;
      this.#dashOffset = shape.dashOffset ?? 0;
      this.#radius = shape.radius ?? 0;
      this.#segments = shape.segments ?? 0;
      this.#shadow = shape.shadow;
    }

    const alpha = (this.#alpha = this.globalAlpha * opacity);

    this.#hasFill = false;
    this.#hasStroke = false;

    if (fill !== undefined && alpha > 0) {
      if (fill instanceof Gradient) {
        this.#gradientFill = fill;
        this.#hasFill = true;
      } else {
        this.#fillColor = fadeColor(packColor(fill), alpha);
        this.#gradientFill = null;
        this.#hasFill = this.#fillColor !== 0;
      }
    }

    if (stroke !== undefined && alpha > 0 && this.#strokeWidth > 0) {
      if (stroke instanceof Gradient) {
        this.#gradientStroke = stroke;
        this.#hasStroke = true;
      } else {
        this.#gradientStroke = null;
        this.#strokeColor = fadeColor(packColor(stroke), alpha);
        this.#hasStroke = this.#strokeColor !== 0;
      }
    }
  }

  /** Writes a (rounded) rectangle into the scratch path with exact miters; returns its point count */
  #roundedRectangle(x: number, y: number, width: number, height: number, radius: number): number {
    radius = min(radius, width * 0.5, height * 0.5);

    if (!(radius * this.#pixelScale >= 0.5)) {
      this.#ensurePath(4);

      const path = this.#path;

      path[0] = x;
      path[1] = y;
      path[2] = x + width;
      path[3] = y;
      path[4] = x + width;
      path[5] = y + height;
      path[6] = x;
      path[7] = y + height;
      this.#miters.set(RECTANGLE_MITERS);

      return 4;
    }

    const segments = (this.#segmentsFor(radius) + 3) & ~3;
    const quarter = segments >> 2;
    const count = (quarter + 1) * 4;
    const unit = unitCircle(segments);

    this.#ensurePath(count);

    const bottom = y + height - radius;
    const left = x + radius;
    const miters = this.#miters;
    const path = this.#path;
    const right = x + width - radius;
    const top = y + radius;

    // Corners clockwise on screen from the top-left, each a quarter of the unit table
    for (let corner = 0, o = 0; corner < 4; corner++) {
      const centerX = corner === 1 || corner === 2 ? right : left;
      const centerY = corner >= 2 ? bottom : top;
      const first = ((corner + 2) & 3) * quarter;

      for (let s = 0; s <= quarter; s++, o += 2) {
        const u = ((first + s) % segments) << 1;

        miters[o] = unit[u];
        miters[o + 1] = unit[u + 1];
        path[o] = centerX + unit[u] * radius;
        path[o + 1] = centerY + unit[u + 1] * radius;
      }
    }

    return count;
  }

  /** Applies clip `target` (0: none) over the active clip; returns the new active clip */
  #scissor(target: number, active: number): number {
    if (target === active) {
      return active;
    }

    if (target === 0) {
      OpenGL32.glDisable(GL.GL_SCISSOR_TEST);
      return 0;
    }

    const c = target << 2;
    const clips = this.#clips;

    if (active === 0) {
      OpenGL32.glEnable(GL.GL_SCISSOR_TEST);
    }

    OpenGL32.glScissor(clips[c], this.height - clips[c + 3], clips[c + 2] - clips[c], clips[c + 3] - clips[c + 1]);

    return target;
  }

  /** Circle segments for a local radius under the current scale (or the style's `segments`) */
  #segmentsFor(radius: number): number {
    if (this.#segments > 2) {
      return this.#segments | 0;
    }

    const pixels = radius * this.#pixelScale;

    return pixels >= 1_024 ? 256 : CIRCLE_SEGMENTS[pixels | 0];
  }

  /** Fills the resolved shadow under `count` points of `source`, offset in device space */
  #shadowPath(source: Float64Array, count: number, fan: boolean, miters: Float64Array | null, spread: number): void {
    const shadow = this.#shadow!;
    const blur = max(0, shadow.blur ?? 8);
    const color = fadeColor(packColor(shadow.color ?? 0x0000_0080), this.#alpha);

    if (color === 0) {
      return;
    }

    const offsets = this.#ringOffsets;

    let coverage = SHADOW_COVERAGE;
    let rings = 5;

    if (blur > 0) {
      for (let ring = 0; ring < 5; ring++) {
        offsets[ring] = spread + blur * SHADOW_OFFSETS[ring];
      }
    } else {
      const half = this.#fringe * 0.5;

      coverage = EDGE_COVERAGE;
      offsets[0] = spread - half;
      offsets[1] = spread + half;
      rings = half > 0 ? 2 : 1;
    }

    const transform = this.#transform;
    const e = transform[4];
    const f = transform[5];

    transform[4] += shadow.x ?? 0;
    transform[5] += shadow.y ?? 2;

    this.#fillPath(source, count, fan, miters, color, null, offsets, coverage, rings, true);

    transform[4] = e;
    transform[5] = f;
  }

  /** 3D paints are solid: gradients contribute their first stop */
  #solid(color: number, gradient: Gradient | null): number {
    return gradient === null ? color : gradient.at(0, this.#alpha);
  }

  /** Inserts points where edges cross gradient stops (into `spare`, with parameters in `values`) */
  #split(source: Float64Array, count: number, gradient: Gradient): number {
    const stops = gradient.offsets;

    this.#ensurePath(count * (stops.length + 1));

    const gradientOriginX = this.#gradientOriginX;
    const gradientOriginY = this.#gradientOriginY;
    const gradientScaleX = this.#gradientScaleX;
    const gradientScaleY = this.#gradientScaleY;
    const spare = this.#spare;
    const values = this.#values;

    let n = 0;
    let previous = (source[0] - gradientOriginX) * gradientScaleX + (source[1] - gradientOriginY) * gradientScaleY;

    for (let i = 0, p = 0; i < count; i++, p += 2) {
      const from = previous;
      const q = i + 1 === count ? 0 : p + 2;
      const to = (source[q] - gradientOriginX) * gradientScaleX + (source[q + 1] - gradientOriginY) * gradientScaleY;

      spare[n << 1] = source[p];
      spare[(n << 1) + 1] = source[p + 1];
      values[n++] = from;

      if (from !== to) {
        const ascending = to > from;

        for (let s = 0; s < stops.length; s++) {
          const stop = stops[ascending ? s : stops.length - 1 - s];

          // Once per distinct offset, strictly between the ends
          if ((ascending ? stop > from && stop < to : stop < from && stop > to) && (s === 0 || stop !== stops[ascending ? s - 1 : stops.length - s])) {
            const weight = (stop - from) / (to - from);

            spare[n << 1] = source[p] + (source[q] - source[p]) * weight;
            spare[(n << 1) + 1] = source[p + 1] + (source[q + 1] - source[p + 1]) * weight;
            values[n++] = stop;
          }
        }
      }

      previous = to;
    }

    return n;
  }

  /**
   * Strokes `count` points of `points` (local space) as feathered triangles: 4 vertices across (fade, core, core,
   * fade), 3 for hairlines thinner than the feather, 2 without anti-aliasing.
   * `distance` and `length` place this piece along the whole path for stroke gradients (0 = self).
   */
  #strokePath(points: Float64Array, count: number, closed: boolean, miters: Float64Array | null, color: number, gradient: Gradient | null, distance: number, length: number): void {
    // Repeated points have no direction; precomputed miters imply clean input
    if (miters === null) {
      let kept = 1;

      for (let i = 1; i < count; i++) {
        const p = i << 1;
        const q = (kept - 1) << 1;

        if (points[p] !== points[q] || points[p + 1] !== points[q + 1]) {
          points[kept << 1] = points[p];
          points[(kept << 1) + 1] = points[p + 1];
          kept++;
        }
      }

      count = kept;

      if (closed && count > 2 && points[0] === points[(count - 1) << 1] && points[1] === points[((count - 1) << 1) + 1]) {
        count--;
      }
    }

    const width = this.#strokeWidth;
    const half = width * 0.5;

    if (count < 2) {
      if (count === 1 && this.#cap !== CAP_BUTT) {
        this.#dot(points[0], points[1], half, gradient === null ? color : gradient.at(distance / (length || 1), this.#alpha));
      }

      return;
    }

    if (closed && count < 3) {
      closed = false;
    }

    this.#ensurePath(count + 1);

    const normals = this.#normals;
    const values = this.#values;
    const segments = closed ? count : count - 1;

    // Unit left normals per segment, running distance per point
    let total = 0;

    for (let p = 0, s = 0; s < segments; p += 2, s++) {
      const q = s + 1 === count ? 0 : p + 2;
      const deltaX = points[q] - points[p];
      const deltaY = points[q + 1] - points[p + 1];
      const segmentLength = sqrt(deltaX * deltaX + deltaY * deltaY);

      values[s] = total;
      total += segmentLength;

      if (segmentLength > 0) {
        normals[p] = -deltaY / segmentLength;
        normals[p + 1] = deltaX / segmentLength;
      } else {
        normals[p] = s > 0 ? normals[p - 2] : 0;
        normals[p + 1] = s > 0 ? normals[p - 1] : 0;
      }
    }

    if (!closed) {
      values[count - 1] = total;
    }

    // Miters: average of the neighboring normals, scaled so the stroke keeps its width through the join
    const m = miters === null ? this.#miters : miters;

    if (miters === null) {
      for (let i = 0, p = 0; i < count; i++, p += 2) {
        const after = closed || i < count - 1 ? p : p - 2;
        const before = closed ? (i === 0 ? (segments - 1) << 1 : p - 2) : i === 0 ? 0 : p - 2;

        let miterX = (normals[before] + normals[after]) * 0.5;
        let miterY = (normals[before + 1] + normals[after + 1]) * 0.5;

        const squared = miterX * miterX + miterY * miterY;

        if (squared > 1e-6) {
          const scale = min(1 / squared, MITER_SCALE_LIMIT);

          miterX *= scale;
          miterY *= scale;
        }

        m[p] = miterX;
        m[p + 1] = miterY;
      }
    }

    const cap = closed ? CAP_BUTT : this.#cap;
    const lastSegment = (segments - 1) << 1;

    // Square caps extend the ends by half the width along the stroke
    if (cap === CAP_SQUARE) {
      const end = (count - 1) << 1;

      points[0] -= normals[1] * half;
      points[1] += normals[0] * half;
      points[end] += normals[lastSegment + 1] * half;
      points[end + 1] -= normals[lastSegment] * half;
    }

    // Cross-section rows
    const fringe = this.#fringe;
    const rowOffsets = this.#rowOffsets;
    const rowOpaque = this.#rowOpaque;

    let fade = 1;
    let rows = 2;

    if (fringe === 0) {
      rowOffsets[0] = half;
      rowOffsets[1] = -half;
      rowOpaque[0] = 1;
      rowOpaque[1] = 1;
    } else if (width > fringe) {
      const inner = (width - fringe) * 0.5;

      rowOffsets[0] = inner + fringe;
      rowOffsets[1] = inner;
      rowOffsets[2] = -inner;
      rowOffsets[3] = -inner - fringe;
      rowOpaque[0] = 0;
      rowOpaque[1] = 1;
      rowOpaque[2] = 1;
      rowOpaque[3] = 0;
      rows = 4;
    } else {
      // Hairline: fade the core so coverage still integrates to the requested width
      fade = width / fringe;
      rowOffsets[0] = fringe;
      rowOffsets[1] = 0;
      rowOffsets[2] = -fringe;
      rowOpaque[0] = 0;
      rowOpaque[1] = 1;
      rowOpaque[2] = 0;
      rows = 3;
    }

    const roundCaps = cap === CAP_ROUND && rows !== 3 && !closed;
    const capSteps = roundCaps ? max(2, this.#segmentsFor(half) >> 1) : 0;
    const endFringe = !closed && !roundCaps && fringe > 0;
    const capIndices = roundCaps ? capSteps * (rows === 4 ? 9 : 3) : endFringe ? (rows - 1) * 6 : 0;
    const capVertices = roundCaps ? 1 + (capSteps - 1) * (rows === 4 ? 2 : 1) : endFringe ? rows : 0;

    this.#reserve2D(count * rows + capVertices * 2, segments * (rows - 1) * 6 + capIndices * 2);

    const gradientOriginX = this.#gradientOriginX;
    const gradientOriginY = this.#gradientOriginY;
    const gradientScaleX = this.#gradientScaleX;
    const gradientScaleY = this.#gradientScaleY;
    const indices = this.#indices;
    const transform = this.#transform;
    const vertices = this.#vertices2D;
    const words = this.#words2D;
    const a = transform[0];
    const alpha = this.#alpha * fade;
    const along = gradient !== null && gradient.kind === 'stroke';
    const b = transform[1];
    const base = this.#vertexCount2D;
    const c = transform[2];
    const d = transform[3];
    const e = transform[4];
    const f = transform[5];
    const pathLength = length > 0 ? length : total;
    const radial = gradient !== null && gradient.kind === 'radial';
    const solid = gradient === null ? fadeColor(color, fade) : 0;

    let k = this.#indexCount;
    let o = base * STRIDE;

    for (let i = 0, p = 0; i < count; i++, p += 2) {
      const miterX = m[p];
      const miterY = m[p + 1];
      const x = points[p];
      const y = points[p + 1];

      let pointColor = solid;

      if (gradient !== null) {
        if (along) {
          pointColor = gradient.at(pathLength > 0 ? (distance + values[i]) / pathLength : 0, alpha);
        } else {
          const u = (x - gradientOriginX) * gradientScaleX;
          const v = (y - gradientOriginY) * gradientScaleY;

          pointColor = gradient.at(radial ? sqrt(u * u + v * v) : u + v, alpha);
        }
      }

      for (let row = 0; row < rows; row++, o += STRIDE) {
        const offset = rowOffsets[row];
        const rowX = x + miterX * offset;
        const rowY = y + miterY * offset;

        vertices[o] = a * rowX + c * rowY + e;
        vertices[o + 1] = b * rowX + d * rowY + f;
        words[o + 2] = WHITE_TEXEL;
        words[o + 3] = rowOpaque[row] ? pointColor : 0;
      }
    }

    for (let s = 0; s < segments; s++) {
      const from = base + s * rows;
      const to = base + (s + 1 === count ? 0 : s + 1) * rows;

      for (let row = 0; row < rows - 1; row++, k += 6) {
        indices[k] = from + row;
        indices[k + 1] = from + row + 1;
        indices[k + 2] = to + row + 1;
        indices[k + 3] = from + row;
        indices[k + 4] = to + row + 1;
        indices[k + 5] = to + row;
      }
    }

    let vertex = base + count * rows;

    if (roundCaps || endFringe) {
      for (let end = 0; end < 2; end++) {
        const point = end === 0 ? 0 : count - 1;
        const p = point << 1;
        const row = base + point * rows;
        // Outward along the stroke: backwards at the start, forwards at the end
        const segment = end === 0 ? 0 : lastSegment;
        const normalX = m[p];
        const normalY = m[p + 1];
        const outwardX = end === 0 ? -normals[segment + 1] : normals[segment + 1];
        const outwardY = end === 0 ? normals[segment] : -normals[segment];
        const pointColor = words[(row + (rows === 4 ? 1 : 0)) * STRIDE + 3];
        const x = points[p];
        const y = points[p + 1];

        o = vertex * STRIDE;

        if (roundCaps) {
          // Half disc from the left edge around the tip to the right edge, sharing the end row's vertices
          const center = vertex;
          const inner = rows === 4 ? rowOffsets[1] : half;
          const outer = rows === 4 ? rowOffsets[0] : 0;
          const step = PI / capSteps;
          const stepCosine = cos(step);
          const stepSine = sin(step);

          vertices[o] = a * x + c * y + e;
          vertices[o + 1] = b * x + d * y + f;
          words[o + 2] = WHITE_TEXEL;
          words[o + 3] = pointColor;
          o += STRIDE;
          vertex++;

          let previousFringe = row;
          let previousRim = rows === 4 ? row + 1 : row;
          let rimCosine = 1;
          let rimSine = 0;

          for (let j = 1; j <= capSteps; j++) {
            let fringeVertex = 0;
            let rim: number;

            if (j === capSteps) {
              fringeVertex = row + 3;
              rim = rows === 4 ? row + 2 : row + 1;
            } else {
              const next = rimCosine * stepCosine - rimSine * stepSine;

              rimSine = rimSine * stepCosine + rimCosine * stepSine;
              rimCosine = next;

              const directionX = normalX * rimCosine + outwardX * rimSine;
              const directionY = normalY * rimCosine + outwardY * rimSine;
              const rimX = x + directionX * inner;
              const rimY = y + directionY * inner;

              rim = vertex++;
              vertices[o] = a * rimX + c * rimY + e;
              vertices[o + 1] = b * rimX + d * rimY + f;
              words[o + 2] = WHITE_TEXEL;
              words[o + 3] = pointColor;
              o += STRIDE;

              if (rows === 4) {
                const fringeX = x + directionX * outer;
                const fringeY = y + directionY * outer;

                fringeVertex = vertex++;
                vertices[o] = a * fringeX + c * fringeY + e;
                vertices[o + 1] = b * fringeX + d * fringeY + f;
                words[o + 2] = WHITE_TEXEL;
                words[o + 3] = 0;
                o += STRIDE;
              }
            }

            indices[k] = center;
            indices[k + 1] = previousRim;
            indices[k + 2] = rim;
            k += 3;

            if (rows === 4) {
              indices[k] = previousRim;
              indices[k + 1] = previousFringe;
              indices[k + 2] = fringeVertex;
              indices[k + 3] = previousRim;
              indices[k + 4] = fringeVertex;
              indices[k + 5] = rim;
              k += 6;
            }

            previousFringe = fringeVertex;
            previousRim = rim;
          }
        } else {
          // Butt/square ends: a transparent row one feather beyond the end fades the cut edge
          const extra = vertex;

          for (let r = 0; r < rows; r++, o += STRIDE) {
            const offset = rowOffsets[r];
            const rowX = x + normalX * offset + outwardX * fringe;
            const rowY = y + normalY * offset + outwardY * fringe;

            vertices[o] = a * rowX + c * rowY + e;
            vertices[o + 1] = b * rowX + d * rowY + f;
            words[o + 2] = WHITE_TEXEL;
            words[o + 3] = 0;
          }

          vertex += rows;

          for (let r = 0; r < rows - 1; r++, k += 6) {
            indices[k] = row + r;
            indices[k + 1] = row + r + 1;
            indices[k + 2] = extra + r + 1;
            indices[k + 3] = row + r;
            indices[k + 4] = extra + r + 1;
            indices[k + 5] = extra + r;
          }
        }
      }
    }

    this.#indexCount = k;
    this.#vertexCount2D = vertex;
  }

  #strokeResolved(count: number, closed: boolean, miters: Float64Array | null): void {
    const gradient = this.#gradientStroke;

    if (gradient !== null && gradient.kind !== 'stroke') {
      const path = this.#path;

      let maximumX = -Infinity;
      let maximumY = -Infinity;
      let minimumX = Infinity;
      let minimumY = Infinity;

      for (let p = 0; p < count << 1; p += 2) {
        maximumX = max(maximumX, path[p]);
        maximumY = max(maximumY, path[p + 1]);
        minimumX = min(minimumX, path[p]);
        minimumY = min(minimumY, path[p + 1]);
      }

      this.#prepareGradient(gradient, minimumX, minimumY, maximumX - minimumX, maximumY - minimumY);
    }

    if (this.#dash !== undefined && this.#dash.length > 0) {
      this.#dashed(count, closed, this.#strokeColor, gradient);
    } else {
      this.#strokePath(this.#path, count, closed, miters, this.#strokeColor, gradient, 0, 0);
    }
  }

  /** Splits long edges so rays from the center are at most ~7.5° apart (into `spare`, radial parameters in `values`) */
  #subdivide(source: Float64Array, count: number, reach: number): number {
    const limit = max(1e-6, reach * 0.13);

    let total = 0;

    for (let i = 0, p = 0; i < count; i++, p += 2) {
      const q = i + 1 === count ? 0 : p + 2;
      const deltaX = source[q] - source[p];
      const deltaY = source[q + 1] - source[p + 1];

      total += max(1, ceil(sqrt(deltaX * deltaX + deltaY * deltaY) / limit));
    }

    this.#ensurePath(total);

    const gradientOriginX = this.#gradientOriginX;
    const gradientOriginY = this.#gradientOriginY;
    const gradientScaleX = this.#gradientScaleX;
    const gradientScaleY = this.#gradientScaleY;
    const spare = this.#spare;
    const values = this.#values;

    let n = 0;

    for (let i = 0, p = 0; i < count; i++, p += 2) {
      const q = i + 1 === count ? 0 : p + 2;
      const deltaX = source[q] - source[p];
      const deltaY = source[q + 1] - source[p + 1];
      const pieces = max(1, ceil(sqrt(deltaX * deltaX + deltaY * deltaY) / limit));

      for (let piece = 0; piece < pieces; n++, piece++) {
        const x = source[p] + (deltaX * piece) / pieces;
        const y = source[p + 1] + (deltaY * piece) / pieces;
        const u = (x - gradientOriginX) * gradientScaleX;
        const v = (y - gradientOriginY) * gradientScaleY;

        spare[n << 1] = x;
        spare[(n << 1) + 1] = y;
        values[n] = sqrt(u * u + v * v);
      }
    }

    return n;
  }

  /** Copies subpath `index` into the scratch path; returns its point count */
  #subpath(index: number): number {
    const end = index + 1 < this.#subpathCount ? this.#subpaths[(index + 1) << 1] : this.#userCount;
    const first = this.#subpaths[index << 1];
    const count = end - first;

    this.#ensurePath(count);
    this.#path.set(this.#userPath.subarray(first << 1, end << 1));

    return count;
  }

  /** Ear clipping for concave polygons (O(n²)); writes indices over ring 0 starting at `base` */
  #triangulate(points: Float64Array, count: number, sign: number, base: number, k: number): number {
    const indices = this.#indices;
    const order = this.#order;

    for (let i = 0; i < count; i++) {
      order[i] = i;
    }

    let index = 0;
    let remaining = count;
    let stall = 0;

    while (remaining > 3 && stall < remaining) {
      const current = order[index];
      const next = order[index + 1 === remaining ? 0 : index + 1];
      const previous = order[index === 0 ? remaining - 1 : index - 1];

      const ax = points[previous << 1];
      const ay = points[(previous << 1) + 1];
      const bx = points[current << 1];
      const by = points[(current << 1) + 1];
      const cx = points[next << 1];
      const cy = points[(next << 1) + 1];

      let ear = ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) * sign > 0;

      for (let n = 0; ear && n < remaining; n++) {
        const vertex = order[n];

        if (vertex === previous || vertex === current || vertex === next) {
          continue;
        }

        const pointX = points[vertex << 1];
        const pointY = points[(vertex << 1) + 1];

        ear = !(((bx - ax) * (pointY - ay) - (by - ay) * (pointX - ax)) * sign > 0 && ((cx - bx) * (pointY - by) - (cy - by) * (pointX - bx)) * sign > 0 && ((ax - cx) * (pointY - cy) - (ay - cy) * (pointX - cx)) * sign > 0);
      }

      if (ear) {
        indices[k] = base + previous;
        indices[k + 1] = base + current;
        indices[k + 2] = base + next;
        k += 3;

        order.copyWithin(index, index + 1, remaining);
        remaining--;
        stall = 0;

        if (index === remaining) {
          index = 0;
        }
      } else {
        index = index + 1 === remaining ? 0 : index + 1;
        stall++;
      }
    }

    // Final triangle (or a fan over whatever self-intersecting input left behind)
    for (let n = 1; n + 1 < remaining; n++, k += 3) {
      indices[k] = base + order[0];
      indices[k + 1] = base + order[n];
      indices[k + 2] = base + order[n + 1];
    }

    return k;
  }

  #updateScale(): void {
    const transform = this.#transform;
    const determinant = abs(transform[0] * transform[3] - transform[1] * transform[2]);

    this.#pixelScale = determinant > 0 ? sqrt(determinant) : 1;
    this.#fringe = this.#antialias ? 1 / this.#pixelScale : 0;
  }

  #updateViewProjection(): void {
    const projection = this.#projection;
    const view = this.#view;
    const viewProjection = this.#viewProjection;

    for (let column = 0; column < 4; column++) {
      for (let row = 0; row < 4; row++) {
        viewProjection[column * 4 + row] = projection[row] * view[column * 4] + projection[4 + row] * view[column * 4 + 1] + projection[8 + row] * view[column * 4 + 2] + projection[12 + row] * view[column * 4 + 3];
      }
    }

    // Outward-wound solids face the camera counter-clockwise unless the transform mirrors
    // (the standard right-handed pipeline has a negative upper 3x3 determinant)
    const m = viewProjection;
    const determinant = m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);

    this.#frontFace = determinant < 0 ? GL.GL_CCW : GL.GL_CW;
  }

  /** Uploads atlas rows written since the last frame (or the whole atlas after it grew) */
  #uploadAtlas(): void {
    const atlas = this.#atlas;
    const atlasHeight = this.#atlasHeight;

    if (this.#atlasResized) {
      OpenGL32.glTexImage2D(GL.GL_TEXTURE_2D, 0, GL.GL_RGBA, ATLAS_WIDTH, atlasHeight, 0, GL.GL_RGBA, GL.GL_UNSIGNED_BYTE, atlas.ptr);

      OpenGL32.glMatrixMode(GL.GL_TEXTURE);
      OpenGL32.glLoadIdentity();
      OpenGL32.glScalef(1 / ATLAS_WIDTH, 1 / atlasHeight, 1);
      OpenGL32.glMatrixMode(GL.GL_MODELVIEW);

      this.#atlasResized = false;
    } else if (this.#atlasDirtyBottom > this.#atlasDirtyTop) {
      const top = this.#atlasDirtyTop;

      OpenGL32.glTexSubImage2D(GL.GL_TEXTURE_2D, 0, 0, top, ATLAS_WIDTH, this.#atlasDirtyBottom - top, GL.GL_RGBA, GL.GL_UNSIGNED_BYTE, (atlas.ptr + top * ATLAS_WIDTH * 4) as Pointer);
    }

    this.#atlasDirtyBottom = 0;
    this.#atlasDirtyTop = atlasHeight;
  }

  /**
   * Draw an arc (radians, clockwise on screen). A bare paint strokes it; `fill` draws a pie slice.
   * Round caps and a thick stroke make a progress ring.
   * @example
   * ```ts
   * overlay.arc(80, 80, 32, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2, { cap: 'round', stroke: '#7cf29a', strokeWidth: 6 });
   * ```
   */
  public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, style?: Style): void {
    this.#resolve(style, true);

    const sweep = endAngle - startAngle;

    if (!(radius > 0) || sweep === 0) {
      return;
    }

    if (abs(sweep) >= TAU) {
      if (this.#hasFill) {
        const count = this.#ellipsePath(x, y, radius, radius);
        this.#fillResolved(this.#path, count, true, unitCircle(count));
      }

      if (this.#hasStroke) {
        const count = this.#ellipsePath(x, y, radius, radius);
        this.#strokeResolved(count, true, unitCircle(count));
      }

      return;
    }

    const steps = max(2, ceil((this.#segmentsFor(radius) * abs(sweep)) / TAU));

    if (this.#hasFill) {
      const count = this.#arcPath(x, y, radius, startAngle, sweep, steps, true);
      this.#fillResolved(this.#path, count, true, null);
    }

    if (this.#hasStroke) {
      const count = this.#arcPath(x, y, radius, startAngle, sweep, steps, false);
      this.#strokeResolved(count, false, null);
    }
  }

  /**
   * Start a new path (Canvas-style). Subpaths fill and stroke independently.
   * @example
   * ```ts
   * overlay.beginPath();
   * overlay.moveTo(20, 120);
   * overlay.bezierCurveTo(60, 20, 140, 20, 180, 120);
   * overlay.stroke({ cap: 'round', stroke: '#ffcc00', strokeWidth: 3 });
   * ```
   */
  public beginPath(): void {
    this.#subpathCount = 0;
    this.#userCount = 0;
  }

  /**
   * Cubic Bézier to (x, y), flattened adaptively (Wang's formula, forward differencing).
   * @example
   * ```ts
   * overlay.bezierCurveTo(60, 20, 140, 20, 180, 120);
   * ```
   */
  public bezierCurveTo(control1X: number, control1Y: number, control2X: number, control2Y: number, x: number, y: number): void {
    if (!this.#continuePath(control1X, control1Y)) {
      return;
    }

    const last = (this.#userCount - 1) << 1;
    const startX = this.#userPath[last];
    const startY = this.#userPath[last + 1];

    // Wang's formula: segments for a 0.25px flatness bound
    const firstX = startX - 2 * control1X + control2X;
    const firstY = startY - 2 * control1Y + control2Y;
    const secondX = control1X - 2 * control2X + x;
    const secondY = control1Y - 2 * control2Y + y;
    const bend = sqrt(max(firstX * firstX + firstY * firstY, secondX * secondX + secondY * secondY));
    const steps = min(256, max(1, ceil(sqrt(3 * bend * this.#pixelScale))));
    const step = 1 / steps;
    const step2 = step * step;
    const step3 = step2 * step;

    // B(t) = a t³ + b t² + c t + p0, stepped with three forward differences (6 additions per point)
    const ax = x - startX + 3 * (control1X - control2X);
    const ay = y - startY + 3 * (control1Y - control2Y);
    const bx = 3 * (startX - 2 * control1X + control2X);
    const by = 3 * (startY - 2 * control1Y + control2Y);
    const cx = 3 * (control1X - startX);
    const cy = 3 * (control1Y - startY);
    const thirdDeltaX = 6 * ax * step3;
    const thirdDeltaY = 6 * ay * step3;

    let deltaX = ax * step3 + bx * step2 + cx * step;
    let deltaY = ay * step3 + by * step2 + cy * step;
    let pointX = startX;
    let pointY = startY;
    let secondDeltaX = 6 * ax * step3 + 2 * bx * step2;
    let secondDeltaY = 6 * ay * step3 + 2 * by * step2;

    for (let i = 1; i < steps; i++) {
      pointX += deltaX;
      pointY += deltaY;
      deltaX += secondDeltaX;
      deltaY += secondDeltaY;
      secondDeltaX += thirdDeltaX;
      secondDeltaY += thirdDeltaY;
      this.#pathPoint(pointX, pointY);
    }

    this.#pathPoint(x, y);
  }

  /**
   * Draw a 3D box (rectangular prism). A bare paint fills it; add `stroke` for edges.
   * @example
   * ```ts
   * overlay.box(x - 16, y, z - 16, 32, 72, 32, { fill: '#ff526320', stroke: '#ff5263' });
   * ```
   */
  public box(x: number, y: number, z: number, width: number, height: number, depth: number, style?: Style): void {
    this.#resolve(style, false);

    if (this.#hasFill) {
      const base = this.#corners3D(x, y, z, width, height, depth, 8, this.#solid(this.#fillColor, this.#gradientFill), 36, 0);
      const indices = this.#solidIndices;

      for (let i = 0, k = this.#solidCount; i < 36; i++) {
        indices[k + i] = base + BOX_TRIANGLES[i];
      }

      this.#solidCount += 36;
    }

    if (this.#hasStroke) {
      const base = this.#corners3D(x, y, z, width, height, depth, 8, this.#solid(this.#strokeColor, this.#gradientStroke), 0, 24);
      const indices = this.#lineIndices;

      for (let i = 0, k = this.#lineCount; i < 24; i++) {
        indices[k + i] = base + BOX_EDGES[i];
      }

      this.#lineCount += 24;
    }
  }

  /**
   * Copy the last presented frame as top-down, pre-multiplied RGBA: screenshots, tests, visual verification.
   * @example
   * ```ts
   * overlay.update();
   * const rgba = overlay.capture(); // width * height * 4 bytes
   * ```
   */
  public capture(target = new Uint8Array(this.width * this.height * 4)): Uint8Array {
    const height = this.height;
    const size = this.width * height * 4;
    const stride = this.width * 4;

    if (target.length < size) {
      throw new Error(`capture expects at least ${size} bytes, got ${target.length}`);
    }

    // Both sources are BGRA, bottom-up: the layered window's DIB, or the front buffer SwapBuffers presented
    let source: Uint8Array;

    if (this.renderMode === 'alpha') {
      source = new Uint8Array(toArrayBuffer(this.#pixels as Pointer, 0, size));
    } else {
      if (this.#closed) {
        throw new Error('capture called after close');
      }

      if (OpenGL32.wglGetCurrentContext() !== this.#renderingContext && !OpenGL32.wglMakeCurrent(this.#deviceContext, this.#renderingContext)) {
        throw new Error(`wglMakeCurrent failed: ${Kernel32.GetLastError()}`);
      }

      source = new Uint8Array(size);
      OpenGL32.glReadBuffer(GL.GL_FRONT);
      OpenGL32.glReadPixels(0, 0, this.width, height, GL.GL_BGRA, GL.GL_UNSIGNED_BYTE, source.ptr);
      OpenGL32.glReadBuffer(GL.GL_BACK);
    }

    for (let row = 0; row < height; row++) {
      for (let from = (height - 1 - row) * stride, to = row * stride, end = to + stride; to < end; from += 4, to += 4) {
        target[to] = source[from + 2];
        target[to + 1] = source[from + 1];
        target[to + 2] = source[from];
        target[to + 3] = source[from + 3];
      }
    }

    return target;
  }

  /**
   * Draw a 2D circle. A bare paint fills it.
   * @example
   * ```ts
   * overlay.circle(160, 160, 6, { fill: '#ffffff', shadow: { blur: 10, color: '#4ca6ffcc', y: 0 } });
   * ```
   */
  public circle(x: number, y: number, radius: number, style?: Style): void {
    this.#resolve(style, false);

    if (!(radius > 0)) {
      return;
    }

    if (this.#hasFill) {
      const shadow = this.#shadow;

      if (shadow !== undefined) {
        const shadowRadius = radius + (shadow.spread ?? 0);

        if (shadowRadius > 0) {
          const count = this.#ellipsePath(x, y, shadowRadius, shadowRadius);
          this.#shadowPath(this.#path, count, true, unitCircle(count), 0);
        }
      }

      const count = this.#ellipsePath(x, y, radius, radius);
      this.#fillResolved(this.#path, count, true, unitCircle(count));
    }

    if (this.#hasStroke) {
      const count = this.#ellipsePath(x, y, radius, radius);
      this.#strokeResolved(count, true, unitCircle(count));
    }
  }

  /**
   * Restrict drawing to a rectangle (intersected with the current clip, transformed to its screen bounds).
   * Wrap it in save()/restore() to lift it.
   * @example
   * ```ts
   * overlay.save();
   * overlay.clip(20, 20, 200, 12);
   * overlay.rectangle(glintX, 20, 14, 12, '#ffffff80');
   * overlay.restore();
   * ```
   */
  public clip(x: number, y: number, width: number, height: number): void {
    const transform = this.#transform;

    let maximumX = -Infinity;
    let maximumY = -Infinity;
    let minimumX = Infinity;
    let minimumY = Infinity;

    for (let corner = 0; corner < 4; corner++) {
      const cornerX = corner & 1 ? x + width : x;
      const cornerY = corner & 2 ? y + height : y;
      const deviceX = transform[0] * cornerX + transform[2] * cornerY + transform[4];
      const deviceY = transform[1] * cornerX + transform[3] * cornerY + transform[5];

      maximumX = max(maximumX, deviceX);
      maximumY = max(maximumY, deviceY);
      minimumX = min(minimumX, deviceX);
      minimumY = min(minimumY, deviceY);
    }

    let bottom = min(this.height, ceil(maximumY));
    let left = max(0, floor(minimumX));
    let right = min(this.width, ceil(maximumX));
    let top = max(0, floor(minimumY));

    if (this.#clipIndex !== 0) {
      const c = this.#clipIndex << 2;

      bottom = min(bottom, this.#clips[c + 3]);
      left = max(left, this.#clips[c]);
      right = min(right, this.#clips[c + 2]);
      top = max(top, this.#clips[c + 1]);
    }

    const offset = this.#clipCount << 2;

    if (offset + 4 > this.#clips.length) {
      const clips = new Int32Array(this.#clips.length * 2);
      clips.set(this.#clips);
      this.#clips = clips;
    }

    const clips = this.#clips;

    clips[offset] = left;
    clips[offset + 1] = top;
    clips[offset + 2] = max(left, right);
    clips[offset + 3] = max(top, bottom);

    this.#clipIndex = this.#clipCount++;
    this.#runDirty = true;
  }

  /**
   * Close the overlay and release all resources.
   * @example
   * ```ts
   * process.on('SIGINT', () => overlay.close());
   * ```
   */
  public close(): void {
    if (this.#closed) {
      return;
    }

    this.#closed = true;

    OpenGL32.wglMakeCurrent(this.#deviceContext, this.#renderingContext);
    OpenGL32.glDeleteTextures(1, new Uint32Array([this.#texture]).ptr);

    // Make context not current before deleting
    OpenGL32.wglMakeCurrent(0n, 0n);
    OpenGL32.wglDeleteContext(this.#renderingContext);

    // Fonts and bitmaps can only be deleted once no DC selects them
    GDI32.DeleteDC(this.#glyphDeviceContext);

    for (const sizes of this.#fonts.values()) {
      for (const font of sizes.values()) {
        GDI32.DeleteObject(font.handle);
      }
    }

    this.#fonts.clear();

    if (this.#glyphBitmap) {
      GDI32.DeleteObject(this.#glyphBitmap);
    }

    if (this.#offscreenDeviceContext) {
      GDI32.DeleteDC(this.#offscreenDeviceContext);
      GDI32.DeleteObject(this.#offscreenBitmap);
    }

    User32.ReleaseDC(this.#window, this.#deviceContext);
    User32.DestroyWindow(this.#window);
  }

  /**
   * Close the current subpath.
   * @example
   * ```ts
   * overlay.closePath();
   * ```
   */
  public closePath(): void {
    if (this.#subpathCount > 0) {
      this.#subpaths[((this.#subpathCount - 1) << 1) + 1] = 1;
    }
  }

  /**
   * Pack straight-alpha RGBA pixels into the atlas. Images batch with shapes and text: no texture switches.
   * @example
   * ```ts
   * const icon = overlay.createImage(2, 1, new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]));
   * overlay.image(icon, 40, 40, 32, 16);
   * ```
   */
  public createImage(width: number, height: number, pixels: ArrayLike<number>): Image {
    height |= 0;
    width |= 0;

    if (width <= 0 || height <= 0 || pixels.length < width * height * 4) {
      throw new Error(`createImage expects ${width * height * 4} RGBA bytes for ${width}x${height}, got ${pixels.length}`);
    }

    const slot = this.#allocate(width + 2, height + 2);
    const u = (slot & 0xffff) + 1;
    const v = (slot >>> 16) + 1;
    const atlas = this.#atlas;

    for (let row = 0; row < height; row++) {
      for (let column = 0, source = row * width * 4, target = ((v + row) * ATLAS_WIDTH + u) * 4; column < width; column++, source += 4, target += 4) {
        const a = pixels[source + 3];

        atlas[target] = ((pixels[source] * a + 128) * 257) >>> 16;
        atlas[target + 1] = ((pixels[source + 1] * a + 128) * 257) >>> 16;
        atlas[target + 2] = ((pixels[source + 2] * a + 128) * 257) >>> 16;
        atlas[target + 3] = a;
      }
    }

    return { height, u, v, width };
  }

  /**
   * Draw a 2D ellipse. A bare paint fills it.
   * @example
   * ```ts
   * overlay.ellipse(200, 120, 80, 30, { stroke: '#ffffff60', strokeWidth: 1.5 });
   * ```
   */
  public ellipse(x: number, y: number, radiusX: number, radiusY: number, style?: Style): void {
    this.#resolve(style, false);

    if (!(radiusX > 0 && radiusY > 0)) {
      return;
    }

    if (this.#hasFill) {
      if (this.#shadow !== undefined) {
        const count = this.#ellipsePath(x, y, radiusX, radiusY);
        this.#shadowPath(this.#path, count, true, null, this.#shadow.spread ?? 0);
      }

      const count = this.#ellipsePath(x, y, radiusX, radiusY);
      this.#fillResolved(this.#path, count, true, null);
    }

    if (this.#hasStroke) {
      const count = this.#ellipsePath(x, y, radiusX, radiusY);
      this.#strokeResolved(count, true, null);
    }
  }

  /**
   * Fill every subpath of the current path. A bare paint fills.
   * @example
   * ```ts
   * overlay.fill({ fill: overlay.linearGradient(['#7cf29a80', '#7cf29a00']) });
   * ```
   */
  public fill(style?: Style): void {
    this.#resolve(style, false);

    if (!this.#hasFill) {
      return;
    }

    for (let subpath = 0; subpath < this.#subpathCount; subpath++) {
      const count = this.#subpath(subpath);

      if (count > 2) {
        if (this.#shadow !== undefined) {
          this.#shadowPath(this.#path, count, false, null, this.#shadow.spread ?? 0);
        }

        this.#fillResolved(this.#path, count, false, null);
      }
    }
  }

  /**
   * Hide the overlay. While hidden, update() skips rendering entirely.
   * @example
   * ```ts
   * if (!gameFocused) overlay.hide();
   * ```
   */
  public hide(): void {
    User32.ShowWindow(this.#window, GL.SW_HIDE);
    this.#hidden = true;
  }

  /**
   * Draw an image from createImage(), optionally scaled and tinted.
   * @example
   * ```ts
   * overlay.image(icon, 16, 16, 24, 24, '#ffffffc0');
   * ```
   */
  public image(image: Image, x: number, y: number, width = image.width, height = image.height, tint?: Color): void {
    const color = fadeColor(tint === undefined ? WHITE : packColor(tint), this.globalAlpha);

    if (color === 0) {
      return;
    }

    this.#reserve2D(4, 6);

    const { u, v } = image;
    const bottom = v + image.height;
    const right = u + image.width;

    this.#quadrilateral(x, y, x + width, y + height, u | (v << 16), right | (v << 16), right | (bottom << 16), u | (bottom << 16), color);
  }

  /**
   * Draw a 2D line. A bare paint strokes it.
   * @example
   * ```ts
   * overlay.line(10, 10, 300, 80, { cap: 'round', stroke: '#4ca6ff', strokeWidth: 2 });
   * ```
   */
  public line(x1: number, y1: number, x2: number, y2: number, style?: Style): void {
    this.#resolve(style, true);

    if (!this.#hasStroke) {
      return;
    }

    this.#ensurePath(2);

    const path = this.#path;
    path[0] = x1;
    path[1] = y1;
    path[2] = x2;
    path[3] = y2;

    this.#strokeResolved(2, false, null);
  }

  /**
   * Draw a 3D line (width from setLineWidth).
   * @example
   * ```ts
   * overlay.line3D(0, 0, 0, 0, 0, 100, '#ff5263');
   * ```
   */
  public line3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: Color = WHITE): void {
    const packed = fadeColor(packColor(color), this.globalAlpha);

    if (packed === 0) {
      return;
    }

    this.#reserve3D(2, 0, 0, 2);

    const lineIndices = this.#lineIndices;
    const vertices = this.#vertices3D;
    const words = this.#words3D;
    const base = this.#vertexCount3D;
    const o = base * STRIDE;

    vertices[o] = x1;
    vertices[o + 1] = y1;
    vertices[o + 2] = z1;
    words[o + 3] = packed;
    vertices[o + 4] = x2;
    vertices[o + 5] = y2;
    vertices[o + 6] = z2;
    words[o + 7] = packed;

    lineIndices[this.#lineCount] = base;
    lineIndices[this.#lineCount + 1] = base + 1;

    this.#lineCount += 2;
    this.#vertexCount3D = base + 2;
  }

  /**
   * Straight segment to (x, y).
   * @example
   * ```ts
   * overlay.lineTo(120, 40);
   * ```
   */
  public lineTo(x: number, y: number): void {
    if (this.#continuePath(x, y)) {
      this.#pathPoint(x, y);
    }
  }

  /**
   * Linear gradient across each shape's bounds (CSS `linear-gradient`). Create once, reuse every frame.
   * @param angle Degrees: 0 = to top, 90 = to right, 180 = to bottom (default)
   * @example
   * ```ts
   * const panel = overlay.linearGradient(['#1f2a38f0', '#0b1016f0']);
   * overlay.rectangle(20, 20, 280, 120, { fill: panel, radius: 10 });
   * ```
   */
  public linearGradient(stops: readonly GradientStop[], angle = 180): Gradient {
    return new Gradient('linear', stops, angle);
  }

  /**
   * Measure the widest line of `text`.
   * @example
   * ```ts
   * const width = overlay.measureText('Health: 100', { size: 18, weight: 700 });
   * ```
   */
  public measureText(text: string, style?: TextStyle): number {
    return this.#measure(text, this.#font(style?.font ?? 'Arial', style?.size ?? 16, style?.weight ?? 400), style?.maximumWidth ?? Infinity);
  }

  /**
   * Move the overlay (screen pixels) and re-assert it above other topmost windows.
   * @example
   * ```ts
   * overlay.move(gameX + gameWidth - overlay.width - 24, gameY + 24);
   * ```
   */
  public move(x: number, y: number): void {
    if (!User32.SetWindowPos(this.#window, GL.HWND_TOPMOST, x, y, 0, 0, GL.SWP_NOACTIVATE | GL.SWP_NOSIZE)) {
      throw new Error(`SetWindowPos failed: ${Kernel32.GetLastError()}`);
    }

    this.#left = x;
    this.#top = y;
  }

  /**
   * Begin a subpath at (x, y).
   * @example
   * ```ts
   * overlay.moveTo(20, 20);
   * ```
   */
  public moveTo(x: number, y: number): void {
    const offset = this.#subpathCount << 1;

    if (offset + 2 > this.#subpaths.length) {
      const subpaths = new Uint32Array(this.#subpaths.length * 2);
      subpaths.set(this.#subpaths);
      this.#subpaths = subpaths;
    }

    this.#subpaths[offset] = this.#userCount;
    this.#subpaths[offset + 1] = 0;
    this.#subpathCount++;
    this.#pathPoint(x, y);
  }

  /**
   * Draw a closed polygon (convex or concave). A bare paint fills it.
   * @example
   * ```ts
   * overlay.polygon([{ x: 50, y: 0 }, { x: 100, y: 80 }, { x: 0, y: 80 }], { fill: '#ffcc00', stroke: '#000000', strokeWidth: 2 });
   * ```
   */
  public polygon(points: Points2D, style?: Style): void {
    this.#resolve(style, false);

    const count = this.#points(points);

    if (this.#hasFill && count > 2) {
      if (this.#shadow !== undefined) {
        this.#shadowPath(this.#path, count, false, null, this.#shadow.spread ?? 0);
      }

      this.#fillResolved(this.#path, count, false, null);
    }

    if (this.#hasStroke && count > 0) {
      this.#strokeResolved(count, true, null);
    }
  }

  /**
   * Draw a 3D polygon (fan-filled, visible from both sides). A bare paint fills it.
   * @example
   * ```ts
   * overlay.polygon3D([0, 0, 50, 10, 0, 50, 10, 10, 50], { fill: '#00ffff40', stroke: '#00ffff' });
   * ```
   */
  public polygon3D(points: Points3D, style?: Style): void {
    this.#resolve(style, false);

    const flat = points.length > 0 && typeof points[0] === 'number';
    const count = flat ? (points.length / 3) | 0 : points.length;

    if (count < 2) {
      return;
    }

    if (this.#hasFill && count > 2) {
      const base = this.#points3D(points, flat, count, this.#solid(this.#fillColor, this.#gradientFill), (count - 2) * 3, 0);
      const indices = this.#surfaceIndices;

      for (let i = 1, k = this.#surfaceCount; i < count - 1; i++, k += 3) {
        indices[k] = base;
        indices[k + 1] = base + i;
        indices[k + 2] = base + i + 1;
      }

      this.#surfaceCount += (count - 2) * 3;
    }

    if (this.#hasStroke) {
      const base = this.#points3D(points, flat, count, this.#solid(this.#strokeColor, this.#gradientStroke), 0, count * 2);
      const indices = this.#lineIndices;

      for (let i = 0, k = this.#lineCount; i < count; i++, k += 2) {
        indices[k] = base + i;
        indices[k + 1] = base + (i + 1 === count ? 0 : i + 1);
      }

      this.#lineCount += count * 2;
    }
  }

  /**
   * Draw an open path through `points`. A bare paint strokes it.
   * @example
   * ```ts
   * overlay.polyline([0, 40, 30, 10, 60, 30, 90, 0], { stroke: '#7cf29a', strokeWidth: 2 });
   * ```
   */
  public polyline(points: Points2D, style?: Style): void {
    this.#resolve(style, true);

    const count = this.#points(points);

    if (this.#hasFill && count > 2) {
      this.#fillResolved(this.#path, count, false, null);
    }

    if (this.#hasStroke && count > 0) {
      this.#strokeResolved(count, false, null);
    }
  }

  /**
   * World position to overlay pixels, or null when behind the camera. Writes into `out` (reused by default).
   * @example
   * ```ts
   * const head = overlay.project(enemy.x, enemy.y, enemy.z + 72);
   * if (head) overlay.text(enemy.name, head.x, head.y - 8, { align: 'center', outline: '#000000' });
   * ```
   */
  public project(x: number, y: number, z: number, out: { x: number; y: number } = this.#projected): { x: number; y: number } | null {
    const m = this.#viewProjection;
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];

    if (!(w > 1e-6)) {
      return null;
    }

    out.x = ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w + 1) * 0.5 * this.width;
    out.y = (1 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w) * 0.5 * this.height;

    return out;
  }

  /**
   * Quadratic Bézier to (x, y), flattened adaptively (Wang's formula, forward differencing).
   * @example
   * ```ts
   * overlay.quadraticCurveTo(100, 0, 180, 60);
   * ```
   */
  public quadraticCurveTo(controlX: number, controlY: number, x: number, y: number): void {
    if (!this.#continuePath(controlX, controlY)) {
      return;
    }

    const last = (this.#userCount - 1) << 1;
    const startX = this.#userPath[last];
    const startY = this.#userPath[last + 1];

    const ax = startX - 2 * controlX + x;
    const ay = startY - 2 * controlY + y;
    const steps = min(256, max(1, ceil(sqrt(sqrt(ax * ax + ay * ay) * this.#pixelScale))));
    const step = 1 / steps;
    const secondDeltaX = 2 * ax * step * step;
    const secondDeltaY = 2 * ay * step * step;

    // B(t) = a t² + b t + p0, stepped with first and second forward differences
    let deltaX = ax * step * step + 2 * (controlX - startX) * step;
    let deltaY = ay * step * step + 2 * (controlY - startY) * step;
    let pointX = startX;
    let pointY = startY;

    for (let i = 1; i < steps; i++) {
      pointX += deltaX;
      pointY += deltaY;
      deltaX += secondDeltaX;
      deltaY += secondDeltaY;
      this.#pathPoint(pointX, pointY);
    }

    this.#pathPoint(x, y);
  }

  /**
   * Radial gradient from the center of each shape's bounds out to its edges. Create once, reuse every frame.
   * @example
   * ```ts
   * const glow = overlay.radialGradient(['#4ca6ffcc', '#4ca6ff00']);
   * overlay.circle(160, 160, 48, glow);
   * ```
   */
  public radialGradient(stops: readonly GradientStop[]): Gradient {
    return new Gradient('radial', stops);
  }

  /**
   * Draw a 2D rectangle, optionally rounded (`radius`). A bare paint fills it.
   * @example
   * ```ts
   * overlay.rectangle(20, 20, 240, 64, { fill: '#0b131bd0', radius: 8, shadow: { blur: 16, y: 6 }, stroke: '#ffffff1c' });
   * ```
   */
  public rectangle(x: number, y: number, width: number, height: number, style?: Style): void {
    this.#resolve(style, false);

    if (width < 0) {
      x += width;
      width = -width;
    }

    if (height < 0) {
      y += height;
      height = -height;
    }

    if (!(width > 0 && height > 0)) {
      return;
    }

    const radius = min(this.#radius, width * 0.5, height * 0.5);

    if (this.#hasFill) {
      const shadow = this.#shadow;

      if (shadow !== undefined) {
        // CSS-like: grow by spread, keep the corners at least as round as the blur so inner rings stay valid
        const spread = shadow.spread ?? 0;
        const shadowHeight = height + spread * 2;
        const shadowWidth = width + spread * 2;

        if (shadowWidth > 0 && shadowHeight > 0) {
          const count = this.#roundedRectangle(x - spread, y - spread, shadowWidth, shadowHeight, max(radius + spread, shadow.blur ?? 8));
          this.#shadowPath(this.#path, count, true, this.#miters, 0);
        }
      }

      const count = this.#roundedRectangle(x, y, width, height, radius);
      this.#fillResolved(this.#path, count, true, this.#miters);
    }

    if (this.#hasStroke) {
      const count = this.#roundedRectangle(x, y, width, height, radius);
      this.#strokeResolved(count, true, this.#miters);
    }
  }

  /**
   * Draw a 3D rectangle in the XY plane at `z`. A bare paint fills it.
   * @example
   * ```ts
   * overlay.rectangle3D(-5, -5, 80, 10, 10, { fill: '#00ff0040', stroke: '#00ff00' });
   * ```
   */
  public rectangle3D(x: number, y: number, z: number, width: number, height: number, style?: Style): void {
    this.#resolve(style, false);

    if (this.#hasFill) {
      const base = this.#corners3D(x, y, z, width, height, 0, 4, this.#solid(this.#fillColor, this.#gradientFill), 6, 0);
      const indices = this.#surfaceIndices;
      const k = this.#surfaceCount;

      indices[k] = base;
      indices[k + 1] = base + 1;
      indices[k + 2] = base + 3;
      indices[k + 3] = base;
      indices[k + 4] = base + 3;
      indices[k + 5] = base + 2;

      this.#surfaceCount = k + 6;
    }

    if (this.#hasStroke) {
      const base = this.#corners3D(x, y, z, width, height, 0, 4, this.#solid(this.#strokeColor, this.#gradientStroke), 0, 8);
      const indices = this.#lineIndices;
      const k = this.#lineCount;

      indices[k] = base;
      indices[k + 1] = base + 1;
      indices[k + 2] = base + 1;
      indices[k + 3] = base + 3;
      indices[k + 4] = base + 3;
      indices[k + 5] = base + 2;
      indices[k + 6] = base + 2;
      indices[k + 7] = base;

      this.#lineCount = k + 8;
    }
  }

  /**
   * Back to the identity transform.
   * @example
   * ```ts
   * overlay.resetTransform();
   * ```
   */
  public resetTransform(): void {
    const transform = this.#transform;

    transform[0] = 1;
    transform[1] = 0;
    transform[2] = 0;
    transform[3] = 1;
    transform[4] = 0;
    transform[5] = 0;

    this.#fringe = this.#antialias ? 1 : 0;
    this.#pixelScale = 1;
  }

  /**
   * Pop the state pushed by save(). Unbalanced calls are ignored.
   * @example
   * ```ts
   * overlay.save();
   * overlay.globalAlpha = 0.5;
   * overlay.restore();
   * ```
   */
  public restore(): void {
    if (this.#depth === 0) {
      return;
    }

    const offset = --this.#depth << 3;
    const stack = this.#stack;
    const transform = this.#transform;
    const clip = stack[offset + 7];

    transform[0] = stack[offset];
    transform[1] = stack[offset + 1];
    transform[2] = stack[offset + 2];
    transform[3] = stack[offset + 3];
    transform[4] = stack[offset + 4];
    transform[5] = stack[offset + 5];
    this.globalAlpha = stack[offset + 6];

    if (clip !== this.#clipIndex) {
      this.#clipIndex = clip;
      this.#runDirty = true;
    }

    this.#updateScale();
  }

  /**
   * Rotate subsequent drawing (radians, clockwise on screen).
   * @example
   * ```ts
   * overlay.rotate(heading);
   * ```
   */
  public rotate(angle: number): void {
    const transform = this.#transform;
    const a = transform[0];
    const b = transform[1];
    const c = transform[2];
    const cosine = cos(angle);
    const d = transform[3];
    const sine = sin(angle);

    transform[0] = a * cosine + c * sine;
    transform[1] = b * cosine + d * sine;
    transform[2] = c * cosine - a * sine;
    transform[3] = d * cosine - b * sine;
  }

  /**
   * Push the transform, globalAlpha and clip.
   * @example
   * ```ts
   * overlay.save();
   * overlay.translate(200, 120);
   * overlay.rotate(Math.PI / 4);
   * overlay.rectangle(-20, -20, 40, 40, '#ffcc00');
   * overlay.restore();
   * ```
   */
  public save(): void {
    const offset = this.#depth << 3;

    if (offset + 8 > this.#stack.length) {
      const stack = new Float64Array(this.#stack.length * 2);
      stack.set(this.#stack);
      this.#stack = stack;
    }

    const stack = this.#stack;
    const transform = this.#transform;

    stack[offset] = transform[0];
    stack[offset + 1] = transform[1];
    stack[offset + 2] = transform[2];
    stack[offset + 3] = transform[3];
    stack[offset + 4] = transform[4];
    stack[offset + 5] = transform[5];
    stack[offset + 6] = this.globalAlpha;
    stack[offset + 7] = this.#clipIndex;

    this.#depth++;
  }

  /**
   * Scale subsequent drawing. Anti-aliasing stays one device pixel wide.
   * @example
   * ```ts
   * overlay.scale(2);
   * ```
   */
  public scale(x: number, y = x): void {
    const transform = this.#transform;

    transform[0] *= x;
    transform[1] *= x;
    transform[2] *= y;
    transform[3] *= y;

    this.#updateScale();
  }

  /**
   * Set the default stroke width for 2D strokes and the width of 3D lines.
   * @example
   * ```ts
   * overlay.setLineWidth(2);
   * ```
   */
  public setLineWidth(width: number): void {
    if (width !== this.#lineWidth) {
      this.#lineWidth = width;
      this.#runDirty = true;
    }
  }

  /**
   * Set the 3D perspective (degrees, world units). Defaults: 90° field of view, near 4, far 8000.
   * @example
   * ```ts
   * overlay.setPerspective(74, 1, 10_000);
   * ```
   */
  public setPerspective(fieldOfView = 90, near = 4, far = 8_000): void {
    const focal = 1 / tan((fieldOfView * PI) / 360);
    const projection = this.#projection;

    projection.fill(0);
    projection[0] = focal / (this.width / this.height);
    projection[5] = focal;
    projection[10] = (far + near) / (near - far);
    projection[11] = -1;
    projection[14] = (2 * far * near) / (near - far);

    this.#updateViewProjection();
  }

  /**
   * Replace the projection with a row-major 4x4 matrix. Pair with an identity view matrix to feed a
   * game's combined view-projection matrix straight through.
   * @example
   * ```ts
   * overlay.setProjectionMatrix(gameViewProjection);
   * overlay.setViewMatrix(IDENTITY);
   * ```
   */
  public setProjectionMatrix(rowMajor: ArrayLike<number>): void {
    const projection = this.#projection;

    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 4; column++) {
        projection[column * 4 + row] = rowMajor[row * 4 + column];
      }
    }

    this.#updateViewProjection();
  }

  /**
   * Set the 3D view matrix (row-major). Applies to all 3D geometry of the frame.
   * @example
   * ```ts
   * overlay.setViewMatrix(camera.worldToView);
   * ```
   */
  public setViewMatrix(rowMajor: ArrayLike<number>): void {
    const view = this.#view;

    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 4; column++) {
        view[column * 4 + row] = rowMajor[row * 4 + column];
      }
    }

    this.#updateViewProjection();
  }

  /**
   * Show the overlay after hide().
   * @example
   * ```ts
   * if (gameFocused) overlay.show();
   * ```
   */
  public show(): void {
    User32.ShowWindow(this.#window, GL.SW_SHOWNOACTIVATE);
    this.#blank = false;
    this.#hidden = false;

    // The window kept stale pixels while hidden: repaint all of it
    this.#previousBottom = this.height;
    this.#previousLeft = 0;
    this.#previousRight = this.width;
    this.#previousTop = 0;
  }

  /**
   * Draw a 3D sphere (cached unit mesh, default 16 segments). A bare paint fills it.
   * @example
   * ```ts
   * overlay.sphere(0, 0, 70, 5, { fill: '#ffff0040', segments: 12, stroke: '#ffff00' });
   * ```
   */
  public sphere(x: number, y: number, z: number, radius: number, style?: Style): void {
    this.#resolve(style, false);

    const template = sphereTemplate(this.#segments > 2 ? this.#segments | 0 : 16);
    const { positions, vertexCount } = template;

    for (let pass = 0; pass < 2; pass++) {
      const stroke = pass === 1;

      if (stroke ? !this.#hasStroke : !this.#hasFill) {
        continue;
      }

      const color = stroke ? this.#solid(this.#strokeColor, this.#gradientStroke) : this.#solid(this.#fillColor, this.#gradientFill);
      const list = stroke ? template.edges : template.triangles;

      this.#reserve3D(vertexCount, stroke ? 0 : list.length, 0, stroke ? list.length : 0);

      const vertices = this.#vertices3D;
      const words = this.#words3D;
      const base = this.#vertexCount3D;

      for (let i = 0, o = base * STRIDE, p = 0; i < vertexCount; i++, o += STRIDE, p += 3) {
        vertices[o] = x + positions[p] * radius;
        vertices[o + 1] = y + positions[p + 1] * radius;
        vertices[o + 2] = z + positions[p + 2] * radius;
        words[o + 3] = color;
      }

      const indices = stroke ? this.#lineIndices : this.#solidIndices;
      const k = stroke ? this.#lineCount : this.#solidCount;

      for (let i = 0; i < list.length; i++) {
        indices[k + i] = base + list[i];
      }

      if (stroke) {
        this.#lineCount += list.length;
      } else {
        this.#solidCount += list.length;
      }

      this.#vertexCount3D = base + vertexCount;
    }
  }

  /**
   * Stroke every subpath of the current path. A bare paint strokes.
   * @example
   * ```ts
   * overlay.stroke({ dash: [6, 4], stroke: '#ffffff', strokeWidth: 2 });
   * ```
   */
  public stroke(style?: Style): void {
    this.#resolve(style, true);

    if (!this.#hasStroke) {
      return;
    }

    for (let subpath = 0; subpath < this.#subpathCount; subpath++) {
      const count = this.#subpath(subpath);

      if (count > 0) {
        this.#strokeResolved(count, this.#subpaths[(subpath << 1) + 1] === 1, null);
      }
    }
  }

  /**
   * Gradient that runs along a stroke, from its first point to its last. Fills treat it as top-to-bottom.
   * @example
   * ```ts
   * const trail = overlay.strokeGradient(['#4ca6ff00', '#4ca6ff']);
   * overlay.polyline(history, { cap: 'round', stroke: trail, strokeWidth: 3 });
   * ```
   */
  public strokeGradient(stops: readonly GradientStop[]): Gradient {
    return new Gradient('stroke', stops);
  }

  /**
   * Draw text. `y` is the baseline unless `baseline` says otherwise; `\n` starts a new line.
   * Glyphs are grayscale anti-aliased, cached in the atlas, and batch with everything else.
   * @example
   * ```ts
   * const LABEL: TextStyle = { color: '#f3f6fa', maximumWidth: 160, shadow: '#000000c0', size: 14, weight: 700 };
   * overlay.text(playerName, 24, 40, LABEL);
   * ```
   */
  public text(text: string, x: number, y: number, style?: Paint | TextStyle): void {
    let align = 0;
    let baseline: TextBaseline = 'alphabetic';
    let face = 'Arial';
    let maximumWidth = Infinity;
    let opacity = 1;
    let outline: Color | undefined;
    let paint: Paint = WHITE;
    let shadow: Color | undefined;
    let size = 16;
    let weight = 400;

    if (style !== undefined) {
      if (typeof style !== 'object' || style instanceof Gradient || (style as RGBA).r !== undefined) {
        paint = style as Paint;
      } else {
        const textStyle = style as TextStyle;

        align = textStyle.align === 'center' ? 0.5 : textStyle.align === 'right' ? 1 : 0;
        baseline = textStyle.baseline ?? baseline;
        face = textStyle.font ?? face;
        maximumWidth = textStyle.maximumWidth ?? maximumWidth;
        opacity = textStyle.opacity ?? opacity;
        outline = textStyle.outline;
        paint = textStyle.color ?? paint;
        shadow = textStyle.shadow;
        size = textStyle.size ?? size;
        weight = textStyle.weight ?? weight;
      }
    }

    const alpha = this.globalAlpha * opacity;

    if (!(alpha > 0) || text.length === 0) {
      return;
    }

    const font = this.#font(face, size, weight);
    const gradient = paint instanceof Gradient ? paint : null;

    // Vertical anchor for the whole block
    let lines = 1;

    if (baseline === 'middle' || baseline === 'bottom' || gradient !== null) {
      for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) === 10) {
          lines++;
        }
      }
    }

    const block = (lines - 1) * font.height;

    if (baseline === 'top') {
      y += font.ascent;
    } else if (baseline === 'middle') {
      y += (font.ascent - font.descent - block) * 0.5;
    } else if (baseline === 'bottom') {
      y -= font.descent + block;
    }

    // Snap to whole device pixels when unrotated and unscaled: glyph texels land exactly on pixels
    const transform = this.#transform;

    if (transform[0] === 1 && transform[1] === 0 && transform[2] === 0 && transform[3] === 1) {
      x = floor(x + transform[4] + 0.5) - transform[4];
      y = floor(y + transform[5] + 0.5) - transform[5];
    }

    if (outline !== undefined) {
      const color = fadeColor(packColor(outline), alpha);

      if (color !== 0) {
        for (let i = 0; i < 16; i += 2) {
          this.#glyphRun(text, font, x + OUTLINE_OFFSETS[i], y + OUTLINE_OFFSETS[i + 1], align, maximumWidth, color, null, alpha);
        }
      }
    }

    if (shadow !== undefined) {
      const color = fadeColor(packColor(shadow), alpha);

      if (color !== 0) {
        this.#glyphRun(text, font, x + 1, y + 1, align, maximumWidth, color, null, alpha);
      }
    }

    if (gradient !== null) {
      const width = this.#measure(text, font, maximumWidth);

      this.#prepareGradient(gradient, x - width * align, y - font.ascent, width, font.ascent + font.descent + block);
      this.#glyphRun(text, font, x, y, align, maximumWidth, 0, gradient, alpha);
      return;
    }

    const color = fadeColor(packColor(paint as Color), alpha);

    if (color !== 0) {
      this.#glyphRun(text, font, x, y, align, maximumWidth, color, null, alpha);
    }
  }

  /**
   * Move the origin.
   * @example
   * ```ts
   * overlay.translate(radarX, radarY);
   * ```
   */
  public translate(x: number, y: number): void {
    const transform = this.#transform;

    transform[4] += transform[0] * x + transform[2] * y;
    transform[5] += transform[1] * x + transform[3] * y;
  }

  /**
   * Draw a triangle. A bare paint fills it.
   * @example
   * ```ts
   * overlay.triangle(100, 20, 130, 80, 70, 80, '#ff5263');
   * ```
   */
  public triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, style?: Style): void {
    this.#resolve(style, false);
    this.#ensurePath(3);

    const path = this.#path;
    path[0] = x1;
    path[1] = y1;
    path[2] = x2;
    path[3] = y2;
    path[4] = x3;
    path[5] = y3;

    if (this.#hasFill) {
      if (this.#shadow !== undefined) {
        this.#shadowPath(path, 3, true, null, this.#shadow.spread ?? 0);
      }

      this.#fillResolved(this.#path, 3, true, null);
    }

    if (this.#hasStroke) {
      this.#strokeResolved(3, true, null);
    }
  }

  /**
   * Process window messages and present the frame. Call once per frame after all draw calls.
   * Returns false once the overlay is closed.
   * @example
   * ```ts
   * setInterval(() => {
   *   overlay.circle(100, 100, 40, 0x4ca6ffff);
   *   overlay.update();
   * }, 16);
   * ```
   */
  public update(): boolean {
    if (this.#closed) {
      return false;
    }

    // Process pending messages (non-blocking)
    while (User32.PeekMessageW(MESSAGE_POINTER, 0n, 0, 0, GL.PM_REMOVE)) {
      User32.TranslateMessage(MESSAGE_POINTER);
      User32.DispatchMessageW(MESSAGE_POINTER);
    }

    // Another context may be current (several overlays, a host renderer)
    if (OpenGL32.wglGetCurrentContext() !== this.#renderingContext && !OpenGL32.wglMakeCurrent(this.#deviceContext, this.#renderingContext)) {
      throw new Error(`wglMakeCurrent failed: ${Kernel32.GetLastError()}`);
    }

    // Nothing drawn and nothing on screen: an idle overlay costs only the message pump
    if (!this.#hidden && !(this.#blank && this.#runCount === 0)) {
      this.#blank = this.#runCount === 0;
      this.#draw();

      // Present based on render mode
      if (this.renderMode === 'alpha') {
        this.#presentLayered();
      } else {
        GDI32.SwapBuffers(this.#deviceContext);
      }

      // Clear for next frame (depth writes must be on for the depth clear to take)
      OpenGL32.glDepthMask(GL.GL_TRUE);
      OpenGL32.glClear(GL.GL_COLOR_BUFFER_BIT | GL.GL_DEPTH_BUFFER_BIT);
    }

    this.#reset();

    return true;
  }

  /** False while hidden */
  public get visible(): boolean {
    return !this.#hidden;
  }

  /** Screen x of the overlay's left edge */
  public get x(): number {
    return this.#left;
  }

  /** Screen y of the overlay's top edge */
  public get y(): number {
    return this.#top;
  }
}

// Pixel format descriptor for OpenGL context
const PIXEL_FORMAT_DESCRIPTOR = Buffer.from([
  0x28,
  0x00, // nSize = 40
  0x01,
  0x00, // nVersion = 1
  0x25,
  0x00,
  0x00,
  0x00, // dwFlags = PFD_DRAW_TO_WINDOW | PFD_SUPPORT_OPENGL | PFD_DOUBLEBUFFER
  0x00, // iPixelType = PFD_TYPE_RGBA
  0x20, // cColorBits = 32
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00, // color bits/shift (unused)
  0x08, // cAlphaBits = 8
  0x00, // cAlphaShift
  0x00, // cAccumBits
  0x00,
  0x00,
  0x00,
  0x00, // accum RGBA
  0x18, // cDepthBits = 24
  0x08, // cStencilBits = 8
  0x00, // cAuxBuffers
  0x00, // iLayerType (ignored)
  0x00, // bReserved
  0x00,
  0x00,
  0x00,
  0x00, // dwLayerMask (ignored)
  0x00,
  0x00,
  0x00,
  0x00, // dwVisibleMask (ignored)
  0x00,
  0x00,
  0x00,
  0x00, // dwDamageMask (ignored)
]);

/** Outward miters for rectangle corners (x, y), (x + w, y), (x + w, y + h), (x, y + h) */
const RECTANGLE_MITERS = new Float64Array([-1, -1, 1, -1, 1, 1, -1, 1]);

/** Run record: clip, 3D line width, then start/end pairs into the 2D, solid, surface and line index streams */
const RUN_STRIDE = 10;

/** Shadow falloff (Gaussian CDF, sigma = blur / 2): ring offsets in blur units and their coverage */
const SHADOW_COVERAGE = new Float64Array([1, 0.841, 0.5, 0.159, 0]);
const SHADOW_OFFSETS = new Float64Array([-1, -0.5, 0, 0.5, 1]);

/** Unit spheres by segment count */
const SPHERES = new Map<number, SphereTemplate>();

/** Floats per vertex: 2D (x, y, texel, color) and 3D (x, y, z, color) share a 16-byte stride */
const STRIDE = 4;

/** Unit sphere: positions (x, y, z), triangle and edge index lists */
interface SphereTemplate {
  readonly edges: Uint32Array;
  readonly positions: Float64Array;
  readonly triangles: Uint32Array;
  readonly vertexCount: number;
}

/** One full turn in radians */
const TAU = PI * 2;

/** Unit circles (cosine, sine interleaved) by segment count; they double as outward miters */
const UNIT_CIRCLES: Float64Array[] = [];

/** Pre-multiplied opaque white */
const WHITE = 0xffff_ffff;

/** Packed texel (1, 1): inside the reserved 4x4 white block, so untextured geometry samples pure white */
const WHITE_TEXEL = 0x0001_0001;

function callback(window: bigint, message: number, wordParameter: bigint, longParameter: bigint): bigint {
  if (message === GL.WM_DESTROY) {
    User32.PostQuitMessage(0);
    return 0n;
  }

  return User32.DefWindowProcW(window, message, wordParameter, longParameter);
}

/**
 * Unit sphere for `segments` (cached). Latitude rings duplicate the seam so indices stay rectangular.
 * @example
 * ```ts
 * sphereTemplate(16).vertexCount; // 289
 * ```
 */
function sphereTemplate(segments: number): SphereTemplate {
  let template = SPHERES.get(segments);

  if (template !== undefined) {
    return template;
  }

  const columns = segments + 1;
  const vertexCount = columns * columns;
  const positions = new Float64Array(vertexCount * 3);

  for (let i = 0, o = 0; i <= segments; i++) {
    const theta = (i * PI) / segments;
    const cosineTheta = cos(theta);
    const sineTheta = sin(theta);

    for (let j = 0; j <= segments; j++, o += 3) {
      const phi = (j * TAU) / segments;

      positions[o] = sineTheta * cos(phi);
      positions[o + 1] = cosineTheta;
      positions[o + 2] = sineTheta * sin(phi);
    }
  }

  // (p00, p01, p11) and (p00, p11, p10): φ before θ keeps the cross product pointing outward
  const triangles = new Uint32Array(segments * segments * 6);

  for (let i = 0, k = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const p00 = i * columns + j;
      const p10 = p00 + columns;

      triangles[k++] = p00;
      triangles[k++] = p00 + 1;
      triangles[k++] = p10 + 1;
      triangles[k++] = p00;
      triangles[k++] = p10 + 1;
      triangles[k++] = p10;
    }
  }

  // Latitude rings (poles excluded) then meridians
  const edges = new Uint32Array(segments * (segments - 1) * 2 + segments * segments * 2);

  let k = 0;

  for (let i = 1; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      edges[k++] = i * columns + j;
      edges[k++] = i * columns + j + 1;
    }
  }

  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < segments; i++) {
      edges[k++] = i * columns + j;
      edges[k++] = (i + 1) * columns + j;
    }
  }

  template = { edges, positions, triangles, vertexCount };
  SPHERES.set(segments, template);

  return template;
}

/**
 * Unit circle table for `segments` (cached).
 * @example
 * ```ts
 * unitCircle(8)[2]; // cos(π / 4)
 * ```
 */
function unitCircle(segments: number): Float64Array {
  let table = UNIT_CIRCLES[segments];

  if (table === undefined) {
    table = new Float64Array(segments << 1);

    for (let i = 0; i < segments; i++) {
      const angle = (i * TAU) / segments;

      table[i << 1] = cos(angle);
      table[(i << 1) + 1] = sin(angle);
    }

    UNIT_CIRCLES[segments] = table;
  }

  return table;
}

// Window procedure callback (static, shared)
const windowProcedureCallback = new JSCallback(callback, { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 });
