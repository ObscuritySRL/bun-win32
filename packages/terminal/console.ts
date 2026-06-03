import Kernel32, { ConsoleMode, STD_HANDLE, decodeConsoleScreenBufferInfo } from '@bun-win32/kernel32';

import { readEnvNumber } from './env';
import { standardOutput } from './stdout';

const { max, min } = Math;

const ALTERNATE_SCREEN_OFF = '\x1b[?1049l';
const ALTERNATE_SCREEN_ON = '\x1b[?1049h';
const AUTOWRAP_OFF = '\x1b[?7l';
const AUTOWRAP_ON = '\x1b[?7h';
const CLEAR_SCREEN = '\x1b[2J';
const CONSOLE_OUTPUT_CODE_PAGE_UTF8 = 65001;
const CURSOR_HOME = '\x1b[H';
const HIDE_CURSOR = '\x1b[?25l';
// xterm mouse: 1003 = report all motion, 1006 = SGR extended coordinates.
const MOUSE_OFF = '\x1b[?1003l\x1b[?1006l';
const MOUSE_ON = '\x1b[?1003h\x1b[?1006h';
const RESET = '\x1b[0m';
const SHOW_CURSOR = '\x1b[?25h';

Kernel32.Preload(['GetConsoleMode', 'GetConsoleOutputCP', 'GetConsoleScreenBufferInfo', 'GetStdHandle', 'SetConsoleMode', 'SetConsoleOutputCP', 'SetConsoleTitleW']);
const { GetConsoleMode, GetConsoleOutputCP, GetConsoleScreenBufferInfo, GetStdHandle, SetConsoleMode, SetConsoleOutputCP, SetConsoleTitleW } = Kernel32;

export interface ConsoleSessionOptions {
  /** Enable xterm mouse reporting (all-motion + SGR coordinates). */
  mouse?: boolean;
  /** Set the console window title. */
  title?: string;
}

/**
 * Owns the terminal for an interactive session: enables VT processing + a UTF-8
 * code page, switches to the alternate screen, hides the cursor, disables
 * autowrap, and restores everything on `restore()`. One session owns the console
 * at a time.
 *
 * @example
 * const session = new ConsoleSession({ mouse: true, title: 'Demo' });
 * try { surface.present(); } finally { session.restore(); }
 */
export class ConsoleSession {
  #handle: bigint;
  #mouse: boolean;
  #restored = false;
  #savedCodePage: number;
  #savedMode: number;

  constructor(options?: ConsoleSessionOptions) {
    this.#handle = GetStdHandle(STD_HANDLE.OUTPUT);
    const modeBuffer = Buffer.alloc(4);
    this.#savedMode = GetConsoleMode(this.#handle, modeBuffer.ptr) ? modeBuffer.readUInt32LE(0) : 0;
    SetConsoleMode(this.#handle, this.#savedMode | ConsoleMode.ENABLE_PROCESSED_OUTPUT | ConsoleMode.ENABLE_VIRTUAL_TERMINAL_PROCESSING);
    this.#savedCodePage = GetConsoleOutputCP();
    SetConsoleOutputCP(CONSOLE_OUTPUT_CODE_PAGE_UTF8);
    this.#mouse = options?.mouse ?? false;
    if (options?.title !== undefined) SetConsoleTitleW(Buffer.from(`${options.title}\0`, 'utf16le').ptr);
    this.#write(ALTERNATE_SCREEN_ON + HIDE_CURSOR + AUTOWRAP_OFF + (this.#mouse ? MOUSE_ON : '') + CLEAR_SCREEN + CURSOR_HOME);
  }

  #write(text: string): void {
    standardOutput.write(text);
    standardOutput.flush();
  }

  /** Restore the console to its pre-session state. Idempotent. */
  restore(): void {
    if (this.#restored) return;
    this.#restored = true;
    this.#write((this.#mouse ? MOUSE_OFF : '') + RESET + AUTOWRAP_ON + SHOW_CURSOR + ALTERNATE_SCREEN_OFF);
    SetConsoleMode(this.#handle, this.#savedMode);
    SetConsoleOutputCP(this.#savedCodePage);
  }
}

/**
 * Detect the usable console size in cells. Honours `TERM_COLS` / `TERM_ROWS`, else
 * queries the screen buffer; the bottom row is left free so a trailing newline
 * never scrolls the image. Falls back to 120×40 when no console is attached.
 */
export const detectConsoleSize = (): { columns: number; rows: number } => {
  let columns = readEnvNumber('TERM_COLS', NaN);
  let rows = readEnvNumber('TERM_ROWS', NaN);
  if (!Number.isFinite(columns) || !Number.isFinite(rows)) {
    const buffer = Buffer.alloc(22);
    if (GetConsoleScreenBufferInfo(GetStdHandle(STD_HANDLE.OUTPUT), buffer.ptr)) {
      const info = decodeConsoleScreenBufferInfo(buffer);
      if (!Number.isFinite(columns)) columns = info.columns;
      if (!Number.isFinite(rows)) rows = info.rows;
    }
  }
  if (!Number.isFinite(columns)) columns = 120;
  if (!Number.isFinite(rows)) rows = 40;
  columns = max(20, min(columns | 0, 400));
  rows = max(8, min((rows | 0) - 1, 200));
  return { columns, rows };
};
