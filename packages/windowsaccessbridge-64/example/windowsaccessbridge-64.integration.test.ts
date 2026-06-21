/**
 * Java Access Bridge — FFI Integration Test
 *
 * Exercises the real `WindowsAccessBridge-64.dll` exports end-to-end: it initializes
 * the bridge, queries event/version state, and enumerates every top-level window to
 * classify Java windows via `isJavaWindow`. When a Java (Swing/AWT) window is present
 * it deep-dives into the AccessibleContext tree and decodes an `AccessibleContextInfo`
 * struct; when no Java app is running the deep-dive is skipped so the suite still passes.
 *
 * APIs demonstrated:
 *   - Windows_run                     (initialize the Access Bridge)
 *   - getEventsWaiting                (pending event count)
 *   - isJavaWindow                    (classify a top-level HWND)
 *   - getAccessibleContextFromHWND    (HWND -> vmID + AccessibleContext, out-params)
 *   - getAccessibleContextInfo        (decode the AccessibleContextInfo struct)
 *
 * APIs demonstrated (User32, cross-package):
 *   - EnumWindows                     (iterate top-level windows via JSCallback)
 *   - IsWindowVisible, GetWindowTextW (filter + label windows)
 *   - PeekMessageW / TranslateMessage / DispatchMessageW (pump the JVM registration handshake)
 *
 * Run: bun test ./example/windowsaccessbridge-64.integration.test.ts
 */

import { describe, expect, test } from 'bun:test';
import { JSCallback } from 'bun:ffi';

import User32 from '@bun-win32/user32';
import WindowsAccessBridge, { MAX_STRING_SIZE, SHORT_STRING_SIZE } from '@bun-win32/windowsaccessbridge-64';

WindowsAccessBridge.Preload();

// AccessibleContextInfo field byte offsets (x64, wchar_t = 2 bytes).
const NAME_BYTES = MAX_STRING_SIZE * 2; // wchar[1024]
const ROLE_BYTES = SHORT_STRING_SIZE * 2; // wchar[256]
const OFFSET_NAME = 0;
const OFFSET_ROLE = NAME_BYTES * 2; // after name + description
const OFFSET_CHILDREN_COUNT = NAME_BYTES * 2 + ROLE_BYTES * 4 + 4; // + 4 role/state strings + indexInParent

function readWide(buffer: Buffer, offset: number, byteLength: number): string {
  return buffer.toString('utf16le', offset, offset + byteLength).replace(/\0.*$/s, '');
}

// Pump the message queue so any running Java VM completes its registration handshake
// with this process before we classify windows (Windows_run triggers that handshake).
function pumpMessages(durationMilliseconds: number): void {
  const message = Buffer.alloc(48); // sizeof(MSG) on x64
  const startedAt = performance.now();
  do {
    while (User32.PeekMessageW(message.ptr, 0n, 0, 0, 0x0001)) {
      User32.TranslateMessage(message.ptr);
      User32.DispatchMessageW(message.ptr);
    }
    Bun.sleepSync(8);
  } while (performance.now() - startedAt < durationMilliseconds);
}

function enumerateTopLevelWindows(): bigint[] {
  const windows: bigint[] = [];
  const callback = new JSCallback(
    (hwnd: bigint): number => {
      windows.push(hwnd);
      return 1;
    },
    { args: ['u64', 'i64'], returns: 'i32' },
  );
  User32.EnumWindows(callback.ptr!, 0n);
  callback.close();
  return windows;
}

describe('WindowsAccessBridge-64 FFI', () => {
  test('Windows_run initializes the bridge without throwing', () => {
    expect(() => WindowsAccessBridge.Windows_run()).not.toThrow();
  });

  test('getEventsWaiting returns a non-negative integer', () => {
    const waiting = WindowsAccessBridge.getEventsWaiting();
    expect(typeof waiting).toBe('number');
    expect(waiting).toBeGreaterThanOrEqual(0);
  });

  test('isJavaWindow returns a falsy BOOL for non-Java handles', () => {
    expect(WindowsAccessBridge.isJavaWindow(0n)).toBe(0);
    expect(WindowsAccessBridge.isJavaWindow(User32.GetDesktopWindow())).toBe(0);
  });

  test('getAccessibleContextFromHWND leaves out-params zeroed for a non-Java window', () => {
    const vmIdBuffer = Buffer.alloc(4);
    const contextBuffer = Buffer.alloc(8);
    const got = WindowsAccessBridge.getAccessibleContextFromHWND(User32.GetDesktopWindow(), vmIdBuffer.ptr, contextBuffer.ptr);
    expect(got).toBe(0);
    expect(vmIdBuffer.readInt32LE(0)).toBe(0);
    expect(contextBuffer.readBigUInt64LE(0)).toBe(0n);
  });

  test('enumerating windows classifies every HWND and (if present) decodes a Java context', () => {
    pumpMessages(1200);
    const windows = enumerateTopLevelWindows();
    expect(windows.length).toBeGreaterThan(0);

    const javaWindows: bigint[] = [];
    for (const hwnd of windows) {
      const isJava = WindowsAccessBridge.isJavaWindow(hwnd);
      expect(isJava === 0 || isJava === 1).toBe(true);
      if (isJava === 1) javaWindows.push(hwnd);
    }

    if (javaWindows.length === 0) {
      console.log('  (no Java/Swing window open — deep-dive skipped; bridge calls verified)');
      return;
    }

    const vmIdBuffer = Buffer.alloc(4);
    const contextBuffer = Buffer.alloc(8);
    const ok = WindowsAccessBridge.getAccessibleContextFromHWND(javaWindows[0], vmIdBuffer.ptr, contextBuffer.ptr);
    expect(ok).toBe(1);

    const vmID = vmIdBuffer.readInt32LE(0);
    const accessibleContext = contextBuffer.readBigUInt64LE(0);
    expect(accessibleContext).not.toBe(0n);

    const info = Buffer.alloc(6188); // sizeof(AccessibleContextInfo)
    const decoded = WindowsAccessBridge.getAccessibleContextInfo(vmID, accessibleContext, info.ptr);
    expect(decoded).toBe(1);

    const name = readWide(info, OFFSET_NAME, NAME_BYTES);
    const role = readWide(info, OFFSET_ROLE, ROLE_BYTES);
    const childrenCount = info.readInt32LE(OFFSET_CHILDREN_COUNT);
    console.log(`  Java root: role="${role}" name="${name}" children=${childrenCount}`);
    expect(role.length).toBeGreaterThan(0);

    WindowsAccessBridge.releaseJavaObject(vmID, accessibleContext);
  });
});
