/**
 * Theme Detective - Uncover your system's visual identity.
 *
 * Detects the full visual theme profile of the current Windows installation.
 * Uses DwmGetColorizationColor to extract the system accent color (decoded into
 * ARGB components). Uses DwmIsCompositionEnabled to verify the compositor state.
 * Cross-package: uses Advapi32 from '@bun-win32/advapi32' to read registry keys
 * under HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize to
 * determine whether apps and the system are using light or dark theme.
 *
 * Presents the findings as a colorful "Theme Report Card" with the accent color
 * shown as hex, RGB, and a visual swatch approximation in the terminal.
 *
 * Demonstrates:
 * - DwmIsCompositionEnabled
 * - DwmGetColorizationColor (ARGB decode, opaque blend flag)
 * - Cross-package registry reads (Advapi32.RegOpenKeyExW, RegQueryValueExW, RegCloseKey)
 * - HKEY_CURRENT_USER registry constants
 *
 * Run: bun run example/theme-detective.ts
 */

import Dwmapi from '../index';
import Advapi32, { HKEY_CURRENT_USER, RegKeyAccessRights, RegType } from '@bun-win32/advapi32';

const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Helper to read a DWORD registry value
function readRegistryDword(hKey: bigint, valueName: string): number | null {
  const nameWide = encode(valueName);
  const typeBuf = Buffer.alloc(4);
  const dataBuf = Buffer.alloc(4);
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(4, 0);

  const result = Advapi32.RegQueryValueExW(hKey, nameWide.ptr, null, typeBuf.ptr, dataBuf.ptr, sizeBuf.ptr);
  if (result !== 0) return null;

  const regType = typeBuf.readUInt32LE(0);
  if (regType !== RegType.REG_DWORD) return null;

  return dataBuf.readUInt32LE(0);
}

// Helper to produce an ANSI color block approximating the given RGB
function colorSwatch(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m      \x1b[0m`;
}

function modeEmoji(isDark: boolean | null): string {
  if (isDark === null) return '  (unknown)';
  return isDark ? '  DARK MODE' : '  LIGHT MODE';
}

console.log('');
console.log('  +------------------------------------------+');
console.log('  |        THEME DETECTIVE REPORT CARD        |');
console.log('  |   "What colors is your OS really wearing?" |');
console.log('  +------------------------------------------+');
console.log('');

// 1. Check DWM composition status
const enabledBuf = Buffer.alloc(4);
const compositionHr = Dwmapi.DwmIsCompositionEnabled(enabledBuf.ptr);
const compositionEnabled = compositionHr === 0 && enabledBuf.readInt32LE(0) !== 0;

console.log('  COMPOSITOR STATUS');
if (compositionHr !== 0) {
  console.log(`    DWM Composition:  QUERY FAILED (HRESULT: 0x${(compositionHr >>> 0).toString(16)})`);
} else {
  console.log(`    DWM Composition:  ${compositionEnabled ? 'ENABLED (Desktop Window Manager is active)' : 'DISABLED'}`);
}
console.log('');

// 2. Get the system accent color
const colorBuf = Buffer.alloc(4);
const opaqueBlendBuf = Buffer.alloc(4);
const colorHr = Dwmapi.DwmGetColorizationColor(colorBuf.ptr, opaqueBlendBuf.ptr);

console.log('  ACCENT COLOR ANALYSIS');
if (colorHr !== 0) {
  console.log(`    Accent Color:     QUERY FAILED (HRESULT: 0x${(colorHr >>> 0).toString(16)})`);
} else {
  const rawColor = colorBuf.readUInt32LE(0);
  const alpha = (rawColor >>> 24) & 0xff;
  const red = (rawColor >>> 16) & 0xff;
  const green = (rawColor >>> 8) & 0xff;
  const blue = rawColor & 0xff;
  const opaqueBlend = opaqueBlendBuf.readInt32LE(0) !== 0;

  const hexColor = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;

  console.log(`    Raw ARGB Value:   0x${rawColor.toString(16).padStart(8, '0').toUpperCase()}`);
  console.log(`    Hex Color:        ${hexColor.toUpperCase()}`);
  console.log(`    RGB Components:   R=${red}  G=${green}  B=${blue}`);
  console.log(`    Alpha Channel:    ${alpha} (${Math.round((alpha / 255) * 100)}% opaque)`);
  console.log(`    Opaque Blend:     ${opaqueBlend ? 'Yes (color is blended opaquely)' : 'No (color has transparency)'}`);
  console.log(`    Color Swatch:     ${colorSwatch(red, green, blue)}  <-- Your accent color!`);

  // Classify the color by hue for fun
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    if (max === red) hue = ((green - blue) / d + (green < blue ? 6 : 0)) * 60;
    else if (max === green) hue = ((blue - red) / d + 2) * 60;
    else hue = ((red - green) / d + 4) * 60;
  }

  let colorFamily = 'Neutral';
  if (max - min < 20) colorFamily = 'Neutral / Gray';
  else if (hue < 15 || hue >= 345) colorFamily = 'Red';
  else if (hue < 45) colorFamily = 'Orange';
  else if (hue < 75) colorFamily = 'Yellow';
  else if (hue < 165) colorFamily = 'Green';
  else if (hue < 195) colorFamily = 'Cyan';
  else if (hue < 265) colorFamily = 'Blue';
  else if (hue < 290) colorFamily = 'Violet';
  else colorFamily = 'Magenta / Pink';

  console.log(`    Color Family:     ${colorFamily} (hue: ${Math.round(hue)}deg)`);
}
console.log('');

// 3. Read theme preferences from registry
console.log('  THEME PREFERENCES (Registry)');

const subKeyPath = encode('SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize');
const hKeyBuf = Buffer.alloc(8);

const openResult = Advapi32.RegOpenKeyExW(
  HKEY_CURRENT_USER,
  subKeyPath.ptr,
  0,
  RegKeyAccessRights.KEY_READ,
  hKeyBuf.ptr,
);

if (openResult !== 0) {
  console.log(`    Registry Key:     FAILED TO OPEN (error: ${openResult})`);
  console.log('    (Theme preferences could not be read)');
} else {
  const hKey = hKeyBuf.readBigUInt64LE(0);

  const appsLightTheme = readRegistryDword(hKey, 'AppsUseLightTheme');
  const systemLightTheme = readRegistryDword(hKey, 'SystemUsesLightTheme');
  const enableTransparency = readRegistryDword(hKey, 'EnableTransparency');
  const colorPrevalence = readRegistryDword(hKey, 'ColorPrevalence');

  const appsDark = appsLightTheme !== null ? appsLightTheme === 0 : null;
  const systemDark = systemLightTheme !== null ? systemLightTheme === 0 : null;

  console.log(`    App Theme:        ${appsDark !== null ? (appsDark ? 'Dark' : 'Light') : 'Unknown'}${modeEmoji(appsDark)}`);
  console.log(`    System Theme:     ${systemDark !== null ? (systemDark ? 'Dark' : 'Light') : 'Unknown'}${modeEmoji(systemDark)}`);
  console.log(`    Transparency:     ${enableTransparency !== null ? (enableTransparency ? 'Enabled' : 'Disabled') : 'Unknown'}`);
  console.log(`    Color Prevalence: ${colorPrevalence !== null ? (colorPrevalence ? 'Accent color on Start/taskbar' : 'Default colors') : 'Unknown'}`);

  // Determine the overall theme "personality"
  console.log('');
  console.log('  THEME PERSONALITY');
  if (appsDark && systemDark) {
    console.log('    You are a creature of the night! Both apps and system');
    console.log('    are in dark mode. Your eyes thank you during late-night');
    console.log('    coding sessions.');
  } else if (!appsDark && !systemDark) {
    console.log('    A bright and cheerful setup! Light mode across the board.');
    console.log('    You probably enjoy coding with the curtains open and');
    console.log('    sunlight streaming in.');
  } else if (appsDark && !systemDark) {
    console.log('    The best of both worlds! Dark apps for comfortable reading');
    console.log('    with a light system chrome for that clean desktop look.');
  } else if (!appsDark && systemDark) {
    console.log('    An unusual combination! Dark system with light apps. You');
    console.log('    like a sleek taskbar but prefer traditional bright windows.');
  } else {
    console.log('    Your theme preferences are... mysterious. The detective');
    console.log('    could not fully determine your style.');
  }

  Advapi32.RegCloseKey(hKey);
}

console.log('');
console.log('  +------------------------------------------+');
console.log('  |       Case closed. Theme identified.      |');
console.log('  +------------------------------------------+');
console.log('');
