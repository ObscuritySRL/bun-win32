/**
 * Animated Spirograph Pattern
 *
 * Draws a spirograph (epitrochoid) curve incrementally in a Win32 window using GDI
 * pen-based line drawing. The curve is defined by the parametric equations:
 *
 *   x(t) = (R - r) * cos(t) + d * cos((R - r) / r * t)
 *   y(t) = (R - r) * sin(t) - d * sin((R - r) / r * t)
 *
 * where R is the fixed circle radius, r is the rolling circle radius, and d is the
 * pen offset from the rolling circle center. Different ratios of R/r produce curves
 * with varying numbers of petals and complexity.
 *
 * The animation uses a Win32 timer (SetTimer) to add a batch of line segments each
 * tick. Pens cycle through a rainbow palette so the curve builds up in vivid color.
 *
 * Cross-package usage:
 *   - GDI32: CreatePen, SelectObject, MoveToEx, LineTo, DeleteObject
 *   - User32: CreateWindowExW, SetTimer, GetDC, ReleaseDC, message loop
 *   - Kernel32: GetModuleHandleW
 *
 * Run with: bun run example/spirograph.ts
 */

import { JSCallback, FFIType, ptr } from 'bun:ffi';
import Gdi32 from '../index';
import User32, {
  WindowStyles,
  WindowLongIndex,
  ShowWindowCommand,
  PeekMessageRemoveFlag,
  SystemMetric,
} from '@bun-win32/user32';
import Kernel32 from '@bun-win32/kernel32';

const WINDOW_WIDTH = 800;
const WINDOW_HEIGHT = 800;
const TIMER_ID = 1n;
const TIMER_INTERVAL_MS = 16;
const POINTS_PER_TICK = 40;

const WM_CLOSE = 0x0010;
const WM_DESTROY = 0x0002;
const WM_QUIT = 0x0012;
const PS_SOLID = 0;
const MSG_SIZE_BYTES = 48;

// Spirograph geometry parameters
const FIXED_CIRCLE_RADIUS = 300; // R: radius of the outer fixed circle
const ROLLING_CIRCLE_RADIUS = 113; // r: radius of the inner rolling circle
const PEN_OFFSET = 200; // d: distance of the pen from the rolling circle center
const TOTAL_POINTS = 20000; // total line segments in the complete curve
const T_STEP = 0.015; // parameter increment per point

// Rainbow palette for cycling pen colors
const RAINBOW_COLORS = [
  0x000000ff, // red      (COLORREF is 0x00BBGGRR)
  0x000080ff, // orange
  0x0000d0ff, // gold
  0x0000ff00, // green
  0x00ffff00, // cyan
  0x00ff4000, // blue
  0x00ff0080, // indigo
  0x00ff00ff, // magenta
];

let shouldClose = false;
let currentPointIndex = 0;
let windowHandle = 0n;
let wndProcCallback: JSCallback | null = null;

// Center offset so the spirograph is drawn in the middle of the client area
const centerX = WINDOW_WIDTH / 2;
const centerY = WINDOW_HEIGHT / 2;

function spirographX(t: number): number {
  const radiusDiff = FIXED_CIRCLE_RADIUS - ROLLING_CIRCLE_RADIUS;
  return radiusDiff * Math.cos(t) + PEN_OFFSET * Math.cos((radiusDiff / ROLLING_CIRCLE_RADIUS) * t);
}

function spirographY(t: number): number {
  const radiusDiff = FIXED_CIRCLE_RADIUS - ROLLING_CIRCLE_RADIUS;
  return radiusDiff * Math.sin(t) - PEN_OFFSET * Math.sin((radiusDiff / ROLLING_CIRCLE_RADIUS) * t);
}

function drawSpirographSegments(hwnd: bigint): void {
  if (currentPointIndex >= TOTAL_POINTS) return;

  const hdc = User32.GetDC(hwnd);
  if (!hdc) return;

  const endIndex = Math.min(currentPointIndex + POINTS_PER_TICK, TOTAL_POINTS);

  for (let i = currentPointIndex; i < endIndex; i++) {
    const colorIndex = Math.floor(i / (TOTAL_POINTS / RAINBOW_COLORS.length)) % RAINBOW_COLORS.length;
    const color = RAINBOW_COLORS[colorIndex];

    const pen = Gdi32.CreatePen(PS_SOLID, 2, color);
    const oldPen = Gdi32.SelectObject(hdc, pen);

    // Move to the current point
    const t0 = i * T_STEP;
    const x0 = Math.round(centerX + spirographX(t0));
    const y0 = Math.round(centerY + spirographY(t0));
    Gdi32.MoveToEx(hdc, x0, y0, null);

    // Draw a line to the next point
    const t1 = (i + 1) * T_STEP;
    const x1 = Math.round(centerX + spirographX(t1));
    const y1 = Math.round(centerY + spirographY(t1));
    Gdi32.LineTo(hdc, x1, y1);

    Gdi32.SelectObject(hdc, oldPen);
    Gdi32.DeleteObject(pen);
  }

  currentPointIndex = endIndex;

  User32.ReleaseDC(hwnd, hdc);

  if (currentPointIndex >= TOTAL_POINTS) {
    console.log('Spirograph complete.');
  }
}

function createWndProc(): bigint {
  const callback = new JSCallback(
    (hwnd: bigint, msg: number, wParam: number | bigint, lParam: number | bigint): bigint => {
      if (msg === WM_CLOSE || msg === WM_DESTROY) {
        shouldClose = true;
        User32.PostQuitMessage(0);
        return 0n;
      }
      return BigInt(User32.DefWindowProcW(hwnd, msg, BigInt(wParam), BigInt(lParam)));
    },
    { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
  );
  wndProcCallback = callback;
  if (!callback.ptr) throw new Error('Failed to create window procedure callback');
  return BigInt(callback.ptr);
}

function createWindow(): bigint {
  const hInstance = Kernel32.GetModuleHandleW(null!);

  // Center the window on screen
  const screenWidth = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
  const screenHeight = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);
  const x = Math.floor((screenWidth - WINDOW_WIDTH) / 2);
  const y = Math.floor((screenHeight - WINDOW_HEIGHT) / 2);

  // Use the built-in "STATIC" window class to avoid RegisterClassExW
  const hwnd = User32.CreateWindowExW(
    0,
    Buffer.from('STATIC\0', 'utf16le').ptr,
    Buffer.from('Spirograph - @bun-win32/gdi32\0', 'utf16le').ptr,
    WindowStyles.WS_OVERLAPPEDWINDOW | WindowStyles.WS_VISIBLE,
    x,
    y,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    0n,
    0n,
    hInstance,
    null,
  );
  if (!hwnd) throw new Error('CreateWindowExW failed');

  // Replace the default window procedure with our own
  const wndProcPtr = createWndProc();
  User32.SetWindowLongPtrW(hwnd, WindowLongIndex.GWL_WNDPROC, wndProcPtr);

  User32.ShowWindow(hwnd, ShowWindowCommand.SW_SHOW);
  User32.UpdateWindow(hwnd);

  return hwnd;
}

function processMessages(): boolean {
  const msgBuffer = new ArrayBuffer(MSG_SIZE_BYTES);
  const msgPtr = ptr(new Uint8Array(msgBuffer));
  const msgView = new DataView(msgBuffer);

  while (User32.PeekMessageW(msgPtr, 0n, 0, 0, PeekMessageRemoveFlag.PM_REMOVE)) {
    const message = msgView.getUint32(8, true);
    if (message === WM_QUIT) return false;

    User32.TranslateMessage(msgPtr);
    User32.DispatchMessageW(msgPtr);
  }

  return !shouldClose;
}

function main(): void {
  console.log('Creating spirograph window...');
  windowHandle = createWindow();

  // Set a timer that fires every TIMER_INTERVAL_MS to draw the next batch of points
  User32.SetTimer(windowHandle, TIMER_ID, TIMER_INTERVAL_MS, null);
  console.log('Drawing spirograph pattern (close the window to exit)...');

  // Fill the background with black before drawing begins
  const hdc = User32.GetDC(windowHandle);
  if (hdc) {
    const blackBrush = Gdi32.CreateSolidBrush(0x00000000);
    // Fill client area via a simple rectangle select + fill isn't available, so we just
    // let the default background show through. The STATIC class background is white by
    // default, which works fine as a canvas backdrop.
    Gdi32.DeleteObject(blackBrush);
    User32.ReleaseDC(windowHandle, hdc);
  }

  while (processMessages()) {
    drawSpirographSegments(windowHandle);

    // Yield to the OS to keep the window responsive
    Bun.sleepSync(TIMER_INTERVAL_MS);
  }

  // Cleanup
  User32.KillTimer(windowHandle, TIMER_ID);
  if (wndProcCallback) wndProcCallback.close();

  console.log('Done!');
}

main();
