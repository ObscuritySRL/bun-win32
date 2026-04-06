/**
 * Console Rainbow
 *
 * Demonstrates using Kernel32 console APIs to create colorful text output
 * and manipulate the console buffer directly.
 */
import { ptr } from 'bun:ffi';
import Kernel32, { STD_HANDLE } from '@bun-win32/kernel32';

// Preload required APIs
Kernel32.Preload([
  'GetStdHandle',
  'SetConsoleTextAttribute',
  'GetConsoleScreenBufferInfo',
  'SetConsoleCursorPosition',
  'SetConsoleTitleW',
  'GetConsoleTitleW',
  'WriteConsoleW',
  'FillConsoleOutputCharacterW',
  'FillConsoleOutputAttribute',
  'GetConsoleMode',
  'SetConsoleMode',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Console color attributes
// ─────────────────────────────────────────────────────────────────────────────

const FG = {
  BLACK: 0x0000,
  BLUE: 0x0001,
  GREEN: 0x0002,
  CYAN: 0x0003,
  RED: 0x0004,
  MAGENTA: 0x0005,
  YELLOW: 0x0006,
  WHITE: 0x0007,
  INTENSE: 0x0008, // Add to make color bright
};

const BG = {
  BLACK: 0x0000,
  BLUE: 0x0010,
  GREEN: 0x0020,
  CYAN: 0x0030,
  RED: 0x0040,
  MAGENTA: 0x0050,
  YELLOW: 0x0060,
  WHITE: 0x0070,
  INTENSE: 0x0080,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);

function setColor(attr: number): void {
  Kernel32.SetConsoleTextAttribute(hStdout, attr);
}

function resetColor(): void {
  setColor(FG.WHITE);
}

function setCursorPosition(x: number, y: number): void {
  // COORD is packed as two WORDs: X in low word, Y in high word
  const coord = (y << 16) | (x & 0xffff);
  Kernel32.SetConsoleCursorPosition(hStdout, coord);
}

function toWideString(str: string): Uint8Array {
  const buffer = new Uint8Array((str.length + 1) * 2);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    buffer[i * 2] = code & 0xff;
    buffer[i * 2 + 1] = (code >> 8) & 0xff;
  }
  return buffer;
}

function setTitle(title: string): void {
  const titleBuffer = toWideString(title);
  Kernel32.SetConsoleTitleW(ptr(titleBuffer));
}

// Reserved buffer for optional parameter
const reservedBuffer = new ArrayBuffer(8);

function writeConsole(text: string): void {
  const textBuffer = toWideString(text);
  const writtenBuffer = new ArrayBuffer(4);
  Kernel32.WriteConsoleW(hStdout, ptr(textBuffer), text.length, ptr(writtenBuffer), ptr(reservedBuffer));
}

// ─────────────────────────────────────────────────────────────────────────────
// Rainbow text demo
// ─────────────────────────────────────────────────────────────────────────────

function rainbowText(text: string): void {
  const colors = [FG.RED | FG.INTENSE, FG.YELLOW | FG.INTENSE, FG.GREEN | FG.INTENSE, FG.CYAN | FG.INTENSE, FG.BLUE | FG.INTENSE, FG.MAGENTA | FG.INTENSE];

  for (let i = 0; i < text.length; i++) {
    setColor(colors[i % colors.length]!);
    writeConsole(text[i]!);
  }
  resetColor();
}

function printColoredBox(text: string, fg: number, bg: number): void {
  const padding = 2;
  const width = text.length + padding * 2 + 2;
  const borderChar = '═';
  const sideChar = '║';

  setColor(fg | bg);

  // Top border
  writeConsole('╔' + borderChar.repeat(width - 2) + '╗\n');

  // Middle with text
  writeConsole(sideChar + ' '.repeat(padding) + text + ' '.repeat(padding) + sideChar + '\n');

  // Bottom border
  writeConsole('╚' + borderChar.repeat(width - 2) + '╝\n');

  resetColor();
}

// ─────────────────────────────────────────────────────────────────────────────
// Color palette display
// ─────────────────────────────────────────────────────────────────────────────

function showColorPalette(): void {
  console.log('\nForeground colors:');
  const fgColors = ['BLACK', 'BLUE', 'GREEN', 'CYAN', 'RED', 'MAGENTA', 'YELLOW', 'WHITE'];

  for (let intense = 0; intense <= 1; intense++) {
    for (let i = 0; i < 8; i++) {
      const attr = i | (intense ? FG.INTENSE : 0);
      setColor(attr | BG.BLACK);
      writeConsole(` ${fgColors[i]!.padEnd(8)} `);
    }
    resetColor();
    console.log(intense ? ' (bright)' : ' (normal)');
  }

  console.log('\nBackground colors:');
  for (let i = 0; i < 8; i++) {
    const bg = i << 4;
    setColor(FG.WHITE | bg);
    writeConsole(` ${fgColors[i]!.padEnd(8)} `);
  }
  resetColor();
  console.log('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated spinner demo
// ─────────────────────────────────────────────────────────────────────────────

async function animatedSpinner(duration: number): Promise<void> {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const colors = [FG.RED | FG.INTENSE, FG.YELLOW | FG.INTENSE, FG.GREEN | FG.INTENSE, FG.CYAN | FG.INTENSE, FG.BLUE | FG.INTENSE, FG.MAGENTA | FG.INTENSE];

  const start = Date.now();
  let frame = 0;

  while (Date.now() - start < duration) {
    setColor(colors[frame % colors.length]!);
    writeConsole(`\r${frames[frame % frames.length]!} Loading... `);
    frame++;
    await Bun.sleep(80);
  }

  setColor(FG.GREEN | FG.INTENSE);
  writeConsole('\r✓ Complete!   \n');
  resetColor();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main demo
// ─────────────────────────────────────────────────────────────────────────────

// Set a fun title
setTitle('🌈 Console Rainbow - bun-kernel32 Demo');

console.log('');
rainbowText('═══════════════════════════════════════════════════════════════════════════');
console.log('');

setColor(FG.CYAN | FG.INTENSE);
console.log('                    CONSOLE RAINBOW DEMO');
console.log('                  powered by bun-kernel32');
resetColor();

console.log('');
rainbowText('═══════════════════════════════════════════════════════════════════════════');
console.log('\n');

// Colored boxes
printColoredBox('  SUCCESS  ', FG.WHITE | FG.INTENSE, BG.GREEN);
console.log('');
printColoredBox('  WARNING  ', FG.BLACK, BG.YELLOW);
console.log('');
printColoredBox('   ERROR   ', FG.WHITE | FG.INTENSE, BG.RED);
console.log('');

// Show color palette
showColorPalette();

// Animated spinner
console.log('');
await animatedSpinner(2000);

// Final message
console.log('');
rainbowText('Thanks for watching! The console is your canvas. 🎨\n');
resetColor();
