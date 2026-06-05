/**
 * gba-ppu.ts — the Game Boy Advance picture processing unit. Renders the 240×160
 * display scanline-by-scanline into an RGBA framebuffer: the four tiled
 * backgrounds (text modes 0/1 + affine/rotation-scaling backgrounds in modes
 * 1/2), the bitmap modes 3/4/5, and the 128 OBJ sprites (regular + affine), all
 * composited by priority with a backdrop, plus alpha/brightness blending and the
 * window clipping that games use for fades and lighting.
 *
 * It reads VRAM/palette/OAM/IO straight off the Gba system object and writes the
 * finished frame to `frame` (240×160 RGBA). The system's frame loop drives it via
 * renderScanline(); VCOUNT/DISPSTAT/IRQ/DMA timing lives in the system module.
 */
import type { Gba } from './gba-bus';

export const GBA_W = 240;
export const GBA_H = 160;

/** Expand a 15-bit BGR555 color to 24-bit RGB (low bits replicated). */
function rgb15(c: number): number {
  const r = c & 0x1f,
    g = (c >> 5) & 0x1f,
    b = (c >> 10) & 0x1f;
  return (((r << 3) | (r >> 2)) << 16) | (((g << 3) | (g >> 2)) << 8) | ((b << 3) | (b >> 2));
}

export class GbaPpu {
  private readonly sys: Gba;
  readonly frame = new Uint8Array(GBA_W * GBA_H * 4);

  // Per-scanline scratch: each layer's 15-bit color (-1 = transparent) + priority.
  private readonly bgColor = [new Int32Array(GBA_W), new Int32Array(GBA_W), new Int32Array(GBA_W), new Int32Array(GBA_W)];
  private readonly objColor = new Int32Array(GBA_W);
  private readonly objPriority = new Uint8Array(GBA_W);
  private readonly objSemi = new Uint8Array(GBA_W); // semi-transparent OBJ (blend) flag
  private readonly objWindow = new Uint8Array(GBA_W); // OBJ-window mask
  private readonly winMask = new Uint8Array(GBA_W); // which window each pixel belongs to

  // Affine BG internal reference-point accumulators (latched per frame, advanced per line).
  private readonly bgRefX = new Int32Array(4);
  private readonly bgRefY = new Int32Array(4);

  constructor(sys: Gba) {
    this.sys = sys;
  }

  private io16(off: number): number {
    return this.sys.io[off]! | (this.sys.io[off + 1]! << 8);
  }
  private vram8(a: number): number {
    return this.sys.vram[a]!;
  }
  private vram16(a: number): number {
    return this.sys.vram[a]! | (this.sys.vram[a + 1]! << 8);
  }
  private pal16(a: number): number {
    return this.sys.palette[a]! | (this.sys.palette[a + 1]! << 8);
  }

  /** Latch affine reference points at the top of the frame (VCOUNT 0). */
  frameStart(): void {
    for (let bg = 2; bg <= 3; bg += 1) {
      const base = bg === 2 ? 0x28 : 0x38;
      this.bgRefX[bg] = this.signed28(this.io16(base) | (this.io16(base + 2) << 16));
      this.bgRefY[bg] = this.signed28(this.io16(base + 4) | (this.io16(base + 6) << 16));
    }
  }
  private signed28(v: number): number {
    return (v << 4) >> 4; // sign-extend 28-bit
  }

  renderScanline(line: number): void {
    const dispcnt = this.io16(0x000);
    const mode = dispcnt & 0x7;
    const forcedBlank = (dispcnt & 0x80) !== 0;
    const row = line * GBA_W * 4;

    if (forcedBlank) {
      for (let x = 0; x < GBA_W; x += 1) {
        const o = row + x * 4;
        this.frame[o] = this.frame[o + 1] = this.frame[o + 2] = 0xff;
        this.frame[o + 3] = 0xff;
      }
      this.advanceAffine();
      return;
    }

    for (let i = 0; i < 4; i += 1) this.bgColor[i]!.fill(-1);
    this.objColor.fill(-1);
    this.objPriority.fill(4);
    this.objSemi.fill(0);
    this.objWindow.fill(0);

    // Render the enabled layers for this mode.
    if (mode === 0) {
      for (let bg = 0; bg < 4; bg += 1) if (dispcnt & (1 << (8 + bg))) this.renderTextBg(bg, line);
    } else if (mode === 1) {
      if (dispcnt & 0x100) this.renderTextBg(0, line);
      if (dispcnt & 0x200) this.renderTextBg(1, line);
      if (dispcnt & 0x400) this.renderAffineBg(2, line);
    } else if (mode === 2) {
      if (dispcnt & 0x400) this.renderAffineBg(2, line);
      if (dispcnt & 0x800) this.renderAffineBg(3, line);
    } else if (mode === 3) {
      this.renderBitmapMode3(line);
    } else if (mode === 4) {
      this.renderBitmapMode4(line, dispcnt);
    } else if (mode === 5) {
      this.renderBitmapMode5(line, dispcnt);
    }

    if (dispcnt & 0x1000) this.renderSprites(line, dispcnt);

    this.compose(line, dispcnt);
    this.advanceAffine();
  }

  private advanceAffine(): void {
    // Advance the affine reference points by dmy/dmx each scanline.
    for (let bg = 2; bg <= 3; bg += 1) {
      const base = bg === 2 ? 0x20 : 0x30;
      const dmx = (this.io16(base + 4) << 16) >> 16;
      const dmy = (this.io16(base + 6) << 16) >> 16;
      this.bgRefX[bg] = (this.bgRefX[bg]! + dmx) | 0;
      this.bgRefY[bg] = (this.bgRefY[bg]! + dmy) | 0;
    }
  }

  // ── Text (regular) backgrounds ──────────────────────────────────────────────
  private renderTextBg(bg: number, line: number): void {
    const cnt = this.io16(0x08 + bg * 2);
    const priority = cnt & 0x3;
    const charBase = ((cnt >> 2) & 0x3) * 0x4000;
    const mosaic = (cnt & 0x40) !== 0;
    const color256 = (cnt & 0x80) !== 0;
    const screenBase = ((cnt >> 8) & 0x1f) * 0x800;
    const size = (cnt >> 14) & 0x3;
    const widthTiles = size & 1 ? 64 : 32;
    const heightTiles = size & 2 ? 64 : 32;
    const hofs = this.io16(0x10 + bg * 4) & 0x1ff;
    const vofs = this.io16(0x12 + bg * 4) & 0x1ff;
    const out = this.bgColor[bg]!;
    const prioShift = priority << 29; // pack priority into bits 29-30 of the stored value

    let yy = (line + vofs) & (heightTiles * 8 - 1);
    if (mosaic) {
      const my = (this.io16(0x4c) >> 4) & 0xf;
      if (my) yy = line - (line % (my + 1)) + vofs;
      yy &= heightTiles * 8 - 1;
    }
    const tileRow = (yy >> 3) & (heightTiles - 1);
    const fineY = yy & 7;

    for (let x = 0; x < GBA_W; x += 1) {
      const xx = (x + hofs) & (widthTiles * 8 - 1);
      const tileCol = (xx >> 3) & (widthTiles - 1);
      // Pick the right 32×32 screenblock for sizes >256.
      let sb = screenBase;
      const blockCol = tileCol >> 5,
        blockRow = tileRow >> 5;
      if (widthTiles === 64 && blockCol) sb += 0x800;
      if (heightTiles === 64 && blockRow) sb += widthTiles === 64 ? 0x1000 : 0x800;
      const entry = this.vram16(sb + ((tileRow & 31) * 32 + (tileCol & 31)) * 2);
      const tileNum = entry & 0x3ff;
      const hflip = (entry & 0x400) !== 0;
      const vflip = (entry & 0x800) !== 0;
      const pal = (entry >> 12) & 0xf;
      const fy = vflip ? 7 - fineY : fineY;
      const fx = hflip ? 7 - (xx & 7) : xx & 7;
      let colorIdx: number;
      if (color256) {
        colorIdx = this.vram8(charBase + tileNum * 64 + fy * 8 + fx);
        if (colorIdx === 0) continue;
        out[x] = prioShift | this.pal16(colorIdx * 2);
      } else {
        const byte = this.vram8(charBase + tileNum * 32 + fy * 4 + (fx >> 1));
        colorIdx = fx & 1 ? byte >> 4 : byte & 0xf;
        if (colorIdx === 0) continue;
        out[x] = prioShift | this.pal16((pal * 16 + colorIdx) * 2);
      }
    }
  }

  // ── Affine (rotation/scaling) backgrounds ───────────────────────────────────
  private renderAffineBg(bg: number, line: number): void {
    const cnt = this.io16(0x08 + bg * 2);
    const priority = cnt & 0x3;
    const charBase = ((cnt >> 2) & 0x3) * 0x4000;
    const screenBase = ((cnt >> 8) & 0x1f) * 0x800;
    const size = (cnt >> 14) & 0x3;
    const wrap = (cnt & 0x2000) !== 0;
    const mapSize = 16 << size; // tiles: 16/32/64/128
    const pixels = mapSize * 8;
    const base = bg === 2 ? 0x20 : 0x30;
    const pa = (this.io16(base) << 16) >> 16;
    const pc = (this.io16(base + 2) << 16) >> 16;
    let refX = this.bgRefX[bg]!;
    let refY = this.bgRefY[bg]!;
    const out = this.bgColor[bg]!;
    const prioShift = priority << 29;

    for (let x = 0; x < GBA_W; x += 1) {
      let px = refX >> 8;
      let py = refY >> 8;
      refX = (refX + pa) | 0;
      refY = (refY + pc) | 0;
      if (wrap) {
        px &= pixels - 1;
        py &= pixels - 1;
      } else if (px < 0 || py < 0 || px >= pixels || py >= pixels) continue;
      const tileNum = this.vram8(screenBase + (py >> 3) * mapSize + (px >> 3));
      const colorIdx = this.vram8(charBase + tileNum * 64 + (py & 7) * 8 + (px & 7));
      if (colorIdx === 0) continue;
      out[x] = prioShift | this.pal16(colorIdx * 2);
    }
  }

  // ── Bitmap modes ────────────────────────────────────────────────────────────
  private renderBitmapMode3(line: number): void {
    const out = this.bgColor[2]!;
    const base = line * GBA_W * 2;
    for (let x = 0; x < GBA_W; x += 1) out[x] = (0 << 29) | this.vram16(base + x * 2);
  }
  private renderBitmapMode4(line: number, dispcnt: number): void {
    const out = this.bgColor[2]!;
    const page = dispcnt & 0x10 ? 0xa000 : 0;
    const base = page + line * GBA_W;
    for (let x = 0; x < GBA_W; x += 1) {
      const idx = this.vram8(base + x);
      out[x] = idx === 0 ? -1 : this.pal16(idx * 2);
    }
  }
  private renderBitmapMode5(line: number, dispcnt: number): void {
    const out = this.bgColor[2]!;
    if (line >= 128) return; // mode 5 is 160×128
    const page = dispcnt & 0x10 ? 0xa000 : 0;
    const base = page + line * 160 * 2;
    for (let x = 0; x < 160; x += 1) out[x] = this.vram16(base + x * 2);
  }

  // ── Sprites (OBJ) ───────────────────────────────────────────────────────────
  private static readonly OBJ_SIZE: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
    [
      [8, 8],
      [16, 16],
      [32, 32],
      [64, 64],
    ], // square
    [
      [16, 8],
      [32, 8],
      [32, 16],
      [64, 32],
    ], // horizontal
    [
      [8, 16],
      [8, 32],
      [16, 32],
      [32, 64],
    ], // vertical
  ];

  private renderSprites(line: number, dispcnt: number): void {
    const oneDim = (dispcnt & 0x40) !== 0;
    const oam = this.sys.oam;
    for (let i = 127; i >= 0; i -= 1) {
      // lower index = higher priority → draw high index first
      const a0 = oam[i * 8]! | (oam[i * 8 + 1]! << 8);
      const a1 = oam[i * 8 + 2]! | (oam[i * 8 + 3]! << 8);
      const a2 = oam[i * 8 + 4]! | (oam[i * 8 + 5]! << 8);
      const objMode = (a0 >> 8) & 0x3; // 0 normal, 1 affine, 2 hidden, 3 affine+double
      if (objMode === 2) continue; // hidden
      const gfxMode = (a0 >> 10) & 0x3; // 0 normal, 1 semi-transparent, 2 obj-window
      const shape = (a0 >> 14) & 0x3;
      const sizeIdx = (a1 >> 14) & 0x3;
      const dims = GbaPpu.OBJ_SIZE[shape === 3 ? 0 : shape]![sizeIdx]!;
      const w = dims[0],
        h = dims[1];
      const affine = objMode === 1 || objMode === 3;
      const doubleSize = objMode === 3;
      const boxW = doubleSize ? w * 2 : w;
      const boxH = doubleSize ? h * 2 : h;
      let y = a0 & 0xff;
      if (y >= 160) y -= 256;
      if (line < y || line >= y + boxH) continue;
      let x = a1 & 0x1ff;
      if (x >= 240) x -= 512;
      const color256 = (a0 & 0x2000) !== 0;
      const tileNum = a2 & 0x3ff;
      const priority = (a2 >> 10) & 0x3;
      const palBank = (a2 >> 12) & 0xf;

      // Affine parameters (or identity for regular sprites with flips).
      let pa = 0x100,
        pb = 0,
        pc = 0,
        pd = 0x100;
      let hflip = false,
        vflip = false;
      if (affine) {
        const grp = (a1 >> 9) & 0x1f;
        pa = this.io16Oam(grp, 3) | 0;
        pb = this.io16Oam(grp, 7);
        pc = this.io16Oam(grp, 11);
        pd = this.io16Oam(grp, 15);
        pa = (pa << 16) >> 16;
        pb = (pb << 16) >> 16;
        pc = (pc << 16) >> 16;
        pd = (pd << 16) >> 16;
      } else {
        hflip = (a1 & 0x1000) !== 0;
        vflip = (a1 & 0x2000) !== 0;
      }

      const halfW = boxW >> 1,
        halfH = boxH >> 1;
      const localY = line - y - halfH;
      const tilesPerRow = oneDim ? w >> 3 : color256 ? 16 : 32;
      const charStep = color256 ? 64 : 32;

      for (let px = 0; px < boxW; px += 1) {
        const sx = x + px;
        if (sx < 0 || sx >= GBA_W) continue;
        const localX = px - halfW;
        let texX: number, texY: number;
        if (affine) {
          texX = ((pa * localX + pb * localY) >> 8) + (w >> 1);
          texY = ((pc * localX + pd * localY) >> 8) + (h >> 1);
        } else {
          texX = localX + halfW;
          texY = localY + halfH;
          if (hflip) texX = w - 1 - texX;
          if (vflip) texY = h - 1 - texY;
        }
        if (texX < 0 || texY < 0 || texX >= w || texY >= h) continue;
        const tile = tileNum + (texY >> 3) * tilesPerRow + (texX >> 3) * (color256 ? 2 : 1);
        const fx = texX & 7,
          fy = texY & 7;
        let colorIdx: number;
        if (color256) {
          colorIdx = this.vram8(0x10000 + tile * 32 + fy * 8 + fx);
          if (colorIdx === 0) continue;
          if (gfxMode === 2) {
            this.objWindow[sx] = 1;
            continue;
          }
          if (priority < this.objPriority[sx]!) {
            this.objColor[sx] = 0x100 /*OBJ palette flag*/ + colorIdx;
            this.objPriority[sx] = priority;
            this.objSemi[sx] = gfxMode === 1 ? 1 : 0;
          }
        } else {
          const byte = this.vram8(0x10000 + tile * 32 + fy * 4 + (fx >> 1));
          colorIdx = fx & 1 ? byte >> 4 : byte & 0xf;
          if (colorIdx === 0) continue;
          if (gfxMode === 2) {
            this.objWindow[sx] = 1;
            continue;
          }
          if (priority < this.objPriority[sx]!) {
            this.objColor[sx] = 0x100 + palBank * 16 + colorIdx;
            this.objPriority[sx] = priority;
            this.objSemi[sx] = gfxMode === 1 ? 1 : 0;
          }
        }
      }
    }
    // Resolve OBJ palette indices to colors.
    for (let sx = 0; sx < GBA_W; sx += 1) {
      const v = this.objColor[sx]!;
      if (v >= 0x100) this.objColor[sx] = this.pal16(0x200 + (v - 0x100) * 2);
    }
  }

  private io16Oam(group: number, halfwordOffsetInGroup: number): number {
    // Affine params are interleaved in OAM at 0x06+group*0x20, stride 8 bytes.
    const base = group * 0x20 + halfwordOffsetInGroup * 2 + 0;
    return this.sys.oam[base]! | (this.sys.oam[base + 1]! << 8);
  }

  // ── Compose layers by priority, with windows + blending ─────────────────────
  private compose(line: number, dispcnt: number): void {
    const row = line * GBA_W * 4;
    const backdrop = this.pal16(0);
    const bldcnt = this.io16(0x50);
    const blendMode = (bldcnt >> 6) & 0x3;
    const bldAlpha = this.io16(0x52);
    const eva = Math.min(16, bldAlpha & 0x1f);
    const evb = Math.min(16, (bldAlpha >> 8) & 0x1f);
    const evy = Math.min(16, this.io16(0x54) & 0x1f);
    const windowsOn = (dispcnt & 0xe000) !== 0;
    if (windowsOn) this.computeWindows(line, dispcnt);

    const bgPrio = [this.io16(0x08) & 3, this.io16(0x0a) & 3, this.io16(0x0c) & 3, this.io16(0x0e) & 3];

    for (let x = 0; x < GBA_W; x += 1) {
      // Window layer-enable mask for this pixel.
      let enable = 0x3f;
      if (windowsOn) enable = this.winMask[x]!;

      // Find the top two opaque layers (for blending) by priority.
      let topColor = backdrop,
        topLayer = 5,
        topPrio = 5;
      let secondColor = backdrop,
        secondLayer = 5,
        secondPrio = 5;
      const objV = this.objColor[x]!;
      if (objV >= 0 && enable & 0x10) {
        topColor = objV;
        topLayer = 4;
        topPrio = this.objPriority[x]!;
      }
      for (let bg = 0; bg < 4; bg += 1) {
        if (!(dispcnt & (1 << (8 + bg)))) continue;
        if (!(enable & (1 << bg))) continue;
        const v = this.bgColor[bg]![x]!;
        if (v < 0) continue;
        const prio = (v >> 29) & 0x3;
        const color = v & 0x7fff;
        const cmp = bg; // lower bg = higher among same priority
        if (prio < topPrio || (prio === topPrio && topLayer !== 4 && cmp < topLayer)) {
          secondColor = topColor;
          secondLayer = topLayer;
          secondPrio = topPrio;
          topColor = color;
          topLayer = bg;
          topPrio = prio;
        } else if (prio < secondPrio || (prio === secondPrio && cmp < secondLayer)) {
          secondColor = color;
          secondLayer = bg;
          secondPrio = prio;
        }
      }
      void bgPrio;
      void secondPrio;

      // Blending.
      let finalColor = topColor;
      const topBit = topLayer === 4 ? 0x10 : 1 << topLayer;
      const bottomBit = secondLayer === 4 ? 0x10 : secondLayer === 5 ? 0x20 : 1 << secondLayer;
      const semiObj = topLayer === 4 && this.objSemi[x] === 1;
      if (semiObj && bldcnt & (bottomBit << 8)) {
        finalColor = this.blendAlpha(topColor, secondColor, eva, evb);
      } else if (blendMode === 1 && bldcnt & topBit && bldcnt & (bottomBit << 8)) {
        finalColor = this.blendAlpha(topColor, secondColor, eva, evb);
      } else if (blendMode === 2 && bldcnt & topBit) {
        finalColor = this.blendBrightness(topColor, evy, true);
      } else if (blendMode === 3 && bldcnt & topBit) {
        finalColor = this.blendBrightness(topColor, evy, false);
      }

      const rgb = rgb15(finalColor);
      const o = row + x * 4;
      this.frame[o] = (rgb >> 16) & 0xff;
      this.frame[o + 1] = (rgb >> 8) & 0xff;
      this.frame[o + 2] = rgb & 0xff;
      this.frame[o + 3] = 0xff;
    }
  }

  private blendAlpha(top: number, bottom: number, eva: number, evb: number): number {
    const mix = (a: number, b: number): number => Math.min(31, (a * eva + b * evb) >> 4);
    const tr = top & 31,
      tg = (top >> 5) & 31,
      tb = (top >> 10) & 31;
    const br = bottom & 31,
      bg = (bottom >> 5) & 31,
      bb = (bottom >> 10) & 31;
    return mix(tr, br) | (mix(tg, bg) << 5) | (mix(tb, bb) << 10);
  }
  private blendBrightness(color: number, evy: number, up: boolean): number {
    const ch = (c: number): number => (up ? c + (((31 - c) * evy) >> 4) : c - ((c * evy) >> 4));
    const r = ch(color & 31),
      g = ch((color >> 5) & 31),
      b = ch((color >> 10) & 31);
    return (r & 31) | ((g & 31) << 5) | ((b & 31) << 10);
  }

  private computeWindows(line: number, dispcnt: number): void {
    const winin = this.io16(0x48);
    const winout = this.io16(0x4a);
    const win0on = (dispcnt & 0x2000) !== 0;
    const win1on = (dispcnt & 0x4000) !== 0;
    const objWinOn = (dispcnt & 0x8000) !== 0;
    const inside = (n: number): number => (n === 0 ? winin & 0x3f : (winin >> 8) & 0x3f);
    const outMask = winout & 0x3f;
    const objWinMask = (winout >> 8) & 0x3f;

    const inWinV = (n: number): boolean => {
      const y1 = this.sys.io[0x44 + n * 2 + 1]!; // WIN0V hi = top, lo = bottom
      const top = (this.io16(0x44 + n * 2) >> 8) & 0xff;
      const bottom = this.io16(0x44 + n * 2) & 0xff;
      void y1;
      return bottom >= top ? line >= top && line < bottom : line >= top || line < bottom;
    };
    const win0V = win0on && inWinV(0);
    const win1V = win1on && inWinV(1);
    const xRange = (n: number): [number, number] => {
      const r = this.io16(0x40 + n * 2);
      return [(r >> 8) & 0xff, r & 0xff];
    };
    const [w0l, w0r] = xRange(0);
    const [w1l, w1r] = xRange(1);

    for (let x = 0; x < GBA_W; x += 1) {
      let mask = outMask;
      if (objWinOn && this.objWindow[x]) mask = objWinMask;
      if (win1V && x >= w1l && x < w1r) mask = inside(1);
      if (win0V && x >= w0l && x < w0r) mask = inside(0);
      this.winMask[x] = mask;
    }
  }
}
