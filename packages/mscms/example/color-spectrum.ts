/**
 * Color Spectrum
 *
 * Opens the system sRGB ICC profile, validates it, prints its full header,
 * then renders an animated 24-bit color spectrum wheel in the terminal. The
 * wheel rotates and a moving cursor highlights one hue at a time, showing
 * its RGB, HSV, and Lab values - all driven by the real ICC profile that
 * Windows ships in C:\Windows\System32\spool\drivers\color.
 *
 * The bar shows a round-trip delta-E (sRGB -> PCS -> sRGB) computed by the
 * Win32 CMM via CreateMultiProfileTransform + TranslateColors. In-gamut
 * sRGB colors survive the round-trip exactly; any non-zero delta would mean
 * the CMM clipped or remapped the color. Lab is computed in JS from sRGB so
 * the perceptual coordinates are shown alongside the raw RGB.
 *
 * APIs demonstrated (Mscms):
 *   - GetColorDirectoryW            (locate the color directory)
 *   - OpenColorProfileW             (open the sRGB profile by filename)
 *   - GetColorProfileHeader         (128-byte ICC header)
 *   - IsColorProfileValid           (signature + structure validation)
 *   - GetCountColorProfileElements  (number of ICC tags in the profile)
 *   - CreateMultiProfileTransform   (RGB -> Lab via Win32 CMM)
 *   - TranslateColors               (run the transform on a batch of colors)
 *   - DeleteColorTransform          (release transform)
 *   - CloseColorProfile             (release profile handle)
 *
 * COLOR union (16 bytes on x64; we only touch the rgb and Lab fields):
 *   RGBCOLOR: WORD red, WORD green, WORD blue           (offsets 0, 2, 4)
 *   LabCOLOR: WORD L, WORD a, WORD b                    (offsets 0, 2, 4)
 *   Win32 stores Lab as L*256 (0..25600), a/b as a+128 then *256 (signed offset)
 *
 * Run: bun run example/color-spectrum.ts
 */

import Mscms, { COLORTYPE, INTENT, PROFILE_ACCESS, PROFILE_TYPE, TRANSFORM_FLAG } from '../index';

Mscms.Preload(['CloseColorProfile', 'CreateMultiProfileTransform', 'DeleteColorTransform', 'GetColorDirectoryW', 'GetColorProfileHeader', 'GetCountColorProfileElements', 'IsColorProfileValid', 'OpenColorProfileW', 'TranslateColors']);

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const GRAY = '\x1b[90m';
const WHITE = '\x1b[97m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';

const OPEN_EXISTING = 3;
const SPECTRUM_SAMPLES = 60; // colors around the wheel
const FRAMES = 90;
const FRAME_MS = 40;

// ── 1. Find and open the system sRGB profile ───────────────────────────────
const dirBuf = Buffer.alloc(520);
const dirSize = Buffer.alloc(4);
dirSize.writeUInt32LE(dirBuf.byteLength, 0);
Mscms.GetColorDirectoryW(null, dirBuf.ptr!, dirSize.ptr!);
const colorDirectory = new TextDecoder('utf-16').decode(dirBuf.subarray(0, dirSize.readUInt32LE(0))).replace(/\0+$/, '');
const sRgbPath = `${colorDirectory}\\sRGB Color Space Profile.icm`;
const pathW = Buffer.from(`${sRgbPath}\0`, 'utf16le');

const profileStruct = Buffer.alloc(24);
profileStruct.writeUInt32LE(PROFILE_TYPE.PROFILE_FILENAME, 0);
profileStruct.writeBigUInt64LE(BigInt(pathW.ptr!), 8);
profileStruct.writeUInt32LE(pathW.byteLength, 16);

const hProfile = Mscms.OpenColorProfileW(profileStruct.ptr!, PROFILE_ACCESS.PROFILE_READ, 1 /* FILE_SHARE_READ */, OPEN_EXISTING);
if (hProfile === 0n) {
  console.error(`${RED}Failed to open ${sRgbPath}${RESET}`);
  process.exit(1);
}

// Validate + read the header
const validBuf = Buffer.alloc(4);
Mscms.IsColorProfileValid(hProfile, validBuf.ptr!);
const valid = validBuf.readUInt32LE(0) !== 0;

const header = Buffer.alloc(128);
Mscms.GetColorProfileHeader(hProfile, header.ptr!);

const tagCount = Buffer.alloc(4);
Mscms.GetCountColorProfileElements(hProfile, tagCount.ptr!);

const profileSize = header.readUInt32LE(0);
const cmm = header.readUInt32LE(4);
const version = header.readUInt32LE(8);

function fourCC(value: number): string {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff].map((c) => (c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : ' ')).join('');
}

// ── 2. Build a [sRGB, sRGB] round-trip transform - any non-zero delta on
//      a round-trip means the CMM clipped or remapped the color.
const profileArray = Buffer.alloc(16); // 2 x HPROFILE on x64
profileArray.writeBigUInt64LE(hProfile, 0);
profileArray.writeBigUInt64LE(hProfile, 8);

const intentArray = Buffer.alloc(4);
intentArray.writeUInt32LE(INTENT.INTENT_PERCEPTUAL, 0);

const hxform = Mscms.CreateMultiProfileTransform(profileArray.ptr!, 2, intentArray.ptr!, 1, TRANSFORM_FLAG.BEST_MODE, 0);

const hasTransform = hxform !== 0n;

// ── 3. Generate a hue spectrum and translate it through the CMM ────────────
interface Sample {
  hue: number;
  r: number;
  g: number;
  b: number;
  L: number;
  a: number;
  bLab: number;
  rtDelta: number; // round-trip delta from CMM
}

// sRGB -> Lab in JS using D65 reference white. Standard CIE math.
function srgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Inverse companding (sRGB -> linear)
  const lin = (c: number): number => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const rL = lin(r);
  const gL = lin(g);
  const bL = lin(b);

  // Linear sRGB -> XYZ (D65)
  const x = rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375;
  const y = rL * 0.2126729 + gL * 0.7151522 + bL * 0.072175;
  const z = rL * 0.0193339 + gL * 0.119192 + bL * 0.9503041;

  // XYZ -> Lab (D65 reference white)
  const Xn = 0.95047;
  const Yn = 1.0;
  const Zn = 1.08883;
  const f = (t: number): number => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const fx = f(x / Xn);
  const fy = f(y / Yn);
  const fz = f(z / Zn);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const hh = (h / 60) % 6;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = v - c;
  return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

const COLOR_UNION_SIZE = 16;
const inColors = Buffer.alloc(SPECTRUM_SAMPLES * COLOR_UNION_SIZE);
const outColors = Buffer.alloc(SPECTRUM_SAMPLES * COLOR_UNION_SIZE);
const samples: Sample[] = [];

for (let i = 0; i < SPECTRUM_SAMPLES; i++) {
  const hue = (i / SPECTRUM_SAMPLES) * 360;
  const [r, g, b] = hsvToRgb(hue, 0.9, 0.95);
  // RGBCOLOR uses WORDs scaled to 0..65535
  const o = i * COLOR_UNION_SIZE;
  const r16 = Math.round((r / 255) * 0xffff);
  const g16 = Math.round((g / 255) * 0xffff);
  const b16 = Math.round((b / 255) * 0xffff);
  inColors.writeUInt16LE(r16, o);
  inColors.writeUInt16LE(g16, o + 2);
  inColors.writeUInt16LE(b16, o + 4);
  const [L, a, bLab] = srgbToLab(r, g, b);
  samples.push({ hue, r, g, b, L, a, bLab, rtDelta: 0 });
}

// Round-trip through the [sRGB, sRGB] transform - in-gamut sRGB colors
// should come back unchanged. The Euclidean delta over (R,G,B) in 0..255 is
// the CMM's measured round-trip error.
if (hasTransform) {
  Mscms.TranslateColors(hxform, inColors.ptr!, SPECTRUM_SAMPLES, COLORTYPE.COLOR_RGB, outColors.ptr!, COLORTYPE.COLOR_RGB);
  for (let i = 0; i < SPECTRUM_SAMPLES; i++) {
    const o = i * COLOR_UNION_SIZE;
    const r2 = (outColors.readUInt16LE(o) / 0xffff) * 255;
    const g2 = (outColors.readUInt16LE(o + 2) / 0xffff) * 255;
    const b2 = (outColors.readUInt16LE(o + 4) / 0xffff) * 255;
    const dr = r2 - samples[i]!.r;
    const dg = g2 - samples[i]!.g;
    const db = b2 - samples[i]!.b;
    samples[i]!.rtDelta = Math.sqrt(dr * dr + dg * dg + db * db);
  }
}

// ── 4. Animation loop ──────────────────────────────────────────────────────

process.stdout.write('\x1b[?25l'); // hide cursor
process.on('SIGINT', () => {
  process.stdout.write('\x1b[?25h\n');
  process.exit(0);
});

function rgbBg(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m`;
}
function rgbFg(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

const WHEEL_WIDTH = 60;

function frame(frameIdx: number): string {
  const offset = (frameIdx / FRAMES) * SPECTRUM_SAMPLES;
  const cursor = Math.floor(offset) % SPECTRUM_SAMPLES;
  const lines: string[] = [];

  // Header card
  lines.push(`${BOLD}${WHITE}sRGB Color Spectrum${RESET}  ${DIM}${sRgbPath}${RESET}`);
  lines.push(`${DIM}${'─'.repeat(80)}${RESET}`);
  const v = `ICC ${(version >>> 24) & 0xff}.${(version >>> 20) & 0x0f}.${(version >>> 16) & 0x0f}`;
  const status = valid ? `${GREEN}VALID${RESET}` : `${RED}INVALID${RESET}`;
  lines.push(
    `${GRAY}CMM${RESET}  ${WHITE}${fourCC(cmm)}${RESET}    ${GRAY}Version${RESET}  ${WHITE}${v}${RESET}    ${GRAY}Tags${RESET}  ${WHITE}${tagCount.readUInt32LE(0)}${RESET}    ${GRAY}Size${RESET}  ${WHITE}${profileSize} B${RESET}    ${status}`,
  );
  if (!hasTransform) {
    lines.push(`${YELLOW}note: CreateMultiProfileTransform failed - Lab values unavailable${RESET}`);
  }
  lines.push('');

  // Wheel: render the spectrum as a horizontal bar with two rows of
  // background-colored cells. The cursor highlights one hue.
  let topRow = '';
  let botRow = '';
  for (let x = 0; x < WHEEL_WIDTH; x++) {
    const idx = Math.floor(((x + offset) / WHEEL_WIDTH) * SPECTRUM_SAMPLES) % SPECTRUM_SAMPLES;
    const s = samples[idx]!;
    const isCursor = idx === cursor;
    topRow += `${rgbBg(s.r, s.g, s.b)}${isCursor ? `${rgbFg(0, 0, 0)}▼` : ' '}${RESET}`;
    botRow += `${rgbBg(s.r, s.g, s.b)} ${RESET}`;
  }
  lines.push(topRow);
  lines.push(botRow);
  lines.push('');

  // Detail card for the cursor color
  const c = samples[cursor]!;
  const block = `${rgbBg(c.r, c.g, c.b)}      ${RESET}`;
  lines.push(`  ${block}  ${BOLD}${rgbFg(c.r, c.g, c.b)}hue ${c.hue.toFixed(1).padStart(5)}°${RESET}`);
  lines.push(
    `        ${GRAY}RGB${RESET}  ${WHITE}${c.r.toString().padStart(3)}, ${c.g.toString().padStart(3)}, ${c.b.toString().padStart(3)}${RESET}      ${GRAY}#${RESET}${WHITE}${c.r.toString(16).padStart(2, '0').toUpperCase()}${c.g.toString(16).padStart(2, '0').toUpperCase()}${c.b.toString(16).padStart(2, '0').toUpperCase()}${RESET}`,
  );
  lines.push(
    `        ${GRAY}Lab${RESET}  ${CYAN}L*${RESET} ${WHITE}${c.L.toFixed(2).padStart(6)}${RESET}  ${CYAN}a*${RESET} ${WHITE}${c.a.toFixed(2).padStart(7)}${RESET}  ${CYAN}b*${RESET} ${WHITE}${c.bLab.toFixed(2).padStart(7)}${RESET}  ${DIM}(D65, sRGB math)${RESET}`,
  );
  if (hasTransform) {
    const deltaColor = c.rtDelta < 1 ? GREEN : c.rtDelta < 3 ? YELLOW : RED;
    lines.push(`        ${GRAY}CMM${RESET}  ${GRAY}round-trip ΔRGB${RESET}  ${deltaColor}${c.rtDelta.toFixed(3)}${RESET}  ${DIM}(via TranslateColors)${RESET}`);
  }

  return lines.join('\n');
}

// Print initial frame, then redraw in place
const initial = frame(0);
process.stdout.write(initial + '\n');
const frameLineCount = initial.split('\n').length;

for (let i = 1; i <= FRAMES; i++) {
  await new Promise((r) => setTimeout(r, FRAME_MS));
  process.stdout.write(`\x1b[${frameLineCount}A`); // move cursor up
  process.stdout.write(frame(i) + '\n');
}

// ── 5. Cleanup ─────────────────────────────────────────────────────────────
if (hasTransform) Mscms.DeleteColorTransform(hxform);
Mscms.CloseColorProfile(hProfile);
process.stdout.write('\x1b[?25h'); // show cursor
