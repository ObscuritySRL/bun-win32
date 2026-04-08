/**
 * Mouse Trail - A tooltip overlay that follows the cursor, showing coordinates
 * and identifying the window beneath it.
 *
 * Creates a WS_EX_TOPMOST | WS_EX_TOOLWINDOW overlay using the built-in "STATIC"
 * window class. A SetTimer-based periodic callback polls GetCursorPos for the
 * mouse position, uses WindowFromPoint to find the window under the cursor,
 * retrieves its title with GetWindowTextW, then repositions the overlay with
 * SetWindowPos and updates the displayed text with SetWindowTextW.
 *
 * Demonstrates:
 * - CreateWindowExW with WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_LAYERED
 * - SetLayeredWindowAttributes for transparency
 * - SetTimer / KillTimer for periodic updates
 * - GetCursorPos, WindowFromPoint, GetWindowTextW
 * - SetWindowPos, SetWindowTextW for live updates
 * - JSCallback for a WndProc message handler
 *
 * Run: bun run example/mouse-trail.ts
 */

import User32 from '../index';
import { ExtendedWindowStyles, ShowWindowCommand, WindowStyles } from '../index';
import { JSCallback } from 'bun:ffi';
import type { Pointer } from 'bun:ffi';

const NULL = 0n;
const NULL_PTR = null as unknown as Pointer;
const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

const WM_DESTROY = 0x0002;
const WM_TIMER = 0x0113;
const WM_CLOSE = 0x0010;
const TIMER_ID = 1n;
const UPDATE_INTERVAL_MS = 50;

const SWP_NOSIZE = 0x0001;
const SWP_NOZORDER = 0x0004;
const SWP_NOACTIVATE = 0x0010;

const OVERLAY_WIDTH = 420;
const OVERLAY_HEIGHT = 50;

console.log('=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=');
console.log('        MOUSE TRAIL - Cursor Detective');
console.log('=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=');
console.log('');
console.log('A tooltip follows your mouse, revealing the');
console.log('window lurking beneath the cursor.');
console.log('');
console.log('Press Ctrl+C in the terminal to exit.');
console.log('');

const pointBuffer = new Int32Array(2);
const titleBuffer = Buffer.alloc(512);

let overlayHwnd = NULL;

const wndProc = new JSCallback(
  (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
    if (msg === WM_TIMER && wParam === TIMER_ID) {
      User32.GetCursorPos(pointBuffer.ptr);
      const cursorX = pointBuffer[0]!;
      const cursorY = pointBuffer[1]!;

      // Pack x,y into a single 64-bit value for WindowFromPoint (POINT as two 32-bit ints packed)
      const packedPoint = BigInt(cursorX) | (BigInt(cursorY) << 32n);
      const windowUnderCursor = User32.WindowFromPoint(packedPoint);

      let windowTitle = '(none)';
      if (windowUnderCursor && windowUnderCursor !== hWnd) {
        const length = User32.GetWindowTextW(windowUnderCursor, titleBuffer.ptr, 256);
        if (length > 0) {
          windowTitle = titleBuffer.subarray(0, length * 2).toString('utf16le');
          if (windowTitle.length > 40) {
            windowTitle = windowTitle.substring(0, 37) + '...';
          }
        } else {
          windowTitle = `(handle: ${windowUnderCursor})`;
        }
      }

      const displayText = `[${cursorX}, ${cursorY}]  ${windowTitle}`;
      User32.SetWindowTextW(hWnd, encode(displayText).ptr);

      // Position the overlay near the cursor, offset to the lower-right
      const overlayX = cursorX + 16;
      const overlayY = cursorY + 20;
      User32.SetWindowPos(hWnd, NULL, overlayX, overlayY, 0, 0, SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE);

      return 0n;
    }

    if (msg === WM_CLOSE) {
      User32.KillTimer(hWnd, TIMER_ID);
      User32.DestroyWindow(hWnd);
      return 0n;
    }

    if (msg === WM_DESTROY) {
      User32.PostQuitMessage(0);
      return 0n;
    }

    return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
  },
  {
    args: ['u64', 'u32', 'u64', 'i64'],
    returns: 'i64',
  },
);

// Register a custom window class so we can use our WndProc
const className = encode('MouseTrailOverlay');

// WNDCLASSEXW is 80 bytes on x64:
// cbSize(4) + style(4) + lpfnWndProc(8) + cbClsExtra(4) + cbWndExtra(4) +
// hInstance(8) + hIcon(8) + hCursor(8) + hbrBackground(8) + lpszMenuName(8) +
// lpszClassName(8) + hIconSm(8) = 80
const wndClassBuf = Buffer.alloc(80);
const wndClassView = new DataView(wndClassBuf.buffer);
wndClassView.setUint32(0, 80, true); // cbSize
wndClassView.setUint32(4, 0, true); // style
wndClassBuf.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
wndClassView.setInt32(16, 0, true); // cbClsExtra
wndClassView.setInt32(20, 0, true); // cbWndExtra
wndClassBuf.writeBigUInt64LE(0n, 24); // hInstance
wndClassBuf.writeBigUInt64LE(0n, 32); // hIcon
wndClassBuf.writeBigUInt64LE(0n, 40); // hCursor
wndClassBuf.writeBigUInt64LE(0n, 48); // hbrBackground (we'll use system color)
wndClassBuf.writeBigUInt64LE(0n, 56); // lpszMenuName
wndClassBuf.writeBigUInt64LE(BigInt(className.ptr), 64); // lpszClassName
wndClassBuf.writeBigUInt64LE(0n, 72); // hIconSm

const classAtom = User32.RegisterClassExW(wndClassBuf.ptr);
if (!classAtom) {
  console.error('Failed to register window class');
  process.exit(1);
}
console.log(`Window class registered (atom: ${classAtom})`);

// Create the overlay window
overlayHwnd = User32.CreateWindowExW(
  ExtendedWindowStyles.WS_EX_TOPMOST | ExtendedWindowStyles.WS_EX_TOOLWINDOW | ExtendedWindowStyles.WS_EX_LAYERED | ExtendedWindowStyles.WS_EX_NOACTIVATE,
  className.ptr,
  encode('Mouse Trail Starting...').ptr,
  WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE,
  100,
  100,
  OVERLAY_WIDTH,
  OVERLAY_HEIGHT,
  NULL,
  NULL,
  NULL,
  NULL_PTR,
);

if (!overlayHwnd) {
  console.error('Failed to create overlay window');
  process.exit(1);
}

console.log(`Overlay window created (hwnd: ${overlayHwnd})`);

// Make it semi-transparent
User32.SetLayeredWindowAttributes(overlayHwnd, 0, 200, 0x02); // LWA_ALPHA
User32.ShowWindow(overlayHwnd, ShowWindowCommand.SW_SHOWNOACTIVATE);
User32.UpdateWindow(overlayHwnd);

// Start the periodic timer
const timerId = User32.SetTimer(overlayHwnd, TIMER_ID, UPDATE_INTERVAL_MS, null);
if (!timerId) {
  console.error('Failed to create timer');
  User32.DestroyWindow(overlayHwnd);
  process.exit(1);
}

console.log(`Timer started (interval: ${UPDATE_INTERVAL_MS}ms)`);
console.log('');
console.log('The overlay is now following your mouse!');
console.log('');

// Cleanup handler
const cleanup = () => {
  console.log('\nShutting down Mouse Trail...');
  if (overlayHwnd) {
    User32.KillTimer(overlayHwnd, TIMER_ID);
    User32.DestroyWindow(overlayHwnd);
  }
  User32.UnregisterClassW(className.ptr, NULL);
  wndProc.close();
  console.log('Cleanup complete.');
  process.exit(0);
};

process.on('SIGINT', cleanup);

// Message loop
const msgBuffer = Buffer.alloc(48);

while (true) {
  const result = User32.GetMessageW(msgBuffer.ptr, NULL, 0, 0);
  if (result <= 0) break;
  User32.TranslateMessage(msgBuffer.ptr);
  User32.DispatchMessageW(msgBuffer.ptr);
}

cleanup();
