// Visual language: Windows 11's own typeface (Segoe UI Variable, optical sizes Display/Text/Small), the user's accent
// colour pulled from DWM and lifted until it reads on a dark backdrop, and a small set of white-alpha text tones.

import Dwmapi from '@bun-win32/dwmapi';

import type { TextStyle } from './text';

export type Rgb = readonly [number, number, number];

const DISPLAY = 'Segoe UI Variable Display';
const TEXT = 'Segoe UI Variable Text';
const SMALL = 'Segoe UI Variable Small';
export const ICONS = 'Segoe Fluent Icons';

/** The user's accent colour, normalised to a vivid, legible tone for a dark scene. */
export function accentColor(): Rgb {
  const color = Buffer.alloc(4);
  const opaque = Buffer.alloc(4);
  let red = 0.38;
  let green = 0.62;
  let blue = 1;
  if (Dwmapi.DwmGetColorizationColor(color.ptr, opaque.ptr) === 0) {
    const value = color.readUInt32LE(0);
    red = ((value >> 16) & 0xff) / 255;
    green = ((value >> 8) & 0xff) / 255;
    blue = (value & 0xff) / 255;
  }
  const maximum = Math.max(red, green, blue, 0.001);
  const minimum = Math.min(red, green, blue);
  if (maximum - minimum < 0.08) return [0.42, 0.66, 1];
  const lift = 0.95 / maximum;
  red = Math.min(1, red * lift);
  green = Math.min(1, green * lift);
  blue = Math.min(1, blue * lift);
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  if (luminance < 0.45) {
    const mix = (0.45 - luminance) / (1 - luminance);
    red += (1 - red) * mix;
    green += (1 - green) * mix;
    blue += (1 - blue) * mix;
  }
  return [red, green, blue];
}

export function white(alpha: number): readonly [number, number, number, number] {
  return [alpha, alpha, alpha, alpha];
}

export function tinted(color: Rgb, alpha: number): readonly [number, number, number, number] {
  return [color[0] * alpha, color[1] * alpha, color[2] * alpha, alpha];
}

export interface Typography {
  appName: TextStyle;
  caption: TextStyle;
  colophonBody: TextStyle;
  colophonFigure: TextStyle;
  colophonLabel: TextStyle;
  colophonTitle: TextStyle;
  footerKey: TextStyle;
  footerText: TextStyle;
  icon: TextStyle;
  iconLarge: TextStyle;
  placeholder: TextStyle;
  query: TextStyle;
  readerBody: TextStyle;
  readerTitle: TextStyle;
  snippet: TextStyle;
  stat: TextStyle;
  tagline: TextStyle;
  title: TextStyle;
  titleLarge: TextStyle;
  wordmark: TextStyle;
}

export function typography(accent: Rgb): Typography {
  return {
    appName: { color: white(0.55), family: TEXT, size: 12.5, weight: 400 },
    caption: { color: white(0.5), family: SMALL, size: 12, weight: 400 },
    colophonBody: { color: white(0.72), family: TEXT, lineHeight: 21, lines: 12, size: 14, weight: 400 },
    colophonFigure: { color: white(0.96), family: DISPLAY, size: 30, weight: 600 },
    colophonLabel: { color: white(0.5), family: SMALL, size: 11.5, weight: 600 },
    colophonTitle: { color: white(0.96), family: DISPLAY, size: 26, weight: 600 },
    footerKey: { color: white(0.82), family: TEXT, size: 12, weight: 600 },
    footerText: { color: white(0.5), family: TEXT, size: 12.5, weight: 400 },
    icon: { color: white(0.6), family: ICONS, size: 18, weight: 400 },
    iconLarge: { color: tinted(accent, 0.9), family: ICONS, size: 44, weight: 400 },
    placeholder: { color: white(0.5), family: TEXT, size: 18, weight: 400 },
    query: { color: white(0.96), family: TEXT, size: 19, weight: 500 },
    readerBody: { color: white(0.74), family: TEXT, lineHeight: 22, lines: 40, size: 14.5, weight: 400 },
    readerTitle: { color: white(0.95), family: DISPLAY, size: 22, weight: 600 },
    snippet: { color: white(0.68), family: TEXT, italic: false, size: 12.5, weight: 400 },
    stat: { color: white(0.42), family: SMALL, size: 12, weight: 500 },
    tagline: { color: white(0.45), family: TEXT, size: 13, weight: 400 },
    title: { color: white(0.93), family: DISPLAY, size: 15, weight: 600 },
    titleLarge: { color: white(0.96), family: DISPLAY, size: 26, weight: 600 },
    wordmark: { color: white(0.96), family: DISPLAY, size: 22, weight: 700 },
  };
}
