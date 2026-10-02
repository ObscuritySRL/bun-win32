import { FFIType, JSCallback } from 'bun:ffi';
import { expect, test } from 'bun:test';

import GDI32 from '@bun-win32/gdi32';
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

test('HRESULT errors retain their sign', () => {
  const description = Buffer.alloc(0x08);
  expect(Kernel32.GetThreadDescription(0n, description.ptr)).toBeLessThan(0);
});

test('SIZE_T returns remain bigint values', () => {
  expect(typeof Kernel32.HeapCompact(Kernel32.GetProcessHeap(), 0)).toBe('bigint');
});

test('completion keys retain all 64 bits', () => {
  const completionPort = Kernel32.CreateIoCompletionPort(-1n, 0n, 0n, 0);
  if (completionPort === 0n) throw new Error(`CreateIoCompletionPort failed: ${Kernel32.GetLastError()}`);

  try {
    const completionKey = 0x1234_5678_9abc_def0n;
    const transferred = Buffer.alloc(0x04);
    const receivedKey = Buffer.alloc(0x08);
    const overlapped = Buffer.alloc(0x08);

    expect(Kernel32.PostQueuedCompletionStatus(completionPort, 0, completionKey, null)).toBe(1);
    expect(Kernel32.GetQueuedCompletionStatus(completionPort, transferred.ptr, receivedKey.ptr, overlapped.ptr, 0)).toBe(1);
    expect(receivedKey.readBigUInt64LE(0)).toBe(completionKey);
  } finally {
    if (Kernel32.CloseHandle(completionPort) === 0) throw new Error(`CloseHandle failed: ${Kernel32.GetLastError()}`);
  }
});

test('BOOLEAN returns decode the one-byte result', () => {
  const lock = Buffer.alloc(0x08);
  const acquired = Kernel32.TryAcquireSRWLockExclusive(lock.ptr);

  try {
    expect(acquired).toBe(1);
  } finally {
    if (acquired !== 0) Kernel32.ReleaseSRWLockExclusive(lock.ptr);
  }
});

test('callback context retains all 64 bits', () => {
  const context = 0x1234_5678_9abc_def0n;
  let receivedContext = 0n;
  const callback = new JSCallback(
    (horizontal: number, vertical: number, callbackContext: bigint) => {
      receivedContext = callbackContext;
    },
    { args: [FFIType.i32, FFIType.i32, FFIType.u64], returns: FFIType.void },
  );

  try {
    if (callback.ptr === null) throw new Error('Callback is closed');
    expect(GDI32.LineDDA(0, 0, 1, 1, callback.ptr, context)).toBe(1);
    expect(receivedContext).toBe(context);
  } finally {
    callback.close();
  }
});

test('UINT error sentinels remain unsigned', () => {
  expect(User32.GetMenuDefaultItem(0n, 0, 0)).toBe(0xffff_ffff);
});
