/**
 * Matrix Rain
 *
 * Recreates the iconic Matrix "digital rain" effect in the Windows console.
 * Falling columns of random characters cascade down the screen in glowing green,
 * with varying brightness to simulate depth.
 *
 * Uses Kernel32 console APIs to configure the terminal environment (dimensions,
 * cursor visibility, VT processing, window title), then ANSI escape sequences
 * via process.stdout.write for reliable cross-terminal rendering.
 *
 * APIs demonstrated:
 *   - GetStdHandle               (obtain console output handle)
 *   - GetConsoleMode             (query current console mode flags)
 *   - SetConsoleMode             (enable virtual terminal processing)
 *   - GetConsoleScreenBufferInfo (query terminal dimensions)
 *   - SetConsoleCursorInfo       (hide/show the blinking cursor)
 *   - SetConsoleTitleW           (set window title bar text)
 *
 * Run: bun run example/matrix-rain.ts
 */

import Kernel32, { STD_HANDLE } from '../index';

Kernel32.Preload([
  'GetStdHandle',
  'GetConsoleMode',
  'SetConsoleMode',
  'GetConsoleScreenBufferInfo',
  'SetConsoleCursorInfo',
  'SetConsoleTitleW',
]);

const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

// Obtain the console output handle
const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);

// Enable ANSI/VT escape sequence processing so the console interprets color codes
const modeBuf = Buffer.alloc(4);
const gotMode = Kernel32.GetConsoleMode(hStdout, modeBuf.ptr);
const originalMode = gotMode ? modeBuf.readUInt32LE(0) : 0;
if (gotMode) {
  Kernel32.SetConsoleMode(hStdout, originalMode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

// Query console dimensions via Kernel32, fall back to process.stdout if it fails
// CONSOLE_SCREEN_BUFFER_INFO layout (22 bytes):
//   +0x00: dwSize (COORD: X=0, Y=2)
//   +0x04: dwCursorPosition (COORD)
//   +0x08: wAttributes (WORD)
//   +0x0A: srWindow (SMALL_RECT: Left=10, Top=12, Right=14, Bottom=16)
//   +0x12: dwMaximumWindowSize (COORD)
const csbiBuffer = Buffer.alloc(22);
const gotCsbi = Kernel32.GetConsoleScreenBufferInfo(hStdout, csbiBuffer.ptr);

let consoleWidth: number;
let consoleHeight: number;

if (gotCsbi) {
  const csbiView = new DataView(csbiBuffer.buffer);
  consoleWidth = csbiView.getInt16(14, true) - csbiView.getInt16(10, true) + 1;
  consoleHeight = csbiView.getInt16(16, true) - csbiView.getInt16(12, true) + 1;
} else {
  consoleWidth = process.stdout.columns || 80;
  consoleHeight = process.stdout.rows || 24;
}

// Guard against degenerate dimensions (e.g. piped output)
if (consoleWidth < 10) consoleWidth = 80;
if (consoleHeight < 5) consoleHeight = 24;

// Hide the blinking cursor so it doesn't flicker during animation
// CONSOLE_CURSOR_INFO layout (8 bytes):
//   +0x00: dwSize (DWORD) — cursor thickness percentage (1-100)
//   +0x04: bVisible (BOOL)
const cursorInfoBuf = Buffer.alloc(8);
const cursorInfoView = new DataView(cursorInfoBuf.buffer);
cursorInfoView.setUint32(0, 1, true);   // dwSize = 1 (thinnest)
cursorInfoView.setUint32(4, 0, true);   // bVisible = FALSE
Kernel32.SetConsoleCursorInfo(hStdout, cursorInfoBuf.ptr);

// Set the console window title
const titleBuf = Buffer.from('The Matrix - bun-win32\0', 'utf16le');
Kernel32.SetConsoleTitleW(titleBuf.ptr);

// ANSI escape helpers for cursor and color control
const write = (s: string) => process.stdout.write(s);
const ESC = '\x1b[';
const moveTo = (x: number, y: number) => write(`${ESC}${y + 1};${x + 1}H`);
const clearScreen = () => write(`${ESC}2J${ESC}H`);

const GREEN_BRIGHT = `${ESC}92m`;
const GREEN_DIM = `${ESC}32m`;
const WHITE_BOLD = `${ESC}97;1m`;
const RESET = `${ESC}0m`;

// Half-width katakana + digits + symbols for authentic Matrix look
const CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789$@#&!';

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]!;
}

// Each column tracks where its leading "head" character is and how fast it falls
interface RainColumn {
  y: number;        // current head position (can be negative = pre-delay)
  speed: number;    // cells to advance per frame (1 or 2)
  length: number;   // total trail length behind the head
  active: boolean;  // whether this column is currently raining
  delay: number;    // frames to wait before reactivating
}

const columns: RainColumn[] = [];
for (let x = 0; x < consoleWidth; x++) {
  columns.push({
    y: Math.floor(Math.random() * -consoleHeight),
    speed: 1 + Math.floor(Math.random() * 2),
    length: 5 + Math.floor(Math.random() * (consoleHeight - 5)),
    active: Math.random() > 0.3,
    delay: Math.floor(Math.random() * 20),
  });
}

clearScreen();

const DURATION_MS = 15_000;
const FRAME_DELAY_MS = 50;
const startTime = Date.now();

while (Date.now() - startTime < DURATION_MS) {
  for (let x = 0; x < consoleWidth; x++) {
    const col = columns[x]!;

    // Count down the reactivation delay
    if (col.delay > 0) {
      col.delay--;
      continue;
    }

    // Randomly reactivate dormant columns
    if (!col.active) {
      if (Math.random() > 0.97) {
        col.active = true;
        col.y = 0;
        col.length = 5 + Math.floor(Math.random() * (consoleHeight - 5));
        col.speed = 1 + Math.floor(Math.random() * 2);
      }
      continue;
    }

    for (let step = 0; step < col.speed; step++) {
      const headY = col.y;

      // The leading head character: bright white flash
      if (headY >= 0 && headY < consoleHeight) {
        moveTo(x, headY);
        write(`${WHITE_BOLD}${randomChar()}`);
      }

      // Just behind the head: bright green
      if (headY - 1 >= 0 && headY - 1 < consoleHeight) {
        moveTo(x, headY - 1);
        write(`${GREEN_BRIGHT}${randomChar()}`);
      }

      // Trail body: randomly mutate characters, dim green for depth
      for (let t = 2; t < col.length; t++) {
        const trailY = headY - t;
        if (trailY >= 0 && trailY < consoleHeight && Math.random() > 0.85) {
          moveTo(x, trailY);
          write(`${GREEN_DIM}${randomChar()}`);
        }
      }

      // Erase the character at the very end of the tail
      const tailY = headY - col.length;
      if (tailY >= 0 && tailY < consoleHeight) {
        moveTo(x, tailY);
        write(`${RESET} `);
      }

      col.y++;
    }

    // Once the entire trail has scrolled off-screen, deactivate and wait
    if (col.y - col.length > consoleHeight) {
      col.active = false;
      col.delay = Math.floor(Math.random() * 15);
    }
  }

  await Bun.sleep(FRAME_DELAY_MS);
}

// Restore cursor visibility
cursorInfoView.setUint32(0, 25, true);  // dwSize = 25 (default)
cursorInfoView.setUint32(4, 1, true);   // bVisible = TRUE
Kernel32.SetConsoleCursorInfo(hStdout, cursorInfoBuf.ptr);

// Restore original console mode
if (gotMode) {
  Kernel32.SetConsoleMode(hStdout, originalMode);
}

// Clean exit
write(RESET);
clearScreen();
console.log('Matrix rain ended. Wake up, Neo...');
