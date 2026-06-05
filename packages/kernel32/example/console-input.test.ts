// Verifies the console-input struct decoders against the documented x64 byte
// layouts. Run: `bun run packages/kernel32/example/console-input.test.ts`.
// Exits non-zero on any failure.

import { ControlKeyState, decodeConsoleScreenBufferInfo, decodeInputRecord, EventType, INPUT_RECORD_SIZE, MouseEventFlags, packCOORD } from '../index';

let passCount = 0;
let failCount = 0;
const assert = (label: string, condition: boolean, detail = ''): void => {
  if (condition) passCount++;
  else {
    failCount++;
    console.log(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

assert('INPUT_RECORD_SIZE is 20', INPUT_RECORD_SIZE === 0x14);

// KEY_EVENT_RECORD: EventType@0=1, bKeyDown@4, wRepeatCount@8, wVirtualKeyCode@10,
// wVirtualScanCode@12, uChar@14, dwControlKeyState@16
{
  const keyDownBuffer = Buffer.alloc(INPUT_RECORD_SIZE);
  keyDownBuffer.writeUInt16LE(EventType.KEY_EVENT, 0x00);
  keyDownBuffer.writeInt32LE(1, 0x04);
  keyDownBuffer.writeUInt16LE(3, 0x08);
  keyDownBuffer.writeUInt16LE(0x41, 0x0a);
  keyDownBuffer.writeUInt16LE(0x1e, 0x0c);
  keyDownBuffer.writeUInt16LE(0x61, 0x0e);
  keyDownBuffer.writeUInt32LE(ControlKeyState.LEFT_CTRL_PRESSED | ControlKeyState.SHIFT_PRESSED, 0x10);
  const record = decodeInputRecord(keyDownBuffer, 0);
  assert('key event type', record.eventType === EventType.KEY_EVENT);
  assert('key down flag', record.keyEvent?.keyDown === true);
  assert('key repeat count', record.keyEvent?.repeatCount === 3);
  assert('key virtual code', record.keyEvent?.virtualKeyCode === 0x41);
  assert('key scan code', record.keyEvent?.virtualScanCode === 0x1e);
  assert('key character', record.keyEvent?.character === 0x61);
  assert('key control state', record.keyEvent?.controlKeyState === (ControlKeyState.LEFT_CTRL_PRESSED | ControlKeyState.SHIFT_PRESSED));
}

{
  const keyUpBuffer = Buffer.alloc(INPUT_RECORD_SIZE);
  keyUpBuffer.writeUInt16LE(EventType.KEY_EVENT, 0x00);
  keyUpBuffer.writeInt32LE(0, 0x04);
  keyUpBuffer.writeUInt16LE(0x25, 0x0a);
  const record = decodeInputRecord(keyUpBuffer, 0);
  assert('key up flag', record.keyEvent?.keyDown === false);
  assert('key up virtual code', record.keyEvent?.virtualKeyCode === 0x25);
}

// MOUSE_EVENT_RECORD: COORD@4 (x@4,y@6), dwButtonState@8, dwControlKeyState@12, dwEventFlags@16
{
  const mouseBuffer = Buffer.alloc(INPUT_RECORD_SIZE);
  mouseBuffer.writeUInt16LE(EventType.MOUSE_EVENT, 0x00);
  mouseBuffer.writeInt16LE(12, 0x04);
  mouseBuffer.writeInt16LE(7, 0x06);
  mouseBuffer.writeUInt32LE(0x0001, 0x08);
  mouseBuffer.writeUInt32LE(0, 0x0c);
  mouseBuffer.writeUInt32LE(MouseEventFlags.MOUSE_MOVED, 0x10);
  const record = decodeInputRecord(mouseBuffer, 0);
  assert('mouse event type', record.eventType === EventType.MOUSE_EVENT);
  assert('mouse position x', record.mouseEvent?.positionX === 12);
  assert('mouse position y', record.mouseEvent?.positionY === 7);
  assert('mouse button state', record.mouseEvent?.buttonState === 1);
  assert('mouse moved flag', record.mouseEvent?.eventFlags === MouseEventFlags.MOUSE_MOVED);
}

// WINDOW_BUFFER_SIZE_RECORD: COORD@4 (columns@4, rows@6)
{
  const resizeBuffer = Buffer.alloc(INPUT_RECORD_SIZE);
  resizeBuffer.writeUInt16LE(EventType.WINDOW_BUFFER_SIZE_EVENT, 0x00);
  resizeBuffer.writeInt16LE(120, 0x04);
  resizeBuffer.writeInt16LE(40, 0x06);
  const record = decodeInputRecord(resizeBuffer, 0);
  assert('resize event type', record.eventType === EventType.WINDOW_BUFFER_SIZE_EVENT);
  assert('resize columns', record.windowBufferSizeEvent?.columns === 120);
  assert('resize rows', record.windowBufferSizeEvent?.rows === 40);
}

// Decode a record at a non-zero offset (records read in a batch buffer)
{
  const batchBuffer = Buffer.alloc(INPUT_RECORD_SIZE * 2);
  batchBuffer.writeUInt16LE(EventType.KEY_EVENT, INPUT_RECORD_SIZE);
  batchBuffer.writeInt32LE(1, INPUT_RECORD_SIZE + 0x04);
  batchBuffer.writeUInt16LE(0x42, INPUT_RECORD_SIZE + 0x0a);
  const record = decodeInputRecord(batchBuffer, INPUT_RECORD_SIZE);
  assert('batch offset virtual code', record.keyEvent?.virtualKeyCode === 0x42);
}

// CONSOLE_SCREEN_BUFFER_INFO: srWindow Left@10 Top@12 Right@14 Bottom@16
{
  const screenBufferInfo = Buffer.alloc(22);
  screenBufferInfo.writeInt16LE(200, 0x00);
  screenBufferInfo.writeInt16LE(300, 0x02);
  screenBufferInfo.writeInt16LE(5, 0x04);
  screenBufferInfo.writeInt16LE(6, 0x06);
  screenBufferInfo.writeUInt16LE(0x07, 0x08);
  screenBufferInfo.writeInt16LE(0, 0x0a);
  screenBufferInfo.writeInt16LE(0, 0x0c);
  screenBufferInfo.writeInt16LE(119, 0x0e);
  screenBufferInfo.writeInt16LE(39, 0x10);
  screenBufferInfo.writeInt16LE(200, 0x12);
  screenBufferInfo.writeInt16LE(60, 0x14);
  const decoded = decodeConsoleScreenBufferInfo(screenBufferInfo);
  assert('screen buffer columns', decoded.columns === 120, `got ${decoded.columns}`);
  assert('screen buffer rows', decoded.rows === 40, `got ${decoded.rows}`);
  assert('screen buffer cursor', decoded.cursorX === 5 && decoded.cursorY === 6);
  assert('screen buffer attributes', decoded.attributes === 0x07);
}

assert('packCOORD low/high word', packCOORD(3, 5) === ((5 << 16) | 3));
assert('packCOORD clamps to u32', packCOORD(0xffff, 0xffff) === 0xffffffff);

console.log(`console-input.test: ${passCount} pass, ${failCount} fail`);
if (failCount > 0) process.exit(1);
