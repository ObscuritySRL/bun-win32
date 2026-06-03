// Verifies the console-input struct decoders against the documented x64 byte
// layouts. Run: `bun run packages/kernel32/example/console-input.test.ts`.
// Exits non-zero on any failure.

import {
  ControlKeyState,
  decodeConsoleScreenBufferInfo,
  decodeInputRecord,
  EventType,
  INPUT_RECORD_SIZE,
  MouseEventFlags,
  packCOORD,
} from '../index';

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean, detail = ''): void => {
  if (cond) pass++;
  else {
    fail++;
    console.log(`FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

// Stride
check('INPUT_RECORD_SIZE is 20', INPUT_RECORD_SIZE === 20);

// KEY_EVENT_RECORD: EventType@0=1, bKeyDown@4, wRepeatCount@8, wVirtualKeyCode@10,
// wVirtualScanCode@12, uChar@14, dwControlKeyState@16
{
  const b = Buffer.alloc(INPUT_RECORD_SIZE);
  b.writeUInt16LE(EventType.KEY_EVENT, 0);
  b.writeInt32LE(1, 4); // bKeyDown
  b.writeUInt16LE(3, 8); // repeat
  b.writeUInt16LE(0x41, 10); // VK 'A'
  b.writeUInt16LE(0x1e, 12); // scan
  b.writeUInt16LE(0x61, 14); // 'a'
  b.writeUInt32LE(ControlKeyState.LEFT_CTRL_PRESSED | ControlKeyState.SHIFT_PRESSED, 16);
  const r = decodeInputRecord(b, 0);
  check('key type', r.type === EventType.KEY_EVENT);
  check('key down', r.key?.keyDown === true);
  check('key repeat', r.key?.repeatCount === 3);
  check('key vk', r.key?.virtualKeyCode === 0x41);
  check('key scan', r.key?.virtualScanCode === 0x1e);
  check('key char', r.key?.char === 0x61);
  check('key ctrl+shift', r.key?.controlKeyState === (ControlKeyState.LEFT_CTRL_PRESSED | ControlKeyState.SHIFT_PRESSED));
}

// Key-up
{
  const b = Buffer.alloc(INPUT_RECORD_SIZE);
  b.writeUInt16LE(EventType.KEY_EVENT, 0);
  b.writeInt32LE(0, 4);
  b.writeUInt16LE(0x25, 10); // VK_LEFT
  const r = decodeInputRecord(b, 0);
  check('key up', r.key?.keyDown === false);
  check('key up vk', r.key?.virtualKeyCode === 0x25);
}

// MOUSE_EVENT_RECORD: COORD@4 (x@4,y@6), dwButtonState@8, dwControlKeyState@12, dwEventFlags@16
{
  const b = Buffer.alloc(INPUT_RECORD_SIZE);
  b.writeUInt16LE(EventType.MOUSE_EVENT, 0);
  b.writeInt16LE(12, 4);
  b.writeInt16LE(7, 6);
  b.writeUInt32LE(0x0001, 8); // left button
  b.writeUInt32LE(0, 12);
  b.writeUInt32LE(MouseEventFlags.MOUSE_MOVED, 16);
  const r = decodeInputRecord(b, 0);
  check('mouse type', r.type === EventType.MOUSE_EVENT);
  check('mouse x', r.mouse?.x === 12);
  check('mouse y', r.mouse?.y === 7);
  check('mouse btn', r.mouse?.buttonState === 1);
  check('mouse moved', r.mouse?.eventFlags === MouseEventFlags.MOUSE_MOVED);
}

// WINDOW_BUFFER_SIZE_RECORD: COORD@4 (cols@4, rows@6)
{
  const b = Buffer.alloc(INPUT_RECORD_SIZE);
  b.writeUInt16LE(EventType.WINDOW_BUFFER_SIZE_EVENT, 0);
  b.writeInt16LE(120, 4);
  b.writeInt16LE(40, 6);
  const r = decodeInputRecord(b, 0);
  check('resize type', r.type === EventType.WINDOW_BUFFER_SIZE_EVENT);
  check('resize cols', r.size?.cols === 120);
  check('resize rows', r.size?.rows === 40);
}

// Decode at a non-zero offset (records read in a batch buffer)
{
  const b = Buffer.alloc(INPUT_RECORD_SIZE * 2);
  b.writeUInt16LE(EventType.KEY_EVENT, INPUT_RECORD_SIZE);
  b.writeInt32LE(1, INPUT_RECORD_SIZE + 4);
  b.writeUInt16LE(0x42, INPUT_RECORD_SIZE + 10);
  const r = decodeInputRecord(b, INPUT_RECORD_SIZE);
  check('batch offset vk', r.key?.virtualKeyCode === 0x42);
}

// CONSOLE_SCREEN_BUFFER_INFO: srWindow Left@10 Top@12 Right@14 Bottom@16
{
  const b = Buffer.alloc(22);
  b.writeInt16LE(200, 0); // dwSize.X
  b.writeInt16LE(300, 2); // dwSize.Y
  b.writeInt16LE(5, 4); // cursor X
  b.writeInt16LE(6, 6); // cursor Y
  b.writeUInt16LE(0x07, 8); // attributes
  b.writeInt16LE(0, 10); // win Left
  b.writeInt16LE(0, 12); // win Top
  b.writeInt16LE(119, 14); // win Right
  b.writeInt16LE(39, 16); // win Bottom
  b.writeInt16LE(200, 18); // maxX
  b.writeInt16LE(60, 20); // maxY
  const c = decodeConsoleScreenBufferInfo(b);
  check('csbi cols', c.cols === 120, `got ${c.cols}`);
  check('csbi rows', c.rows === 40, `got ${c.rows}`);
  check('csbi cursor', c.cursorX === 5 && c.cursorY === 6);
  check('csbi attr', c.attributes === 0x07);
}

// packCOORD: low16=x, high16=y
check('packCOORD', packCOORD(3, 5) === ((5 << 16) | 3));
check('packCOORD clamps to u32', packCOORD(0xffff, 0xffff) === 0xffffffff);

console.log(`console-input.test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
