// Synthetic input via SendInput, for the cases UIA patterns can't cover: typing into a control with
// no ValuePattern, and clicking a control with no InvokePattern. Greenfield — the x64 INPUT struct is
// 40 bytes (DWORD type @0, 4 pad, union @8: MOUSEINPUT 32B / KEYBDINPUT 24B with ULONG_PTR fields
// 8-byte aligned). cbSize MUST be 40 or SendInput silently injects nothing.

import User32 from '@bun-win32/user32';

export const INPUT_MOUSE = 0x0000_0000;
export const INPUT_KEYBOARD = 0x0000_0001;

const KEYEVENTF_EXTENDEDKEY = 0x0000_0001;
export const KEYEVENTF_KEYUP = 0x0000_0002;
export const KEYEVENTF_UNICODE = 0x0000_0004;
const KEYEVENTF_SCANCODE = 0x0000_0008;

const MOUSEEVENTF_MOVE = 0x0000_0001;
export const MOUSEEVENTF_LEFTDOWN = 0x0000_0002;
const MOUSEEVENTF_LEFTUP = 0x0000_0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0000_0008;
const MOUSEEVENTF_RIGHTUP = 0x0000_0010;
const MOUSEEVENTF_MIDDLEDOWN = 0x0000_0020;
const MOUSEEVENTF_MIDDLEUP = 0x0000_0040;
const MOUSEEVENTF_ABSOLUTE = 0x0000_8000;
const MOUSEEVENTF_VIRTUALDESK = 0x0000_4000;
const MOUSEEVENTF_WHEEL = 0x0000_0800;
const MOUSEEVENTF_HWHEEL = 0x0000_1000;

/** One wheel notch, in the units SendInput's mouseData expects. */
const WHEEL_DELTA = 120;

/** sizeof(INPUT) on x64 — pass this as cbSize, or SendInput injects nothing. */
export const INPUT_SIZE = 40;

const NAMED_KEYS: Record<string, number> = {
  alt: 0x12,
  backspace: 0x08,
  control: 0x11,
  ctrl: 0x11,
  del: 0x2e,
  delete: 0x2e,
  down: 0x28,
  end: 0x23,
  enter: 0x0d,
  esc: 0x1b,
  escape: 0x1b,
  f1: 0x70,
  f10: 0x79,
  f11: 0x7a,
  f12: 0x7b,
  f2: 0x71,
  f3: 0x72,
  f4: 0x73,
  f5: 0x74,
  f6: 0x75,
  f7: 0x76,
  f8: 0x77,
  f9: 0x78,
  home: 0x24,
  insert: 0x2d,
  left: 0x25,
  menu: 0x12,
  meta: 0x5b,
  pagedown: 0x22,
  pageup: 0x21,
  return: 0x0d,
  right: 0x27,
  shift: 0x10,
  space: 0x20,
  tab: 0x09,
  up: 0x26,
  win: 0x5b,
};

// Keys that require KEYEVENTF_EXTENDEDKEY to behave correctly across apps.
const EXTENDED_KEYS = new Set([0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x2d, 0x2e]);

/** Map a key name ('Enter', 'Control', 'A', '5', 'F4') to its virtual-key code. Throws if unknown. */
export function virtualKeyCode(name: string): number {
  const lower = name.toLowerCase();
  if (lower in NAMED_KEYS) return NAMED_KEYS[lower]!;
  if (name.length === 1) {
    const code = name.toUpperCase().charCodeAt(0);
    if ((code >= 0x41 && code <= 0x5a) || (code >= 0x30 && code <= 0x39)) return code;
  }
  // Enumerate the accepted vocabulary so an unresolved name yields a self-correction path (matching the MCP's other
  // enum errors). xdotool/CUA spellings (ArrowDown, Page_Down, super, spacebar, …) are mapped by normalizeKey first.
  throw new Error(
    `unknown key: ${JSON.stringify(name)} — use a single letter/digit, or one of: Enter Escape Tab Space Backspace Delete Insert Home End PageUp PageDown Up Down Left Right F1-F12 (modifiers Control/Ctrl Alt Shift Win/Meta). A chord joins parts with '+', e.g. Control+S or Control+Shift+Tab.`,
  );
}

/** Pack a KEYBDINPUT-bearing INPUT at `offset` (the buffer must be zero-filled first). */
export function packKeyboardInput(buffer: Buffer, offset: number, virtualKey: number, scanCode: number, flags: number): void {
  buffer.writeUInt32LE(INPUT_KEYBOARD, offset); // type @0
  buffer.writeUInt16LE(virtualKey, offset + 8); // KEYBDINPUT.wVk @8
  buffer.writeUInt16LE(scanCode, offset + 10); // wScan @10
  buffer.writeUInt32LE(flags, offset + 12); // dwFlags @12
  buffer.writeUInt32LE(0, offset + 16); // time @16
  buffer.writeBigUInt64LE(0n, offset + 24); // dwExtraInfo @24 (ULONG_PTR, 8-byte aligned)
}

/** Pack a MOUSEINPUT-bearing INPUT at `offset` (the buffer must be zero-filled first). */
export function packMouseInput(buffer: Buffer, offset: number, dx: number, dy: number, mouseData: number, flags: number): void {
  buffer.writeUInt32LE(INPUT_MOUSE, offset); // type @0
  buffer.writeInt32LE(dx, offset + 8); // MOUSEINPUT.dx @8
  buffer.writeInt32LE(dy, offset + 12); // dy @12
  buffer.writeUInt32LE(mouseData, offset + 16); // mouseData @16
  buffer.writeUInt32LE(flags, offset + 20); // dwFlags @20
  buffer.writeUInt32LE(0, offset + 24); // time @24
  buffer.writeBigUInt64LE(0n, offset + 32); // dwExtraInfo @32
}

/** Type Unicode text into the focused control, code unit by code unit (locale/layout-independent). */
export function type(text: string): void {
  if (text.length === 0) return;
  const count = text.length * 2; // down + up per UTF-16 code unit
  const buffer = Buffer.alloc(count * INPUT_SIZE);
  let offset = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    packKeyboardInput(buffer, offset, 0, code, KEYEVENTF_UNICODE);
    offset += INPUT_SIZE;
    packKeyboardInput(buffer, offset, 0, code, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP);
    offset += INPUT_SIZE;
  }
  User32.SendInput(count, buffer.ptr!, INPUT_SIZE);
}

/** Send a key chord like 'Enter', 'Control+S', 'Control+Shift+Tab' to the focused control. */
export function sendKeys(combo: string): void {
  const parts = combo.split('+').map((part) => part.trim());
  const key = parts[parts.length - 1]!;
  const modifiers = parts.slice(0, -1).map(virtualKeyCode);
  const keyCode = virtualKeyCode(key);
  const sequence: Array<{ virtualKey: number; flags: number }> = [];
  for (const modifier of modifiers) sequence.push({ virtualKey: modifier, flags: 0 });
  sequence.push({ virtualKey: keyCode, flags: EXTENDED_KEYS.has(keyCode) ? KEYEVENTF_EXTENDEDKEY : 0 });
  sequence.push({ virtualKey: keyCode, flags: KEYEVENTF_KEYUP | (EXTENDED_KEYS.has(keyCode) ? KEYEVENTF_EXTENDEDKEY : 0) });
  for (let index = modifiers.length - 1; index >= 0; index -= 1) sequence.push({ virtualKey: modifiers[index]!, flags: KEYEVENTF_KEYUP });
  const buffer = Buffer.alloc(sequence.length * INPUT_SIZE);
  let offset = 0;
  for (const event of sequence) {
    packKeyboardInput(buffer, offset, event.virtualKey, 0, event.flags);
    offset += INPUT_SIZE;
  }
  User32.SendInput(sequence.length, buffer.ptr!, INPUT_SIZE);
}

/**
 * Move the cursor to a screen point (physical pixels — the process is DPI-aware) and left-click.
 * Uses SetCursorPos for exact placement, then SendInput button events. Requires an unlocked,
 * interactive desktop (synthetic input is blocked on a locked session).
 */
export function clickAt(x: number, y: number): void {
  User32.SetCursorPos(x, y);
  const buffer = Buffer.alloc(2 * INPUT_SIZE);
  packMouseInput(buffer, 0, 0, 0, 0, MOUSEEVENTF_LEFTDOWN);
  packMouseInput(buffer, INPUT_SIZE, 0, 0, 0, MOUSEEVENTF_LEFTUP);
  User32.SendInput(2, buffer.ptr!, INPUT_SIZE);
}

/** The current cursor position in physical screen pixels. */
export function cursorPosition(): { x: number; y: number } {
  const point = Buffer.alloc(8);
  User32.GetCursorPos(point.ptr!);
  return { x: point.readInt32LE(0), y: point.readInt32LE(4) };
}

/** Move the cursor to a screen point (physical pixels). Moves the REAL cursor. */
export function moveTo(x: number, y: number): void {
  User32.SetCursorPos(x, y);
}

/** Right-click at a screen point via SendInput (moves the real cursor; needs an unlocked desktop). */
export function rightClickAt(x: number, y: number): void {
  User32.SetCursorPos(x, y);
  const buffer = Buffer.alloc(2 * INPUT_SIZE);
  packMouseInput(buffer, 0, 0, 0, 0, MOUSEEVENTF_RIGHTDOWN);
  packMouseInput(buffer, INPUT_SIZE, 0, 0, 0, MOUSEEVENTF_RIGHTUP);
  User32.SendInput(2, buffer.ptr!, INPUT_SIZE);
}

/** Middle-click at a screen point via SendInput. */
export function middleClickAt(x: number, y: number): void {
  User32.SetCursorPos(x, y);
  const buffer = Buffer.alloc(2 * INPUT_SIZE);
  packMouseInput(buffer, 0, 0, 0, 0, MOUSEEVENTF_MIDDLEDOWN);
  packMouseInput(buffer, INPUT_SIZE, 0, 0, 0, MOUSEEVENTF_MIDDLEUP);
  User32.SendInput(2, buffer.ptr!, INPUT_SIZE);
}

/** Double left-click at a screen point in one atomic SendInput (down/up/down/up). */
export function doubleClickAt(x: number, y: number): void {
  User32.SetCursorPos(x, y);
  const buffer = Buffer.alloc(4 * INPUT_SIZE);
  packMouseInput(buffer, 0, 0, 0, 0, MOUSEEVENTF_LEFTDOWN);
  packMouseInput(buffer, INPUT_SIZE, 0, 0, 0, MOUSEEVENTF_LEFTUP);
  packMouseInput(buffer, 2 * INPUT_SIZE, 0, 0, 0, MOUSEEVENTF_LEFTDOWN);
  packMouseInput(buffer, 3 * INPUT_SIZE, 0, 0, 0, MOUSEEVENTF_LEFTUP);
  User32.SendInput(4, buffer.ptr!, INPUT_SIZE);
}

/** Scroll the wheel `clicks` notches at a screen point (positive = up/right, negative = down/left). */
export function scrollWheel(x: number, y: number, clicks: number, horizontal = false): void {
  User32.SetCursorPos(x, y);
  const buffer = Buffer.alloc(INPUT_SIZE);
  packMouseInput(buffer, 0, 0, 0, (clicks * WHEEL_DELTA) >>> 0, horizontal ? MOUSEEVENTF_HWHEEL : MOUSEEVENTF_WHEEL);
  User32.SendInput(1, buffer.ptr!, INPUT_SIZE);
}

/** Interpolated real-cursor drag from one screen point to another via SendInput: SetCursorPos(from) → LEFTDOWN →
 *  `steps` SetCursorPos moves → SetCursorPos(to) → LEFTUP. The intermediate moves each post a WM_MOUSEMOVE to the
 *  window under the cursor, crossing the OS drag threshold (SM_CXDRAG/SM_CYDRAG, 4px) AFTER button-down and feeding
 *  the dragstart/dragover stream — so threshold-gated drags (HTML5/Chromium drag-DROP, list reorder, slider thumb,
 *  canvas) register, where a single from→to jump would not. */
export function dragTo(fromX: number, fromY: number, toX: number, toY: number, steps = 16): void {
  User32.SetCursorPos(fromX, fromY);
  const down = Buffer.alloc(INPUT_SIZE);
  packMouseInput(down, 0, 0, 0, 0, MOUSEEVENTF_LEFTDOWN);
  User32.SendInput(1, down.ptr!, INPUT_SIZE);
  for (let step = 1; step <= steps; step += 1) User32.SetCursorPos(Math.round(fromX + ((toX - fromX) * step) / steps), Math.round(fromY + ((toY - fromY) * step) / steps));
  User32.SetCursorPos(toX, toY);
  const up = Buffer.alloc(INPUT_SIZE);
  packMouseInput(up, 0, 0, 0, 0, MOUSEEVENTF_LEFTUP);
  User32.SendInput(1, up.ptr!, INPUT_SIZE);
}

/** Press a key down (no release) — pair with `keyUp`, or use `sendKeys` for a full chord. */
export function keyDown(name: string): void {
  const keyCode = virtualKeyCode(name);
  const buffer = Buffer.alloc(INPUT_SIZE);
  packKeyboardInput(buffer, 0, keyCode, 0, EXTENDED_KEYS.has(keyCode) ? KEYEVENTF_EXTENDEDKEY : 0);
  User32.SendInput(1, buffer.ptr!, INPUT_SIZE);
}

/** Release a previously pressed key. */
export function keyUp(name: string): void {
  const keyCode = virtualKeyCode(name);
  const buffer = Buffer.alloc(INPUT_SIZE);
  packKeyboardInput(buffer, 0, keyCode, 0, KEYEVENTF_KEYUP | (EXTENDED_KEYS.has(keyCode) ? KEYEVENTF_EXTENDEDKEY : 0));
  User32.SendInput(1, buffer.ptr!, INPUT_SIZE);
}

/** Whether a key is physically down RIGHT NOW (GetAsyncKeyState high bit). Crash-safe input OBSERVATION by polling
 *  on the JS tick — no SetWindowsHookEx foreign-thread callback (the uiohook/JSCallback hazard) and no message pump.
 *  Read-only; call it in a poll loop to watch input. Accepts the same key names as sendKeys ('Shift', 'Control',
 *  'A', 'F4'). */
export function isKeyDown(name: string): boolean {
  return (User32.GetAsyncKeyState(virtualKeyCode(name)) & 0x8000) !== 0;
}

// Cursor-free input via WINDOW MESSAGES posted/sent to a control's HWND — no focus, no foreground, no real cursor,
// and works on a background/occluded window. SendInput, by contrast,
// goes to whatever owns the system focus. The HWND must be a real control window (Element.nativeWindowHandle != 0);
// modern WinUI/WPF/Chromium sub-controls without their own HWND fall back to ValuePattern/SendInput.
const BM_CLICK = 0x0000_00f5;
const WM_SETTEXT = 0x0000_000c;
const WM_KEYDOWN = 0x0000_0100;
const WM_KEYUP = 0x0000_0101;
const WM_CHAR = 0x0000_0102;
const WM_CUT = 0x0000_0300;
const WM_COPY = 0x0000_0301;
const WM_PASTE = 0x0000_0302;
const EM_SETSEL = 0x0000_00b1;
const WM_MOUSEWHEEL = 0x0000_020a;
const WM_MOUSEHWHEEL = 0x0000_020e;
const EM_UNDO = 0x0000_00c7;

/** Set a control's text cursor-free via SendMessageW(WM_SETTEXT) — no keystrokes/focus, works on a background
 *  window. SendMessageW is synchronous, so the wide-string buffer is valid for the call.
 *  Returns false for a 0 handle or a control that rejects WM_SETTEXT. */
export function setControlText(hWnd: bigint, text: string): boolean {
  if (hWnd === 0n) return false;
  const buffer = Buffer.from(`${text}\0`, 'utf16le');
  return User32.SendMessageW(hWnd, WM_SETTEXT, 0n, BigInt(buffer.ptr!)) !== 0n;
}

/** Click a classic Win32 button/checkbox/radio (window class "Button") cursor-free via PostMessageW(BM_CLICK) — the
 *  control fires its own WM_COMMAND/toggle as if clicked, with NO focus change and NO foreground steal, on a
 *  minimized/background/locked window (proven live where the UIA Invoke/Toggle pattern STEALS foreground to the
 *  control's HWND — see findings/32). Caller MUST verify the class is "Button" (BM_CLICK is a no-op on other classes).
 *  Posted (async-queued), so the visible/UIA state settles a tick later. Returns false for a 0 handle. */
export function postButtonClick(hWnd: bigint): boolean {
  if (hWnd === 0n) return false;
  return User32.PostMessageW(hWnd, BM_CLICK, 0n, 0n) !== 0;
}

/** Undo the last edit in a classic Edit / RichEdit cursor-free via SendMessageW(EM_UNDO) — no Ctrl+Z keystroke,
 *  no focus, works on a background/minimized window. Returns false for a 0 handle or a control that cannot undo. */
export function undoControl(hWnd: bigint): boolean {
  if (hWnd === 0n) return false;
  return User32.SendMessageW(hWnd, EM_UNDO, 0n, 0n) !== 0n;
}

/** Scroll a control's HWND cursor-free via posted WM_MOUSEWHEEL — no real wheel/cursor, works on a background /
 *  occluded / minimized window. `notches` > 0 scrolls up/away, < 0 down/toward (one notch = WHEEL_DELTA 120).
 *  `screenX`/`screenY` is the point the wheel is reported over (the control's center). False for a 0 handle. */
export function postWheel(hWnd: bigint, screenX: number, screenY: number, notches: number): boolean {
  if (hWnd === 0n) return false;
  const delta = Math.trunc(notches) * 120;
  const wParam = BigInt(((delta & 0xffff) << 16) >>> 0); // hiword = wheel delta (signed short), loword = key flags (none)
  const lParam = BigInt((((screenY & 0xffff) << 16) | (screenX & 0xffff)) >>> 0); // loword = x, hiword = y (screen coords)
  return User32.PostMessageW(hWnd, WM_MOUSEWHEEL, wParam, lParam) !== 0;
}

/** Scroll a control's HWND HORIZONTALLY cursor-free via posted WM_MOUSEHWHEEL — the sideways twin of postWheel for a
 *  ScrollPattern-less own-HWND control (wide list / carousel / horizontally-scrolled Edit). `notches` > 0 scrolls
 *  RIGHT, < 0 LEFT (one notch = 120). False for a 0 handle. */
export function postHWheel(hWnd: bigint, screenX: number, screenY: number, notches: number): boolean {
  if (hWnd === 0n) return false;
  const delta = Math.trunc(notches) * 120;
  const wParam = BigInt(((delta & 0xffff) << 16) >>> 0); // hiword = wheel delta (signed short; +right/-left), loword = key flags
  const lParam = BigInt((((screenY & 0xffff) << 16) | (screenX & 0xffff)) >>> 0); // loword = x, hiword = y (screen coords)
  return User32.PostMessageW(hWnd, WM_MOUSEHWHEEL, wParam, lParam) !== 0;
}

/** Press a key (WM_KEYDOWN + WM_KEYUP) on a control's HWND cursor-free — Enter / Tab / Escape / arrows / a single
 *  key to a background/occluded window without focus. False for a 0 handle. */
export function postKey(hWnd: bigint, name: string): boolean {
  if (hWnd === 0n) return false;
  const keyCode = BigInt(virtualKeyCode(name));
  User32.PostMessageW(hWnd, WM_KEYDOWN, keyCode, 0x0000_0001n); // lParam: repeat count 1
  return User32.PostMessageW(hWnd, WM_KEYUP, keyCode, 0xc000_0001n) !== 0; // lParam: key-up transition + previously down
}

/** Hold a key DOWN on a control's HWND cursor-free for durationMs via a WM_KEYDOWN autorepeat stream (bit 30 — previous
 *  key-state-down — set after the first press), closed by WM_KEYUP — no focus, no SendInput, background/occluded/locked
 *  capable. The ~40ms cadence mirrors the OS keyboard auto-repeat an app expects while a key is held (arrow-repeat, a
 *  game key). False for a 0 handle (a sub-control with no own HWND — hold it via SendInput holdKey instead). */
export async function postHoldKey(hWnd: bigint, name: string, durationMs: number): Promise<boolean> {
  if (hWnd === 0n) return false;
  const keyCode = BigInt(virtualKeyCode(name));
  User32.PostMessageW(hWnd, WM_KEYDOWN, keyCode, 0x0000_0001n); // initial press: repeat count 1, previous state up
  const deadline = Date.now() + Math.max(0, durationMs);
  while (Date.now() < deadline) {
    await Bun.sleep(40);
    User32.PostMessageW(hWnd, WM_KEYDOWN, keyCode, 0x4000_0001n); // autorepeat: bit 30 (previous state down) set
  }
  return User32.PostMessageW(hWnd, WM_KEYUP, keyCode, 0xc000_0001n) !== 0; // lParam: key-up transition + previously down
}

/** Paste the clipboard into a control's HWND cursor-free via SendMessageW(WM_PASTE) — no focus/keystrokes, works on
 *  a background/occluded/minimized window. WM_PASTE returns 0 regardless of outcome, so this is best-effort: false
 *  only for a 0 handle (a WinUI/WPF/Chromium sub-control with no own HWND — paste it via SendInput Ctrl+V instead). */
export function pasteToControl(hWnd: bigint): boolean {
  if (hWnd === 0n) return false;
  User32.SendMessageW(hWnd, WM_PASTE, 0n, 0n);
  return true;
}

/** Select ALL text in a classic Edit cursor-free via EM_SETSEL(0, -1) — no focus, background-capable. False for a 0
 *  handle. (Edit/RichEdit honor EM_SETSEL; a non-Edit control ignores it.) */
export function selectAllInControl(hWnd: bigint): boolean {
  if (hWnd === 0n) return false;
  User32.SendMessageW(hWnd, EM_SETSEL, 0n, -1n);
  return true;
}

/** Copy a control's current selection to the clipboard cursor-free via SendMessageW(WM_COPY) — no Ctrl+C keystroke,
 *  works on a background/minimized window. Best-effort (read the clipboard after): false only for a 0 handle. */
export function copyFromControl(hWnd: bigint): boolean {
  if (hWnd === 0n) return false;
  User32.SendMessageW(hWnd, WM_COPY, 0n, 0n);
  return true;
}

/** Cut a control's current selection to the clipboard cursor-free via SendMessageW(WM_CUT) — no Ctrl+X keystroke,
 *  works on a background/minimized window. Best-effort (read the clipboard after): false only for a 0 handle. */
export function cutFromControl(hWnd: bigint): boolean {
  if (hWnd === 0n) return false;
  User32.SendMessageW(hWnd, WM_CUT, 0n, 0n);
  return true;
}

/** Type Unicode text (WM_CHAR per code unit) into a control's HWND cursor-free — no focus, background-capable.
 *  A newline is mapped to carriage return (0x0D): an Edit/RichEdit inserts a line break on WM_CHAR with 0x0D, NOT
 *  0x0A — a posted 0x0A is swallowed, so a multi-line string would otherwise collapse to one line. A `\r\n` pair
 *  posts as ONE break (the `\n` after a `\r` is dropped). */
export function postText(hWnd: bigint, text: string): boolean {
  if (hWnd === 0n) return false;
  let ok = true;
  // Iterate UTF-16 code UNITS (charCodeAt), not code points — WM_CHAR carries one UTF-16 unit, so an astral char
  // must post as its two surrogate halves (for..of would yield one out-of-range code point and truncate it).
  // Pinned by example/non-latin-input.integration.test.ts (emoji/CJK-extension-B round-trip) — do not switch to for..of.
  for (let index = 0; index < text.length; index += 1) {
    let code = text.charCodeAt(index);
    if (code === 0x0a) {
      if (index > 0 && text.charCodeAt(index - 1) === 0x0d) continue; // the `\n` half of a `\r\n` — already posted the break
      code = 0x0d; // a lone LF → CR so the edit control inserts a line break
    }
    if (User32.PostMessageW(hWnd, WM_CHAR, BigInt(code), 0n) === 0) ok = false;
  }
  return ok;
}

/** Hold a key down for `durationMs`, then release (the Anthropic `hold_key` action). */
export async function holdKey(name: string, durationMs: number): Promise<void> {
  keyDown(name);
  await Bun.sleep(durationMs);
  keyUp(name);
}

/** Press the left mouse button down at a screen point (pair with `mouseUp`; the drag primitive). */
export function mouseDown(x: number, y: number): void {
  User32.SetCursorPos(x, y);
  const buffer = Buffer.alloc(INPUT_SIZE);
  packMouseInput(buffer, 0, 0, 0, 0, MOUSEEVENTF_LEFTDOWN);
  User32.SendInput(1, buffer.ptr!, INPUT_SIZE);
}

/** Release the left mouse button at a screen point. */
export function mouseUp(x: number, y: number): void {
  User32.SetCursorPos(x, y);
  const buffer = Buffer.alloc(INPUT_SIZE);
  packMouseInput(buffer, 0, 0, 0, 0, MOUSEEVENTF_LEFTUP);
  User32.SendInput(1, buffer.ptr!, INPUT_SIZE);
}
