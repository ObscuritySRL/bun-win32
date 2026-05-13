/**
 * Palette Painter
 *
 * Opens the native Windows Color picker in a loop and lets you build a custom
 * palette one swatch at a time. Each pick is appended to a live ANSI true-color
 * preview rendered in the terminal: a row of color blocks with hex codes, a
 * smooth gradient strip interpolated across all picked colors, and a detail
 * table with RGB and HSL breakdowns. Cancel the dialog to finish; the final
 * palette is also dumped as raw ANSI escape codes you can paste anywhere.
 *
 * APIs demonstrated (Comdlg32):
 *   - ChooseColorW          (native modal color picker dialog)
 *   - CommDlgExtendedError  (distinguish user cancel from real failure)
 *
 * CHOOSECOLORW layout (72 bytes on x64):
 *   +0x00: DWORD     lStructSize
 *   +0x08: HWND      hwndOwner          (0 = no owner)
 *   +0x10: HWND      hInstance          (unused — reserved)
 *   +0x18: COLORREF  rgbResult          (in/out — initial color, then picked color)
 *   +0x20: COLORREF* lpCustColors       (pointer to 16 custom-color slots)
 *   +0x28: DWORD     Flags              (CC_*)
 *   +0x30: LPARAM    lCustData
 *   +0x38: LPCCHOOKPROC lpfnHook
 *   +0x40: LPCWSTR   lpTemplateName
 *
 * COLORREF encoding: 0x00BBGGRR — little-endian DWORD, blue in high byte.
 *
 * Run: bun run example/palette-painter.ts
 */

import Comdlg32, { ChooseColorFlag } from '../index';
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

Comdlg32.Preload(['ChooseColorW', 'CommDlgExtendedError']);
Kernel32.Preload('GetConsoleWindow');
User32.Preload('GetForegroundWindow');

// Get an owner HWND so the modal dialog has a proper parent. Without one,
// ChooseColorW can spawn off-screen or behind the terminal — common under
// ConPTY-based hosts (VS Code, Windows Terminal). GetConsoleWindow returns
// the real console host; if that's 0n (some pseudo-terminals), fall back to
// whatever window currently has focus.
const hwndOwner: bigint = Kernel32.GetConsoleWindow() || User32.GetForegroundWindow();

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const WHITE = '\x1b[97m';
const GRAY = '\x1b[90m';

const CHOOSECOLORW_SIZE = 72;

const initialPalette = [0x004080ff, 0x0080ff80, 0x00ff8040, 0x00c040ff, 0x0040ffff, 0x00ff4080, 0x00ffff40, 0x00808080, 0x00ffffff, 0x00000000, 0x00800000, 0x00008000, 0x00000080, 0x00808000, 0x00800080, 0x00008080];

const custColors = Buffer.alloc(64);
for (let i = 0; i < initialPalette.length; i++) {
  custColors.writeUInt32LE(initialPalette[i]!, i * 4);
}

const cc = Buffer.alloc(CHOOSECOLORW_SIZE);
const ccView = new DataView(cc.buffer);
ccView.setUint32(0x00, CHOOSECOLORW_SIZE, true);
ccView.setBigUint64(0x08, hwndOwner, true); // hwndOwner — so the dialog is positioned and z-ordered relative to the terminal
ccView.setBigUint64(0x20, BigInt(custColors.ptr!), true);
ccView.setUint32(0x28, ChooseColorFlag.CC_FULLOPEN | ChooseColorFlag.CC_RGBINIT | ChooseColorFlag.CC_ANYCOLOR, true);

interface Swatch {
  r: number;
  g: number;
  b: number;
  hex: string;
  hsl: [number, number, number];
}

const palette: Swatch[] = [];

function unpackColorRef(colorref: number): { r: number; g: number; b: number } {
  return {
    r: colorref & 0xff,
    g: (colorref >> 8) & 0xff,
    b: (colorref >> 16) & 0xff,
  };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      break;
    case gn:
      h = ((bn - rn) / d + 2) / 6;
      break;
    default:
      h = ((rn - gn) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function bg(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m`;
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function render(): void {
  console.clear();
  console.log();
  console.log(`  ${CYAN}${BOLD}PALETTE PAINTER${RESET}  ${DIM}${palette.length} swatch${palette.length === 1 ? '' : 'es'}${RESET}`);
  console.log();

  if (palette.length === 0) {
    console.log(`  ${GRAY}(empty — pick a color from the dialog to begin)${RESET}`);
    console.log();
    return;
  }

  // Swatch row — large colored blocks with hex codes
  const blockWidth = 14;
  let row1 = '  ';
  let row2 = '  ';
  let row3 = '  ';
  for (const c of palette) {
    const block = ' '.repeat(blockWidth);
    row1 += `${bg(c.r, c.g, c.b)}${block}${RESET}`;
    row2 += `${bg(c.r, c.g, c.b)}${' '.repeat(blockWidth)}${RESET}`;
    const label = c.hex.padStart(blockWidth - 1).padEnd(blockWidth);
    row3 += `${WHITE}${BOLD}${label}${RESET}`;
  }
  console.log(row1);
  console.log(row2);
  console.log(row3);
  console.log();

  // Gradient strip — smooth interpolation across all picked colors
  if (palette.length >= 2) {
    const stripWidth = palette.length * blockWidth;
    let strip = '  ';
    for (let x = 0; x < stripWidth; x++) {
      const pos = (x / (stripWidth - 1)) * (palette.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.min(lo + 1, palette.length - 1);
      const t = pos - lo;
      const a = palette[lo]!;
      const b = palette[hi]!;
      const r = lerp(a.r, b.r, t);
      const g = lerp(a.g, b.g, t);
      const bb = lerp(a.b, b.b, t);
      strip += `${bg(r, g, bb)} ${RESET}`;
    }
    console.log(strip);
    console.log();
  }

  // Detailed swatch table
  console.log(`  ${DIM}${'IDX'.padEnd(4)} ${'PREVIEW'.padEnd(10)} ${'HEX'.padEnd(10)} ${'RGB'.padEnd(18)} ${'HSL'}${RESET}`);
  console.log(`  ${DIM}${'─'.repeat(60)}${RESET}`);
  palette.forEach((c, i) => {
    const swatch = `${bg(c.r, c.g, c.b)}        ${RESET}`;
    const rgbStr = `(${c.r},${c.g},${c.b})`.padEnd(18);
    const hslStr = `(${Math.round(c.hsl[0])}°, ${Math.round(c.hsl[1])}%, ${Math.round(c.hsl[2])}%)`;
    console.log(`  ${WHITE}${String(i + 1).padEnd(4)}${RESET} ${swatch}  ${BOLD}${c.hex.padEnd(10)}${RESET} ${rgbStr} ${hslStr}`);
  });
  console.log();
  console.log(`  ${GRAY}Pick another color, or click Cancel to finish.${RESET}`);
  console.log();
}

const MAX_PICKS = 8;

render();

for (let i = 0; i < MAX_PICKS; i++) {
  const ok = Comdlg32.ChooseColorW(cc.ptr!);
  if (!ok) {
    const err = Comdlg32.CommDlgExtendedError();
    if (err !== 0) {
      console.error(`ChooseColorW failed with CommDlgExtendedError = 0x${err.toString(16)}`);
      process.exit(1);
    }
    break;
  }

  // Read the rgbResult field that the dialog wrote back
  const rgbResult = ccView.getUint32(0x18, true);
  const { r, g, b } = unpackColorRef(rgbResult);
  const hex = `#${[r, g, b]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
  palette.push({ r, g, b, hex, hsl: rgbToHsl(r, g, b) });

  render();
}

console.log(`  ${CYAN}${BOLD}Final palette as ANSI escape codes:${RESET}`);
console.log();
for (const c of palette) {
  console.log(`    \\x1b[48;2;${c.r};${c.g};${c.b}m${' '.repeat(20)}\\x1b[0m  ${c.hex}`);
}
console.log();
