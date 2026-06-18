import { expect, test } from 'bun:test';

import { INPUT_KEYBOARD, INPUT_MOUSE, INPUT_SIZE, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, MOUSEEVENTF_LEFTDOWN, packKeyboardInput, packMouseInput, virtualKeyCode } from '../input/input';

test('INPUT is 40 bytes on x64 (cbSize)', () => {
  expect(INPUT_SIZE).toBe(40);
});

test('keyboard INPUT byte layout', () => {
  const buffer = Buffer.alloc(INPUT_SIZE);
  packKeyboardInput(buffer, 0, 0x41, 0x1e, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP);
  expect(buffer.readUInt32LE(0)).toBe(INPUT_KEYBOARD); // type @0
  expect(buffer.readUInt32LE(4)).toBe(0); // padding @4
  expect(buffer.readUInt16LE(8)).toBe(0x41); // wVk @8
  expect(buffer.readUInt16LE(10)).toBe(0x1e); // wScan @10
  expect(buffer.readUInt32LE(12)).toBe(KEYEVENTF_UNICODE | KEYEVENTF_KEYUP); // dwFlags @12
  expect(buffer.readUInt32LE(16)).toBe(0); // time @16
  expect(buffer.readBigUInt64LE(24)).toBe(0n); // dwExtraInfo @24 (ULONG_PTR)
});

test('mouse INPUT byte layout', () => {
  const buffer = Buffer.alloc(INPUT_SIZE);
  packMouseInput(buffer, 0, 1234, -56, 0, MOUSEEVENTF_LEFTDOWN);
  expect(buffer.readUInt32LE(0)).toBe(INPUT_MOUSE); // type @0
  expect(buffer.readInt32LE(8)).toBe(1234); // dx @8
  expect(buffer.readInt32LE(12)).toBe(-56); // dy @12
  expect(buffer.readUInt32LE(16)).toBe(0); // mouseData @16
  expect(buffer.readUInt32LE(20)).toBe(MOUSEEVENTF_LEFTDOWN); // dwFlags @20
  expect(buffer.readBigUInt64LE(32)).toBe(0n); // dwExtraInfo @32
});

test('virtualKeyCode mapping', () => {
  expect(virtualKeyCode('Enter')).toBe(0x0d);
  expect(virtualKeyCode('Control')).toBe(0x11);
  expect(virtualKeyCode('A')).toBe(0x41);
  expect(virtualKeyCode('a')).toBe(0x41);
  expect(virtualKeyCode('5')).toBe(0x35);
  expect(virtualKeyCode('F4')).toBe(0x73);
  expect(() => virtualKeyCode('NopeKey')).toThrow();
});

test('packing at a non-zero offset (second INPUT in a batch)', () => {
  const buffer = Buffer.alloc(INPUT_SIZE * 2);
  packKeyboardInput(buffer, INPUT_SIZE, 0x42, 0, 0);
  expect(buffer.readUInt32LE(INPUT_SIZE)).toBe(INPUT_KEYBOARD);
  expect(buffer.readUInt16LE(INPUT_SIZE + 8)).toBe(0x42);
  expect(buffer.readUInt32LE(0)).toBe(0); // first slot untouched
});
