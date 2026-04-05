/**
 * Mouse Stalker - A fun demo showcasing User32 FFI bindings
 *
 * This creates a small tooltip-style window that follows your mouse cursor
 * around the screen, displaying the current mouse position coordinates.
 *
 * Demonstrates:
 * - Window creation with extended styles (layered, topmost, transparent)
 * - Real-time mouse position tracking
 * - Window positioning and updates
 * - Message loop basics
 * - Cleanup with proper resource management
 *
 * Press Ctrl+C in the terminal to exit.
 */

import '../runtime/extensions';
import User32 from '../structs/User32';
import { ExtendedWindowStyles, ShowWindowCommand, WindowStyles } from '../types/User32';

import type { Pointer } from 'bun:ffi';

// Null handle (bigint zero) for optional HWND parameters
const NULL = 0n;
// Null pointer for LPVOID parameters
const NULL_PTR = null as unknown as Pointer;

// UTF-16LE encoded null-terminated strings
const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Allocate buffers for our window class and title
const windowTitle = encode('🐱 Mouse Stalker');

// POINT structure: { x: i32, y: i32 }
const pointBuffer = new Int32Array(2);

console.log('🖱️  Mouse Stalker - Starting...');
console.log('   Press Ctrl+C to exit\n');

// Create a layered, topmost, tool window that doesn't show in taskbar
const hwnd = User32.CreateWindowExW(
  ExtendedWindowStyles.WS_EX_LAYERED |
    ExtendedWindowStyles.WS_EX_TOPMOST |
    ExtendedWindowStyles.WS_EX_TOOLWINDOW |
    ExtendedWindowStyles.WS_EX_NOACTIVATE,
  encode('STATIC').ptr, // Use built-in STATIC class
  windowTitle.ptr,
  WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE,
  0, // X - will be updated
  0, // Y - will be updated
  200, // Width
  40, // Height
  NULL, // No parent
  NULL, // No menu
  NULL, // Default instance
  NULL_PTR // No extra params (lpParam is a Pointer, not a handle)
);

if (!hwnd) {
  console.error('❌ Failed to create window');
  process.exit(1);
}

console.log(`✅ Window created: ${hwnd}`);

// Set window transparency (alpha = 220 for slight transparency)
User32.SetLayeredWindowAttributes(
  hwnd,
  0, // Color key (unused with LWA_ALPHA)
  220, // Alpha (0-255)
  0x02 // LWA_ALPHA flag
);

// Show the window
User32.ShowWindow(hwnd, ShowWindowCommand.SW_SHOWNOACTIVATE);

// Track previous position to avoid unnecessary updates
let prevX = -1;
let prevY = -1;

// Update function - moves window to follow cursor
const updatePosition = () => {
  // Get current cursor position
  User32.GetCursorPos(pointBuffer.ptr);
  const x = pointBuffer[0]!;
  const y = pointBuffer[1]!;

  // Only update if position changed
  if (x !== prevX || y !== prevY) {
    // Offset window slightly from cursor
    const windowX = x + 20;
    const windowY = y + 20;

    // Move the window (SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE = 0x0001 | 0x0004 | 0x0010)
    User32.SetWindowPos(hwnd, NULL, windowX, windowY, 0, 0, 0x0015);

    // Update window title with coordinates
    const newTitle = encode(`🖱️ X: ${x}, Y: ${y}`);
    User32.SetWindowTextW(hwnd, newTitle.ptr);

    prevX = x;
    prevY = y;
  }
};

// Cleanup handler
const cleanup = () => {
  console.log('\n🧹 Cleaning up...');
  if (hwnd) {
    User32.DestroyWindow(hwnd);
    console.log('✅ Window destroyed');
  }
  process.exit(0);
};

// Handle Ctrl+C gracefully
process.on('SIGINT', cleanup);

// Simple polling loop (in a real app, you'd use a proper message loop)
console.log('🎯 Tracking mouse position...\n');

setInterval(() => {
  try {
    updatePosition();
  } catch (e) {
    console.error('Error:', e);
    cleanup();
  }
}, 16); // ~60fps
