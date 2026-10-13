// The one color Afterimage borrows from you: the Windows accent. It is re-lit in OKLab so any
// accent — pale yellow or deep navy — lands at the same perceived brightness on dark glass while
// keeping its hue and chroma.

import { ptr } from 'bun:ffi';

import Dwmapi from '@bun-win32/dwmapi';

import type { Color } from '../shared/painter';

const fallback: Color = [0.38, 0.38, 0.73, 1];

export function accentPalette(): { base: Color; glow: Color } {
  const source = systemAccent();
  return { base: relight(source, 0.68, 1), glow: relight(source, 0.82, 0.35) };
}

/** Straight-alpha accent from DWM, or a calm periwinkle when DWM won't say. */
export function systemAccent(): Color {
  const colorization = new Uint32Array(new ArrayBuffer(4));
  const opaque = new Int32Array(new ArrayBuffer(4));
  if (Dwmapi.DwmGetColorizationColor(ptr(colorization), ptr(opaque)) !== 0) return fallback;
  const value = colorization[0]!;
  return [((value >>> 16) & 0xff) / 255, ((value >>> 8) & 0xff) / 255, (value & 0xff) / 255, 1];
}

/** Set OKLab lightness to `lightness` (0–1), keeping hue and (gamut-clamped) chroma. */
export function relight(color: Color, lightness: number, alpha: number): Color {
  const [, a, b] = toOklab(color);
  const chroma = Math.hypot(a, b);
  const hue = Math.atan2(b, a);
  for (let scale = 1; scale > 0; scale -= 0.05) {
    const candidate = fromOklab(lightness, Math.cos(hue) * chroma * scale, Math.sin(hue) * chroma * scale);
    if (candidate.every((channel) => channel >= 0 && channel <= 1)) return [candidate[0]!, candidate[1]!, candidate[2]!, alpha];
  }
  return [lightness, lightness, lightness, alpha];
}

function fromLinear(value: number): number {
  return value <= 0.003_130_8 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
}

function fromOklab(lightness: number, a: number, b: number): number[] {
  const long = (lightness + 0.396_337_777_4 * a + 0.215_803_757_3 * b) ** 3;
  const medium = (lightness - 0.105_561_345_8 * a - 0.063_854_172_8 * b) ** 3;
  const short = (lightness - 0.089_484_177_5 * a - 1.291_485_548 * b) ** 3;
  return [
    fromLinear(4.076_741_662_1 * long - 3.307_711_591_3 * medium + 0.230_969_929_2 * short),
    fromLinear(-1.268_438_004_6 * long + 2.609_757_401_1 * medium - 0.341_319_396_5 * short),
    fromLinear(-0.004_196_086_3 * long - 0.703_418_614_7 * medium + 1.707_614_701 * short),
  ];
}

function toLinear(value: number): number {
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function toOklab(color: Color): [number, number, number] {
  const red = toLinear(color[0]);
  const green = toLinear(color[1]);
  const blue = toLinear(color[2]);
  const long = Math.cbrt(0.412_221_470_8 * red + 0.536_332_536_3 * green + 0.051_445_992_9 * blue);
  const medium = Math.cbrt(0.211_903_498_2 * red + 0.680_699_545_1 * green + 0.107_396_956_6 * blue);
  const short = Math.cbrt(0.088_302_461_9 * red + 0.281_718_837_6 * green + 0.629_978_700_5 * blue);
  return [0.210_454_255_3 * long + 0.793_617_785 * medium - 0.004_072_046_8 * short, 1.977_998_495_1 * long - 2.428_592_205 * medium + 0.450_593_709_9 * short, 0.025_904_037_1 * long + 0.782_771_766_2 * medium - 0.808_675_766 * short];
}
