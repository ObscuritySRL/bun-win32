/**
 * Button Cinema
 *
 * Animates a themed push button entirely in the terminal by sampling the active
 * Windows visual style and cross-fading between button states using the theme's
 * own transition durations. The demo hides the cursor, redraws the scene with
 * ANSI truecolor frames, and restores the terminal when the sequence completes.
 *
 * The button colors come directly from the current `BUTTON` theme class. Each
 * transition uses GetThemeTransitionDuration so the timing matches what native
 * themed controls expect on the desktop.
 *
 * APIs demonstrated:
 *   - GetCurrentThemeName           (identify the active theme)
 *   - OpenThemeData                 (open the BUTTON theme class)
 *   - CloseThemeData                (release the theme handle)
 *   - GetThemeColor                 (fill, border, and text colors)
 *   - GetThemePartSize              (recommended draw size)
 *   - GetThemeTransitionDuration    (native animation timing)
 *   - IsThemeActive                 (guard the demo when visual styles are off)
 *
 * Run: bun run example/button-cinema.ts
 */

import Uxtheme, { MAX_THEMECOLOR, MAX_THEMESIZE, ThemeSize } from '../index';

const BUTTON_CLASS_NAME = 'BUTTON';
const BUTTON_PART_PUSHBUTTON = 1;
const FRAME_INTERVAL_MS = 33;
const PUSH_BUTTON_STATES = [
  { id: 1, label: 'normal' },
  { id: 2, label: 'hot' },
  { id: 3, label: 'pressed' },
  { id: 5, label: 'defaulted' },
  { id: 4, label: 'disabled' },
] as const;
const SIZE_STRUCT_SIZE = 8;
const THEME_FILE_CHARACTER_COUNT = 520;
const TMT_BORDERCOLOR = 3801;
const TMT_BORDERCOLORHINT = 3822;
const TMT_FILLCOLOR = 3802;
const TMT_FILLCOLORHINT = 3821;
const TMT_TEXTCOLOR = 3803;
const TMT_TRANSITIONDURATIONS = 6000;

type ButtonPalette = {
  border: RgbColor;
  fill: RgbColor;
  text: RgbColor;
};

type RgbColor = {
  blue: number;
  green: number;
  red: number;
};

Uxtheme.Preload(['CloseThemeData', 'GetCurrentThemeName', 'GetThemeColor', 'GetThemePartSize', 'GetThemeTransitionDuration', 'IsThemeActive', 'OpenThemeData']);

function ansiBackground(color: RgbColor): string {
  return `\x1b[48;2;${color.red};${color.green};${color.blue}m`;
}

function ansiForeground(color: RgbColor): string {
  return `\x1b[38;2;${color.red};${color.green};${color.blue}m`;
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function decodeWideBuffer(buffer: Buffer): string {
  return buffer.toString('utf16le').replace(/\0.*$/, '');
}

function encodeWideString(text: string): Buffer {
  return Buffer.from(`${text}\0`, 'utf16le');
}

function interpolateColor(from: RgbColor, to: RgbColor, progress: number): RgbColor {
  return {
    blue: clampByte(from.blue + (to.blue - from.blue) * progress),
    green: clampByte(from.green + (to.green - from.green) * progress),
    red: clampByte(from.red + (to.red - from.red) * progress),
  };
}

function mixPalettes(from: ButtonPalette, to: ButtonPalette, progress: number): ButtonPalette {
  return {
    border: interpolateColor(from.border, to.border, progress),
    fill: interpolateColor(from.fill, to.fill, progress),
    text: interpolateColor(from.text, to.text, progress),
  };
}

function parseColorRef(colorRef: number): RgbColor {
  return {
    blue: (colorRef >>> 16) & 0xff,
    green: (colorRef >>> 8) & 0xff,
    red: colorRef & 0xff,
  };
}

function readThemeColor(hTheme: bigint, stateId: number, propertyIds: number[], fallback: RgbColor): RgbColor {
  const colorBuffer = Buffer.alloc(4);

  for (const propertyId of propertyIds) {
    const status = Uxtheme.GetThemeColor(hTheme, BUTTON_PART_PUSHBUTTON, stateId, propertyId, colorBuffer.ptr);

    if (status === 0) {
      return parseColorRef(colorBuffer.readUInt32LE(0));
    }
  }

  return fallback;
}

function readThemeName(): string {
  const themeFileBuffer = Buffer.alloc(THEME_FILE_CHARACTER_COUNT * 2);
  const themeColorBuffer = Buffer.alloc(MAX_THEMECOLOR * 2);
  const themeSizeBuffer = Buffer.alloc(MAX_THEMESIZE * 2);
  const status = Uxtheme.GetCurrentThemeName(themeFileBuffer.ptr, THEME_FILE_CHARACTER_COUNT, themeColorBuffer.ptr, MAX_THEMECOLOR, themeSizeBuffer.ptr, MAX_THEMESIZE);

  if (status !== 0) {
    return 'Unknown Theme';
  }

  const fileName = decodeWideBuffer(themeFileBuffer).split('\\').pop() ?? 'unknown.msstyles';
  const colorName = decodeWideBuffer(themeColorBuffer);
  const sizeName = decodeWideBuffer(themeSizeBuffer);

  return `${fileName} / ${colorName} / ${sizeName}`;
}

function readThemePalette(hTheme: bigint, stateId: number): ButtonPalette {
  return {
    border: readThemeColor(hTheme, stateId, [TMT_BORDERCOLOR, TMT_BORDERCOLORHINT], { blue: 120, green: 120, red: 120 }),
    fill: readThemeColor(hTheme, stateId, [TMT_FILLCOLOR, TMT_FILLCOLORHINT], { blue: 224, green: 224, red: 224 }),
    text: readThemeColor(hTheme, stateId, [TMT_TEXTCOLOR], { blue: 16, green: 16, red: 16 }),
  };
}

function readThemePartSize(hTheme: bigint, stateId: number): { height: number; width: number } {
  const sizeBuffer = Buffer.alloc(SIZE_STRUCT_SIZE);
  const status = Uxtheme.GetThemePartSize(hTheme, 0n, BUTTON_PART_PUSHBUTTON, stateId, null, ThemeSize.TS_TRUE, sizeBuffer.ptr);

  if (status !== 0) {
    return { height: 3, width: 16 };
  }

  return {
    height: Math.max(3, sizeBuffer.readInt32LE(4)),
    width: Math.max(12, sizeBuffer.readInt32LE(0)),
  };
}

function readTransitionDuration(hTheme: bigint, stateFrom: number, stateTo: number): number {
  const durationBuffer = Buffer.alloc(4);
  const status = Uxtheme.GetThemeTransitionDuration(hTheme, BUTTON_PART_PUSHBUTTON, stateFrom, stateTo, TMT_TRANSITIONDURATIONS, durationBuffer.ptr);

  if (status !== 0) {
    return 280;
  }

  return Math.max(140, durationBuffer.readUInt32LE(0));
}

function renderButton(label: string, palette: ButtonPalette, buttonWidth: number): string[] {
  const reset = '\x1b[0m';
  const innerWidth = Math.max(8, buttonWidth - 2);
  const centeredLabel = label.padStart(Math.floor((innerWidth + label.length) / 2), ' ').padEnd(innerWidth, ' ');
  const borderBackground = ansiBackground(palette.border);
  const fillBackground = ansiBackground(palette.fill);
  const textForeground = ansiForeground(palette.text);

  return [`${borderBackground}${' '.repeat(buttonWidth)}${reset}`, `${borderBackground} ${fillBackground}${textForeground}${centeredLabel}${borderBackground} ${reset}`, `${borderBackground}${' '.repeat(buttonWidth)}${reset}`];
}

function renderSwatch(label: string, color: RgbColor): string {
  const hex = `#${color.red.toString(16).padStart(2, '0')}${color.green.toString(16).padStart(2, '0')}${color.blue.toString(16).padStart(2, '0')}`.toUpperCase();
  return `${label.padEnd(7)} ${ansiBackground(color)}      \x1b[0m ${hex}`;
}

function renderFrame(themeName: string, currentStateLabel: string, nextStateLabel: string, palette: ButtonPalette, buttonWidth: number, durationMs: number, progress: number): string {
  const barWidth = 28;
  const filled = Math.max(0, Math.min(barWidth, Math.round(barWidth * progress)));
  const empty = barWidth - filled;
  const buttonLines = renderButton('Bun + UxTheme', palette, buttonWidth);

  return [
    '\x1b[2J\x1b[H\x1b[?25l',
    '\x1b[95mButton Cinema\x1b[0m',
    `Theme      ${themeName}`,
    `Transition ${currentStateLabel} -> ${nextStateLabel} (${durationMs} ms)`,
    `Progress   [${'='.repeat(filled)}${' '.repeat(empty)}] ${Math.round(progress * 100)
      .toString()
      .padStart(3, ' ')}%`,
    '',
    ...buttonLines,
    '',
    renderSwatch('Border', palette.border),
    renderSwatch('Fill', palette.fill),
    renderSwatch('Text', palette.text),
    '',
    'The frame timing and palette both come from the active Windows visual style.',
  ].join('\n');
}

async function main(): Promise<void> {
  if (Uxtheme.IsThemeActive() === 0) {
    throw new Error('Visual styles are not active on this system.');
  }

  const themeHandle = Uxtheme.OpenThemeData(0n, encodeWideString(BUTTON_CLASS_NAME).ptr);

  if (themeHandle === 0n) {
    throw new Error('OpenThemeData returned NULL for BUTTON.');
  }

  try {
    const themeName = readThemeName();
    const size = readThemePartSize(themeHandle, PUSH_BUTTON_STATES[0].id);
    const buttonWidth = Math.max(16, Math.min(32, size.width));

    for (let cycleIndex = 0; cycleIndex < 2; cycleIndex++) {
      for (let stateIndex = 0; stateIndex < PUSH_BUTTON_STATES.length; stateIndex++) {
        const currentState = PUSH_BUTTON_STATES[stateIndex];
        const nextState = PUSH_BUTTON_STATES[(stateIndex + 1) % PUSH_BUTTON_STATES.length];
        const currentPalette = readThemePalette(themeHandle, currentState.id);
        const nextPalette = readThemePalette(themeHandle, nextState.id);
        const durationMs = readTransitionDuration(themeHandle, currentState.id, nextState.id);
        const frameCount = Math.max(1, Math.ceil(durationMs / FRAME_INTERVAL_MS));

        for (let frameIndex = 0; frameIndex <= frameCount; frameIndex++) {
          const progress = frameIndex / frameCount;
          const palette = mixPalettes(currentPalette, nextPalette, progress);
          process.stdout.write(renderFrame(themeName, currentState.label, nextState.label, palette, buttonWidth, durationMs, progress));
          await Bun.sleep(FRAME_INTERVAL_MS);
        }
      }
    }
  } finally {
    process.stdout.write('\x1b[0m\x1b[?25h\n');
    void Uxtheme.CloseThemeData(themeHandle);
  }
}

await main().catch((error: unknown) => {
  process.stdout.write('\x1b[0m\x1b[?25h\n');
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
