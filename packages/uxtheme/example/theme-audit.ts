/**
 * Visual Style Audit
 *
 * Audits the active Windows visual style and prints a structured report with
 * the current theme file, color scheme, size scheme, documentation metadata,
 * theming flags, and per-state measurements for themed button rendering.
 *
 * The report opens the `BUTTON` theme class without requiring a real window,
 * then queries multiple properties for several push-button states. Colors are
 * decoded from COLORREF values, margins are unpacked from the native MARGINS
 * struct, and transition durations are read from the theme's animation data.
 *
 * APIs demonstrated:
 *   - GetCurrentThemeName            (active theme path, color scheme, size scheme)
 *   - GetThemeDocumentationProperty  (display name, canonical name, tooltip, author)
 *   - GetThemeAppProperties          (per-process theming flags)
 *   - IsAppThemed                    (application theming enabled)
 *   - IsCompositionActive            (desktop composition availability)
 *   - IsThemeActive                  (visual styles active)
 *   - OpenThemeData                  (open the BUTTON theme class)
 *   - CloseThemeData                 (release the theme handle)
 *   - GetThemeBool                   (boolean state/property queries)
 *   - GetThemeColor                  (fill, border, and text colors)
 *   - GetThemeInt                    (border size)
 *   - GetThemeMargins                (content margins)
 *   - GetThemePartSize               (draw size)
 *   - GetThemeTransitionDuration     (state transition timing)
 *
 * Run: bun run example/theme-audit.ts
 */

import Uxtheme, { MAX_THEMECOLOR, MAX_THEMESIZE, SZ_THDOCPROP_AUTHOR, SZ_THDOCPROP_CANONICALNAME, SZ_THDOCPROP_DISPLAYNAME, SZ_THDOCPROP_TOOLTIP, ThemeAppProperty, ThemeSize } from '../index';

const BUTTON_CLASS_NAME = 'BUTTON';
const BUTTON_PART_PUSHBUTTON = 1;
const PUSH_BUTTON_STATES = [
  { id: 1, label: 'normal' },
  { id: 2, label: 'hot' },
  { id: 3, label: 'pressed' },
  { id: 4, label: 'disabled' },
  { id: 5, label: 'defaulted' },
] as const;
const DOCUMENTATION_VALUE_CHARACTER_COUNT = 260;
const MARGINS_STRUCT_SIZE = 16;
const SIZE_STRUCT_SIZE = 8;
const THEME_FILE_CHARACTER_COUNT = 520;
const TMT_BORDERCOLOR = 3801;
const TMT_BORDERCOLORHINT = 3822;
const TMT_BORDERSIZE = 2403;
const TMT_CONTENTMARGINS = 3602;
const TMT_FILLCOLOR = 3802;
const TMT_FILLCOLORHINT = 3821;
const TMT_TEXTCOLOR = 3803;
const TMT_TRANSITIONDURATIONS = 6000;
const TMT_TRANSPARENT = 2201;

Uxtheme.Preload([
  'CloseThemeData',
  'GetCurrentThemeName',
  'GetThemeAppProperties',
  'GetThemeBool',
  'GetThemeColor',
  'GetThemeDocumentationProperty',
  'GetThemeInt',
  'GetThemeMargins',
  'GetThemePartSize',
  'GetThemeTransitionDuration',
  'IsAppThemed',
  'IsCompositionActive',
  'IsThemeActive',
  'OpenThemeData',
]);

function encodeWideString(text: string): Buffer {
  return Buffer.from(`${text}\0`, 'utf16le');
}

function decodeWideBuffer(buffer: Buffer): string {
  return buffer.toString('utf16le').replace(/\0.*$/, '');
}

function formatBoolean(value: boolean): string {
  return value ? 'yes' : 'no';
}

function formatOptionalBoolean(value: boolean | null): string {
  if (value === null) {
    return 'n/a';
  }

  return formatBoolean(value);
}

function formatColor(colorRef: number | null): string {
  if (colorRef === null) {
    return 'n/a';
  }

  const red = colorRef & 0xff;
  const green = (colorRef >>> 8) & 0xff;
  const blue = (colorRef >>> 16) & 0xff;
  const hex = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`.toUpperCase();

  return `${hex}  \x1b[48;2;${red};${green};${blue}m    \x1b[0m`;
}

function formatFlags(flags: number): string {
  const labels: string[] = [];

  if (flags & ThemeAppProperty.STAP_ALLOW_CONTROLS) {
    labels.push('controls');
  }

  if (flags & ThemeAppProperty.STAP_ALLOW_NONCLIENT) {
    labels.push('nonclient');
  }

  if (flags & ThemeAppProperty.STAP_ALLOW_WEBCONTENT) {
    labels.push('webcontent');
  }

  return labels.length > 0 ? labels.join(', ') : 'none';
}

function getDocumentationValue(themeFileName: string, propertyName: string): string | null {
  const themeFileNameWide = encodeWideString(themeFileName);
  const propertyNameWide = encodeWideString(propertyName);
  const valueBuffer = Buffer.alloc(DOCUMENTATION_VALUE_CHARACTER_COUNT * 2);
  const status = Uxtheme.GetThemeDocumentationProperty(themeFileNameWide.ptr, propertyNameWide.ptr, valueBuffer.ptr, DOCUMENTATION_VALUE_CHARACTER_COUNT);

  if (status !== 0) {
    return null;
  }

  const value = decodeWideBuffer(valueBuffer);
  return value.length > 0 ? value : null;
}

function getThemeBoolean(hTheme: bigint, iPartId: number, iStateId: number, iPropId: number): boolean | null {
  const valueBuffer = Buffer.alloc(4);
  const status = Uxtheme.GetThemeBool(hTheme, iPartId, iStateId, iPropId, valueBuffer.ptr);

  if (status !== 0) {
    return null;
  }

  return valueBuffer.readInt32LE(0) !== 0;
}

function getThemeColor(hTheme: bigint, iPartId: number, iStateId: number, iPropId: number): number | null {
  const colorBuffer = Buffer.alloc(4);
  const status = Uxtheme.GetThemeColor(hTheme, iPartId, iStateId, iPropId, colorBuffer.ptr);

  if (status !== 0) {
    return null;
  }

  return colorBuffer.readUInt32LE(0);
}

function getThemeColorWithFallback(hTheme: bigint, iPartId: number, iStateId: number, propertyIds: number[]): number | null {
  for (const propertyId of propertyIds) {
    const color = getThemeColor(hTheme, iPartId, iStateId, propertyId);

    if (color !== null) {
      return color;
    }
  }

  return null;
}

function getThemeInteger(hTheme: bigint, iPartId: number, iStateId: number, iPropId: number): number | null {
  const valueBuffer = Buffer.alloc(4);
  const status = Uxtheme.GetThemeInt(hTheme, iPartId, iStateId, iPropId, valueBuffer.ptr);

  if (status !== 0) {
    return null;
  }

  return valueBuffer.readInt32LE(0);
}

function getThemeMargins(hTheme: bigint, iPartId: number, iStateId: number, iPropId: number): string | null {
  const marginsBuffer = Buffer.alloc(MARGINS_STRUCT_SIZE);
  const status = Uxtheme.GetThemeMargins(hTheme, 0n, iPartId, iStateId, iPropId, null, marginsBuffer.ptr);

  if (status !== 0) {
    return null;
  }

  const left = marginsBuffer.readInt32LE(0);
  const right = marginsBuffer.readInt32LE(4);
  const top = marginsBuffer.readInt32LE(8);
  const bottom = marginsBuffer.readInt32LE(12);

  return `${left}/${right}/${top}/${bottom}`;
}

function getThemePartSize(hTheme: bigint, iPartId: number, iStateId: number): string | null {
  const sizeBuffer = Buffer.alloc(SIZE_STRUCT_SIZE);
  const status = Uxtheme.GetThemePartSize(hTheme, 0n, iPartId, iStateId, null, ThemeSize.TS_TRUE, sizeBuffer.ptr);

  if (status !== 0) {
    return null;
  }

  const width = sizeBuffer.readInt32LE(0);
  const height = sizeBuffer.readInt32LE(4);

  return `${width}x${height}`;
}

function getTransitionDuration(hTheme: bigint, stateFrom: number, stateTo: number): string | null {
  const durationBuffer = Buffer.alloc(4);
  const status = Uxtheme.GetThemeTransitionDuration(hTheme, BUTTON_PART_PUSHBUTTON, stateFrom, stateTo, TMT_TRANSITIONDURATIONS, durationBuffer.ptr);

  if (status !== 0) {
    return null;
  }

  return `${durationBuffer.readUInt32LE(0)} ms`;
}

function main(): void {
  const themeFileBuffer = Buffer.alloc(THEME_FILE_CHARACTER_COUNT * 2);
  const themeColorBuffer = Buffer.alloc(MAX_THEMECOLOR * 2);
  const themeSizeBuffer = Buffer.alloc(MAX_THEMESIZE * 2);
  const themeNameStatus = Uxtheme.GetCurrentThemeName(themeFileBuffer.ptr, THEME_FILE_CHARACTER_COUNT, themeColorBuffer.ptr, MAX_THEMECOLOR, themeSizeBuffer.ptr, MAX_THEMESIZE);

  if (themeNameStatus !== 0) {
    throw new Error(`GetCurrentThemeName failed with HRESULT 0x${(themeNameStatus >>> 0).toString(16)}`);
  }

  const themeFileName = decodeWideBuffer(themeFileBuffer);
  const themeColorName = decodeWideBuffer(themeColorBuffer);
  const themeSizeName = decodeWideBuffer(themeSizeBuffer);
  const themeAppProperties = Uxtheme.GetThemeAppProperties();
  const isThemeActive = Uxtheme.IsThemeActive() !== 0;
  const isAppThemed = Uxtheme.IsAppThemed() !== 0;
  const isCompositionActive = Uxtheme.IsCompositionActive() !== 0;
  const themeHandle = Uxtheme.OpenThemeData(0n, encodeWideString(BUTTON_CLASS_NAME).ptr);

  if (themeHandle === 0n) {
    throw new Error('OpenThemeData returned NULL for BUTTON.');
  }

  try {
    console.log('');
    console.log('\x1b[96mVisual Style Audit\x1b[0m');
    console.log('------------------');
    console.log(`Theme file          : ${themeFileName}`);
    console.log(`Color scheme        : ${themeColorName}`);
    console.log(`Size scheme         : ${themeSizeName}`);
    console.log(`Display name        : ${getDocumentationValue(themeFileName, SZ_THDOCPROP_DISPLAYNAME) ?? 'n/a'}`);
    console.log(`Canonical name      : ${getDocumentationValue(themeFileName, SZ_THDOCPROP_CANONICALNAME) ?? 'n/a'}`);
    console.log(`Tooltip             : ${getDocumentationValue(themeFileName, SZ_THDOCPROP_TOOLTIP) ?? 'n/a'}`);
    console.log(`Author              : ${getDocumentationValue(themeFileName, SZ_THDOCPROP_AUTHOR) ?? 'n/a'}`);
    console.log(`Theme active        : ${formatBoolean(isThemeActive)}`);
    console.log(`Application themed  : ${formatBoolean(isAppThemed)}`);
    console.log(`Composition active  : ${formatBoolean(isCompositionActive)}`);
    console.log(`App property flags  : 0x${themeAppProperties.toString(16).padStart(8, '0')} (${formatFlags(themeAppProperties)})`);
    console.log('');
    console.log('BUTTON push-button states');
    console.log('State       Fill color                 Text color                 Border color               Size      Margins   Border  Transparent  Transition');
    console.log('----------- -------------------------- -------------------------- -------------------------- --------- --------- ------- ------------ ----------');

    for (let stateIndex = 0; stateIndex < PUSH_BUTTON_STATES.length; stateIndex++) {
      const currentState = PUSH_BUTTON_STATES[stateIndex];
      const nextState = PUSH_BUTTON_STATES[(stateIndex + 1) % PUSH_BUTTON_STATES.length];
      const fillColor = formatColor(getThemeColorWithFallback(themeHandle, BUTTON_PART_PUSHBUTTON, currentState.id, [TMT_FILLCOLOR, TMT_FILLCOLORHINT]));
      const textColor = formatColor(getThemeColor(themeHandle, BUTTON_PART_PUSHBUTTON, currentState.id, TMT_TEXTCOLOR));
      const borderColor = formatColor(getThemeColorWithFallback(themeHandle, BUTTON_PART_PUSHBUTTON, currentState.id, [TMT_BORDERCOLOR, TMT_BORDERCOLORHINT]));
      const partSize = getThemePartSize(themeHandle, BUTTON_PART_PUSHBUTTON, currentState.id) ?? 'n/a';
      const margins = getThemeMargins(themeHandle, BUTTON_PART_PUSHBUTTON, currentState.id, TMT_CONTENTMARGINS) ?? 'n/a';
      const borderSize = getThemeInteger(themeHandle, BUTTON_PART_PUSHBUTTON, currentState.id, TMT_BORDERSIZE);
      const transparent = getThemeBoolean(themeHandle, BUTTON_PART_PUSHBUTTON, currentState.id, TMT_TRANSPARENT);
      const transition = getTransitionDuration(themeHandle, currentState.id, nextState.id) ?? 'n/a';
      const line = [
        currentState.label.padEnd(11),
        fillColor.padEnd(26),
        textColor.padEnd(26),
        borderColor.padEnd(26),
        partSize.padEnd(9),
        margins.padEnd(9),
        String(borderSize ?? 'n/a').padEnd(7),
        formatOptionalBoolean(transparent).padEnd(12),
        transition,
      ].join(' ');

      console.log(line);
    }

    console.log('');
  } finally {
    void Uxtheme.CloseThemeData(themeHandle);
  }
}

main();
