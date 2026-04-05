/**
 * Bouncing Circle Example
 *
 * Demonstrates basic OpenGL rendering with @bun-win32/opengl32.
 * Creates a 640x480 window and draws a circle that bounces around.
 *
 * Run with: bun run example/bouncingCircle.ts
 */

import { dlopen, FFIType, ptr, JSCallback } from 'bun:ffi';
import OpenGL32, { GLenum } from '../index';

// Window dimensions
const HEIGHT = 480,
  WIDTH = 640;

// Circle properties
const CIRCLE_RADIUS = 50,
  CIRCLE_SEGMENTS = 32,
  MIN_SPEED = 100,
  MAX_SPEED = 400;

let circleSpeedX = 200,
  circleSpeedY = 200,
  circleDirectionX = 1, // 1 = right, -1 = left
  circleDirectionY = 1, // 1 = down, -1 = up
  circleX = WIDTH / 2,
  circleY = HEIGHT / 2;

// Randomize speed within the allowed range
function randomizeSpeed(): number {
  return MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
}

// -----------------------------------------------------------------------------
// Minimal Win32 API bindings (User32 + GDI32)
// -----------------------------------------------------------------------------

const user32 = dlopen('user32.dll', {
  AdjustWindowRectEx: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
  CreateWindowExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u64 }, // prettier-ignore
  DefWindowProcW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
  DispatchMessageW: { args: [FFIType.ptr], returns: FFIType.i64 },
  GetDC: { args: [FFIType.u64], returns: FFIType.u64 },
  GetSystemMetrics: { args: [FFIType.i32], returns: FFIType.i32 },
  PeekMessageW: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
  PostQuitMessage: { args: [FFIType.i32], returns: FFIType.void },
  ReleaseDC: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
  SetWindowLongPtrW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.ptr },
  ShowWindow: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
  TranslateMessage: { args: [FFIType.ptr], returns: FFIType.i32 },
  UpdateWindow: { args: [FFIType.u64], returns: FFIType.i32 },
});

const gdi32 = dlopen('gdi32.dll', {
  ChoosePixelFormat: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  SetPixelFormat: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
  SwapBuffers: { args: [FFIType.u64], returns: FFIType.i32 },
});

const kernel32 = dlopen('kernel32.dll', {
  GetLastError: { args: [], returns: FFIType.u32 },
  GetModuleHandleW: { args: [FFIType.ptr], returns: FFIType.u64 },
});

// Win32 enums
const enum PM {
  PM_REMOVE = 0x0001,
}

const enum SW {
  SW_SHOW = 5,
}

const enum WindowMessage {
  WM_CLOSE = 0x0010,
  WM_DESTROY = 0x0002,
  WM_QUIT = 0x0012,
}

const enum WindowStyle {
  WS_OVERLAPPEDWINDOW = 0x00cf0000,
  WS_VISIBLE = 0x10000000,
}

// -----------------------------------------------------------------------------
// Window procedure and callbacks
// -----------------------------------------------------------------------------

// Store the window procedure callback to prevent GC
let wndProcCallback: JSCallback | null = null;
let shouldClose = false;

// Window procedure - handles close/destroy messages
const createWndProc = () => {
  const cb = new JSCallback(
    (hwnd: bigint, msg: number, wParam: number | bigint, lParam: number | bigint): bigint => {
      if (msg === WindowMessage.WM_CLOSE || msg === WindowMessage.WM_DESTROY) {
        shouldClose = true;
        user32.symbols.PostQuitMessage(0);
        return 0n;
      }
      return BigInt(user32.symbols.DefWindowProcW(hwnd, msg, wParam, lParam));
    },
    { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 }
  );
  wndProcCallback = cb;
  if (!cb.ptr) throw new Error('Failed to create window procedure callback');
  return cb.ptr;
};

// Pre-allocated PIXELFORMATDESCRIPTOR (same as Overlay.ts approach)
const PIXEL_FORMAT_DESCRIPTOR = Buffer.from([
  0x28, 0x00, 0x01, 0x00, 0x25, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00,
]);

// -----------------------------------------------------------------------------
// Window and OpenGL context creation
// -----------------------------------------------------------------------------

function createWindow(): { hwnd: bigint; hdc: bigint } {
  const hInstance = kernel32.symbols.GetModuleHandleW(null);

  // Calculate centered position
  const screenWidth = user32.symbols.GetSystemMetrics(0x00);
  const screenHeight = user32.symbols.GetSystemMetrics(0x01);
  const x = ((screenWidth - WIDTH) / 2) | 0;
  const y = ((screenHeight - HEIGHT) / 2) | 0;

  // Calculate window size for desired client area
  const rect = new ArrayBuffer(16);
  const rectView = new DataView(rect);
  rectView.setInt32(0, 0, true);
  rectView.setInt32(4, 0, true);
  rectView.setInt32(8, WIDTH, true);
  rectView.setInt32(12, HEIGHT, true);
  user32.symbols.AdjustWindowRectEx(ptr(new Uint8Array(rect)), WindowStyle.WS_OVERLAPPEDWINDOW, 0, 0);
  const adjustedWidth = rectView.getInt32(8, true) - rectView.getInt32(0, true);
  const adjustedHeight = rectView.getInt32(12, true) - rectView.getInt32(4, true);

  // Use built-in STATIC class (no registration needed, avoids resource leaks)
  const hwnd = user32.symbols.CreateWindowExW(
    0,
    Buffer.from('STATIC\0', 'utf16le'),
    Buffer.from('Bouncing Circle - @bun-win32/opengl32\0', 'utf16le'),
    WindowStyle.WS_OVERLAPPEDWINDOW | WindowStyle.WS_VISIBLE,
    x,
    y,
    adjustedWidth,
    adjustedHeight,
    0n, // hWndParent
    0n, // hMenu
    hInstance,
    null
  );
  if (!hwnd) throw new Error(`CreateWindowExW failed: ${kernel32.symbols.GetLastError()}`);

  // Set custom window procedure
  const wndProcPtr = createWndProc();
  if (!user32.symbols.SetWindowLongPtrW(hwnd, -4, wndProcPtr)) {
    throw new Error(`SetWindowLongPtrW failed: ${kernel32.symbols.GetLastError()}`);
  }

  const hdc = user32.symbols.GetDC(hwnd);
  if (!hdc) throw new Error(`GetDC failed: ${kernel32.symbols.GetLastError()}`);

  // Setup pixel format
  const pixelFormat = gdi32.symbols.ChoosePixelFormat(hdc, PIXEL_FORMAT_DESCRIPTOR);
  if (pixelFormat === 0) throw new Error(`ChoosePixelFormat failed: ${kernel32.symbols.GetLastError()}`);
  if (!gdi32.symbols.SetPixelFormat(hdc, pixelFormat, PIXEL_FORMAT_DESCRIPTOR)) {
    throw new Error(`SetPixelFormat failed: ${kernel32.symbols.GetLastError()}`);
  }

  user32.symbols.ShowWindow(hwnd, SW.SW_SHOW);
  user32.symbols.UpdateWindow(hwnd);

  return { hwnd, hdc };
}

function createGLContext(hdc: bigint): bigint {
  const hglrc = OpenGL32.wglCreateContext(hdc);
  if (!hglrc) throw new Error(`wglCreateContext failed: ${kernel32.symbols.GetLastError()}`);
  if (!OpenGL32.wglMakeCurrent(hdc, hglrc)) {
    throw new Error(`wglMakeCurrent failed: ${kernel32.symbols.GetLastError()}`);
  }
  return hglrc;
}

// -----------------------------------------------------------------------------
// OpenGL rendering
// -----------------------------------------------------------------------------

function initGL(): void {
  // Set up orthographic projection for 2D rendering
  OpenGL32.glMatrixMode(GLenum.GL_PROJECTION);
  OpenGL32.glLoadIdentity();
  OpenGL32.glOrtho(0, WIDTH, HEIGHT, 0, -1, 1);

  OpenGL32.glMatrixMode(GLenum.GL_MODELVIEW);
  OpenGL32.glLoadIdentity();

  // Set clear color to dark blue
  OpenGL32.glClearColor(0.1, 0.1, 0.2, 1.0);

  // Enable smooth shading
  OpenGL32.glShadeModel(GLenum.GL_SMOOTH);
}

function drawCircle(cx: number, cy: number, radius: number): void {
  OpenGL32.glBegin(GLenum.GL_TRIANGLE_FAN);

  // Center vertex (white)
  OpenGL32.glColor3f(1.0, 1.0, 1.0);
  OpenGL32.glVertex2f(cx, cy);

  // Outer vertices (gradient to orange)
  for (let i = 0; i <= CIRCLE_SEGMENTS; i++) {
    const angle = (i / CIRCLE_SEGMENTS) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    // Color gradient based on angle
    const r = 1.0;
    const g = 0.5 + Math.sin(angle) * 0.3;
    const b = 0.2;
    OpenGL32.glColor3f(r, g, b);
    OpenGL32.glVertex2f(x, y);
  }

  OpenGL32.glEnd();
}

function render(): void {
  OpenGL32.glClear(GLenum.GL_COLOR_BUFFER_BIT);

  OpenGL32.glLoadIdentity();

  // Draw the bouncing circle
  drawCircle(circleX, circleY, CIRCLE_RADIUS);

  OpenGL32.glFlush();
}

function update(deltaTime: number): void {
  // Move circle based on time (deltaTime is in seconds)
  circleX += circleDirectionX * circleSpeedX * deltaTime;
  circleY += circleDirectionY * circleSpeedY * deltaTime;

  // Bounce off walls (X axis)
  if (circleX + CIRCLE_RADIUS >= WIDTH) {
    circleX = WIDTH - CIRCLE_RADIUS;
    circleDirectionX = -1;
    circleSpeedX = randomizeSpeed();
    circleSpeedY = randomizeSpeed();
  } else if (circleX - CIRCLE_RADIUS <= 0) {
    circleX = CIRCLE_RADIUS;
    circleDirectionX = 1;
    circleSpeedX = randomizeSpeed();
    circleSpeedY = randomizeSpeed();
  }

  // Bounce off walls (Y axis)
  if (circleY + CIRCLE_RADIUS >= HEIGHT) {
    circleY = HEIGHT - CIRCLE_RADIUS;
    circleDirectionY = -1;
    circleSpeedX = randomizeSpeed();
    circleSpeedY = randomizeSpeed();
  } else if (circleY - CIRCLE_RADIUS <= 0) {
    circleY = CIRCLE_RADIUS;
    circleDirectionY = 1;
    circleSpeedX = randomizeSpeed();
    circleSpeedY = randomizeSpeed();
  }
}

// -----------------------------------------------------------------------------
// Main loop
// -----------------------------------------------------------------------------

function processMessages(): boolean {
  const msg = new ArrayBuffer(48); // MSG structure
  const msgPtr = ptr(new Uint8Array(msg));

  while (user32.symbols.PeekMessageW(msgPtr, 0n, 0, 0, PM.PM_REMOVE)) {
    const msgView = new DataView(msg);
    const message = msgView.getUint32(8, true);

    if (message === WindowMessage.WM_QUIT) {
      return false;
    }

    user32.symbols.TranslateMessage(msgPtr);
    user32.symbols.DispatchMessageW(msgPtr);
  }

  return !shouldClose;
}

function main(): void {
  console.log('Creating window...');
  const { hwnd, hdc } = createWindow();

  console.log('Creating OpenGL context...');
  const hglrc = createGLContext(hdc);

  // Preload WGL extensions for VSync control (optional)
  OpenGL32.PreloadExtensions(['wglSwapIntervalEXT']);
  OpenGL32.wglSwapIntervalEXT(0); // 0 = VSync off, 1 = VSync on

  console.log('Initializing OpenGL...');
  initGL();

  console.log('Starting render loop...');
  console.log('Press Ctrl+C or close the window to exit.\n');

  // Main loop
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTime = 0;

  while (processMessages()) {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // FPS counter
    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
      process.stdout.write(`\rFPS: ${frameCount}  `);
      frameCount = 0;
      fpsTime = 0;
    }

    update(deltaTime);
    render();
    gdi32.symbols.SwapBuffers(hdc);
  }

  console.log(); // Newline after FPS output

  // Cleanup
  console.log('Cleaning up...');
  OpenGL32.wglMakeCurrent(0n, 0n);
  OpenGL32.wglDeleteContext(hglrc);
  user32.symbols.ReleaseDC(hwnd, hdc);

  if (wndProcCallback) {
    wndProcCallback.close();
  }

  console.log('Done!');
}

main();
