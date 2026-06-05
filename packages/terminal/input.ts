import Kernel32, { ControlKeyState, EventType, INPUT_RECORD_SIZE, MouseButtonState, MouseEventFlags, decodeInputRecord } from '@bun-win32/kernel32';

import { closeConsoleHandle, openConsoleInputHandle } from './console';

const { min } = Math;

// Raw console input: window-size + mouse events, extended flags; line/echo/processed
// input OFF so key presses arrive as records rather than cooked lines.
const ENABLE_EXTENDED_FLAGS = 0x0080;
const ENABLE_MOUSE_INPUT = 0x0010;
const ENABLE_WINDOW_INPUT = 0x0008;
const RAW_INPUT_MODE = (ENABLE_EXTENDED_FLAGS | ENABLE_MOUSE_INPUT | ENABLE_WINDOW_INPUT) >>> 0;

const READ_BATCH = 64;

// Virtual-key codes for keys that have no character. Letters/digits/punctuation come
// through as their typed character instead.
const VIRTUAL_KEY_NAMES: Record<number, string> = {
  0x08: 'backspace',
  0x09: 'tab',
  0x0d: 'enter',
  0x1b: 'esc',
  0x20: 'space',
  0x21: 'pageup',
  0x22: 'pagedown',
  0x23: 'end',
  0x24: 'home',
  0x25: 'left',
  0x26: 'up',
  0x27: 'right',
  0x28: 'down',
  0x2d: 'insert',
  0x2e: 'delete',
  0x70: 'f1',
  0x71: 'f2',
  0x72: 'f3',
  0x73: 'f4',
  0x74: 'f5',
  0x75: 'f6',
  0x76: 'f7',
  0x77: 'f8',
  0x78: 'f9',
  0x79: 'f10',
  0x7a: 'f11',
  0x7b: 'f12',
};

Kernel32.Preload(['FlushConsoleInputBuffer', 'GetConsoleMode', 'GetNumberOfConsoleInputEvents', 'ReadConsoleInputW', 'SetConsoleMode']);
const { FlushConsoleInputBuffer, GetConsoleMode, GetNumberOfConsoleInputEvents, ReadConsoleInputW, SetConsoleMode } = Kernel32;

/** A keyboard event. `down` distinguishes press from release (only the FFI backend reports releases). */
export interface KeyEvent {
  alt: boolean;
  ctrl: boolean;
  down: boolean;
  /** A normalised name: a single typed character, or a non-character key name — `esc` `enter` `tab` `space` `backspace` `delete` `insert` `home` `end` `pageup` `pagedown` `up` `down` `left` `right` `f1`..`f12`. */
  key: string;
  repeat: boolean;
  shift: boolean;
  /** Win32 virtual-key code, for callers that need the physical key regardless of layout. */
  virtualKeyCode: number;
}

/** A pointer event. Coordinates are 0-based cells; the loop maps them to surface coordinates. */
export interface PointerEvent {
  button: number;
  cellX: number;
  cellY: number;
  down: boolean;
  motion: boolean;
  /** +1 (up) / −1 (down) / 0 (none). */
  wheel: number;
}

export interface InputHandlers {
  /** Window focus gained (`true`) or lost (`false`). */
  focus?: (focused: boolean) => void;
  key?: (event: KeyEvent) => void;
  /** A run of pasted/injected text (characters delivered with no physical key). Opt-in: with no handler, pasted characters arrive as ordinary key events. */
  paste?: (text: string) => void;
  pointer?: (event: PointerEvent) => void;
  resize?: (columns: number, rows: number) => void;
}

/**
 * Reads the Windows console input buffer via `ReadConsoleInputW`, decoding real
 * key up/down + repeat + modifiers, mouse, and window-resize events. Poll once per
 * frame; call `restore()` on teardown.
 *
 * @example
 * const input = new ConsoleInput({ key: (event) => { if (event.key === 'esc') stop(); } });
 * // each frame:
 * input.poll();
 */
export class ConsoleInput {
  #handle: bigint;
  #savedMode: number;

  #handlers: InputHandlers;

  #pasteBuffer = '';
  #pendingCount = Buffer.alloc(4);
  #readCount = Buffer.alloc(4);
  #records = Buffer.alloc(INPUT_RECORD_SIZE * READ_BATCH);

  constructor(handlers: InputHandlers) {
    this.#handlers = handlers;
    this.#handle = openConsoleInputHandle();
    const modeBuffer = Buffer.alloc(4);
    this.#savedMode = GetConsoleMode(this.#handle, modeBuffer.ptr) ? modeBuffer.readUInt32LE(0) : 0;
    SetConsoleMode(this.#handle, RAW_INPUT_MODE);
    FlushConsoleInputBuffer(this.#handle);
  }

  /** Drain and dispatch all pending console input events. Call once per frame. */
  poll(): void {
    GetNumberOfConsoleInputEvents(this.#handle, this.#pendingCount.ptr);
    let pending = this.#pendingCount.readUInt32LE(0);
    while (pending > 0) {
      const batch = min(pending, READ_BATCH);
      if (!ReadConsoleInputW(this.#handle, this.#records.ptr, batch, this.#readCount.ptr)) break;
      const read = this.#readCount.readUInt32LE(0);
      if (read === 0) break;
      for (let index = 0; index < read; index++) this.#dispatch(index * INPUT_RECORD_SIZE);
      pending -= read;
    }
    this.#flushPaste();
  }

  // Emit any accumulated pasted text as a single event. Pasted/injected characters
  // arrive with no physical key (virtual-key code 0); when a paste handler is
  // registered they are coalesced here instead of dispatched as key events.
  #flushPaste(): void {
    if (this.#pasteBuffer.length === 0) return;
    const text = this.#pasteBuffer;
    this.#pasteBuffer = '';
    this.#handlers.paste?.(text);
  }

  #dispatch(byteOffset: number): void {
    const record = decodeInputRecord(this.#records, byteOffset);
    if (record.eventType === EventType.KEY_EVENT) {
      const event = record.keyEvent!;
      if (this.#handlers.paste !== undefined && event.virtualKeyCode === 0 && event.character !== 0) {
        if (event.keyDown) this.#pasteBuffer += String.fromCharCode(event.character);
        return; // swallow both press and release of injected text
      }
      this.#flushPaste();
      const controlKeyState = event.controlKeyState;
      const alt = (controlKeyState & (ControlKeyState.LEFT_ALT_PRESSED | ControlKeyState.RIGHT_ALT_PRESSED)) !== 0;
      const ctrl = (controlKeyState & (ControlKeyState.LEFT_CTRL_PRESSED | ControlKeyState.RIGHT_CTRL_PRESSED)) !== 0;
      const named = VIRTUAL_KEY_NAMES[event.virtualKeyCode];
      let key: string;
      if (named !== undefined) key = named;
      else if (event.character === 0)
        return; // a lone modifier or unmapped key
      else if (ctrl && event.character < 0x20)
        key = String.fromCharCode(event.character + 0x60); // ctrl+letter → the letter
      else key = String.fromCharCode(event.character);
      this.#handlers.key?.({
        alt,
        ctrl,
        down: event.keyDown,
        key,
        repeat: event.repeatCount > 1,
        shift: (controlKeyState & ControlKeyState.SHIFT_PRESSED) !== 0,
        virtualKeyCode: event.virtualKeyCode,
      });
    } else if (record.eventType === EventType.MOUSE_EVENT) {
      this.#flushPaste();
      const event = record.mouseEvent!;
      const wheeled = (event.eventFlags & MouseEventFlags.MOUSE_WHEELED) !== 0;
      const wheelHighWord = event.buttonState >>> 16;
      const wheelDelta = wheelHighWord > 0x7fff ? wheelHighWord - 0x10000 : wheelHighWord;
      this.#handlers.pointer?.({
        button: event.buttonState & 0xffff,
        cellX: event.positionX,
        cellY: event.positionY,
        down: (event.buttonState & MouseButtonState.FROM_LEFT_1ST_BUTTON_PRESSED) !== 0,
        motion: (event.eventFlags & MouseEventFlags.MOUSE_MOVED) !== 0,
        wheel: wheeled ? (wheelDelta > 0 ? 1 : -1) : 0,
      });
    } else if (record.eventType === EventType.WINDOW_BUFFER_SIZE_EVENT) {
      this.#flushPaste();
      const event = record.windowBufferSizeEvent!;
      this.#handlers.resize?.(event.columns, event.rows);
    } else if (record.eventType === EventType.FOCUS_EVENT) {
      this.#flushPaste();
      this.#handlers.focus?.(record.focusEvent!.setFocus);
    }
  }

  /** Restore the console input mode to its pre-session state and close the console handle. */
  restore(): void {
    SetConsoleMode(this.#handle, this.#savedMode);
    closeConsoleHandle(this.#handle);
  }
}
