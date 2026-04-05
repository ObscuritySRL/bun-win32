/**
 * N-Pendulum Chaos Demonstration
 *
 * Shows multiple identical pendulums with tiny initial angle differences.
 * Watch how small deviations lead to completely different trajectories!
 * This beautifully demonstrates the "butterfly effect" in chaotic systems.
 *
 * Run with: bun run example/nPendulum.ts
 */

import { dlopen, FFIType, ptr, JSCallback } from 'bun:ffi';
import OpenGL32, { GLenum } from '../index';

// =============================================================================
// CONFIGURATION
// =============================================================================
const SEGMENTS_PER_PENDULUM = 2; // Number of segments in each pendulum (2 = double pendulum)
const NUM_INSTANCES = 20; // Number of pendulum instances to compare
const INITIAL_DEVIATION = 0.0000000001; // Tiny angle difference between instances (radians)

// Window dimensions
const HEIGHT = 850,
  WIDTH = 1100;

// Pendulum physics
const GRAVITY = 400;
const SEGMENT_LENGTH = Math.min(120, 400 / SEGMENTS_PER_PENDULUM);
const SEGMENT_MASS = 10;

// Trail settings
const MAX_TRAIL_LENGTH = 800;

// Pivot point
const PIVOT_X = WIDTH / 2;
const totalPendulumLength = SEGMENT_LENGTH * SEGMENTS_PER_PENDULUM;
const PIVOT_Y = HEIGHT / 2;

// -----------------------------------------------------------------------------
// Pendulum Instance Type
// -----------------------------------------------------------------------------
interface PendulumInstance {
  angles: number[];
  angularVels: number[];
  lengths: number[];
  masses: number[];
  trail: { x: number; y: number }[];
  color: { r: number; g: number; b: number };
}

// Create pendulum instances with slightly different starting angles
const pendulums: PendulumInstance[] = [];

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return { r: r + m, g: g + m, b: b + m };
}

// Initialize all pendulum instances
for (let p = 0; p < NUM_INSTANCES; p++) {
  const instance: PendulumInstance = {
    angles: [],
    angularVels: [],
    lengths: [],
    masses: [],
    trail: [],
    color: hslToRgb((p / NUM_INSTANCES) * 300, 0.9, 0.55), // Rainbow colors
  };

  for (let i = 0; i < SEGMENTS_PER_PENDULUM; i++) {
    // Start pointing up (PI) with a tiny deviation based on instance index
    // Each instance differs by INITIAL_DEVIATION radians, all in the same direction
    // Add 1 to p so the first pendulum also has some deviation (won't stay balanced)
    const baseAngle = Math.PI;
    const deviation = (p + 1) * INITIAL_DEVIATION;
    instance.angles.push(baseAngle + deviation);
    instance.angularVels.push(0);
    instance.lengths.push(SEGMENT_LENGTH);
    instance.masses.push(SEGMENT_MASS);
  }

  pendulums.push(instance);
}

// -----------------------------------------------------------------------------
// Minimal Win32 API bindings
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

let wndProcCallback: JSCallback | null = null;
let shouldClose = false;

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
    { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
  );
  wndProcCallback = cb;
  if (!cb.ptr) throw new Error('Failed to create window procedure callback');
  return cb.ptr;
};

const PIXEL_FORMAT_DESCRIPTOR = Buffer.from([
  0x28, 0x00, 0x01, 0x00, 0x25, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00,
]);

// -----------------------------------------------------------------------------
// Window and OpenGL setup
// -----------------------------------------------------------------------------

function createWindow(): { hwnd: bigint; hdc: bigint } {
  const hInstance = kernel32.symbols.GetModuleHandleW(null);
  const screenWidth = user32.symbols.GetSystemMetrics(0x00);
  const screenHeight = user32.symbols.GetSystemMetrics(0x01);
  const x = ((screenWidth - WIDTH) / 2) | 0;
  const y = ((screenHeight - HEIGHT) / 2) | 0;

  const rect = new ArrayBuffer(16);
  const rectView = new DataView(rect);
  rectView.setInt32(0, 0, true);
  rectView.setInt32(4, 0, true);
  rectView.setInt32(8, WIDTH, true);
  rectView.setInt32(12, HEIGHT, true);
  user32.symbols.AdjustWindowRectEx(ptr(new Uint8Array(rect)), WindowStyle.WS_OVERLAPPEDWINDOW, 0, 0);
  const adjustedWidth = rectView.getInt32(8, true) - rectView.getInt32(0, true);
  const adjustedHeight = rectView.getInt32(12, true) - rectView.getInt32(4, true);

  const hwnd = user32.symbols.CreateWindowExW(
    0,
    Buffer.from('STATIC\0', 'utf16le'),
    Buffer.from(`Chaos Demo - ${NUM_INSTANCES} Pendulums (${INITIAL_DEVIATION} rad difference)\0`, 'utf16le'),
    WindowStyle.WS_OVERLAPPEDWINDOW | WindowStyle.WS_VISIBLE,
    x,
    y,
    adjustedWidth,
    adjustedHeight,
    0n,
    0n,
    hInstance,
    null,
  );
  if (!hwnd) throw new Error(`CreateWindowExW failed: ${kernel32.symbols.GetLastError()}`);

  const wndProcPtr = createWndProc();
  if (!user32.symbols.SetWindowLongPtrW(hwnd, -4, wndProcPtr)) {
    throw new Error(`SetWindowLongPtrW failed: ${kernel32.symbols.GetLastError()}`);
  }

  const hdc = user32.symbols.GetDC(hwnd);
  if (!hdc) throw new Error(`GetDC failed: ${kernel32.symbols.GetLastError()}`);

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

function initGL(): void {
  OpenGL32.glMatrixMode(GLenum.GL_PROJECTION);
  OpenGL32.glLoadIdentity();
  OpenGL32.glOrtho(0, WIDTH, HEIGHT, 0, -1, 1);
  OpenGL32.glMatrixMode(GLenum.GL_MODELVIEW);
  OpenGL32.glLoadIdentity();
  OpenGL32.glClearColor(0.02, 0.02, 0.05, 1.0);
  OpenGL32.glEnable(GLenum.GL_BLEND);
  OpenGL32.glBlendFunc(GLenum.GL_SRC_ALPHA, GLenum.GL_ONE_MINUS_SRC_ALPHA);
  OpenGL32.glEnable(GLenum.GL_LINE_SMOOTH);
  OpenGL32.glLineWidth(2.0);
}

// -----------------------------------------------------------------------------
// N-Pendulum Physics using Lagrangian Mechanics
// -----------------------------------------------------------------------------

function updatePendulumInstance(p: PendulumInstance, dt: number): void {
  const n = SEGMENTS_PER_PENDULUM;
  const g = GRAVITY;

  const steps = Math.max(10, n * 5);
  const h = dt / steps;

  for (let step = 0; step < steps; step++) {
    const M: number[][] = [];
    const F: number[] = [];

    for (let i = 0; i < n; i++) {
      M[i] = [];
      for (let j = 0; j < n; j++) {
        M[i][j] = 0;
      }
      F[i] = 0;
    }

    for (let i = 0; i < n; i++) {
      let massBelow = 0;
      for (let k = i; k < n; k++) {
        massBelow += p.masses[k]!;
      }

      for (let j = 0; j < n; j++) {
        let massBelowMax = 0;
        for (let k = Math.max(i, j); k < n; k++) {
          massBelowMax += p.masses[k]!;
        }
        M[i]![j] = massBelowMax * p.lengths[i]! * p.lengths[j]! * Math.cos(p.angles[i]! - p.angles[j]!);
      }

      F[i] = -massBelow * g * p.lengths[i]! * Math.sin(p.angles[i]!);

      for (let j = 0; j < n; j++) {
        if (i !== j) {
          let massBelowMax = 0;
          for (let k = Math.max(i, j); k < n; k++) {
            massBelowMax += p.masses[k]!;
          }
          F[i]! -= massBelowMax * p.lengths[i]! * p.lengths[j]! * p.angularVels[j]! * p.angularVels[j]! * Math.sin(p.angles[i]! - p.angles[j]!);
        }
      }
    }

    const alpha = solveLinearSystem(M, F);

    for (let i = 0; i < n; i++) {
      p.angularVels[i] = p.angularVels[i]! + alpha[i]! * h;
      p.angles[i] = p.angles[i]! + p.angularVels[i]! * h;
    }
  }

  // Calculate last bob position for trail
  let x = PIVOT_X;
  let y = PIVOT_Y;
  for (let i = 0; i < n; i++) {
    x += p.lengths[i]! * Math.sin(p.angles[i]!);
    y += p.lengths[i]! * Math.cos(p.angles[i]!);
  }

  p.trail.push({ x, y });
  if (p.trail.length > MAX_TRAIL_LENGTH) {
    p.trail.shift();
  }
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;

  const aug: number[][] = [];
  for (let i = 0; i < n; i++) {
    aug[i] = [...A[i]!, b[i]!];
  }

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    let maxVal = Math.abs(aug[col]![col]!);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row]![col]!) > maxVal) {
        maxVal = Math.abs(aug[row]![col]!);
        maxRow = row;
      }
    }

    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow]!, aug[col]!];
    }

    if (Math.abs(aug[col]![col]!) < 1e-12) {
      continue;
    }

    for (let row = col + 1; row < n; row++) {
      const factor = aug[row]![col]! / aug[col]![col]!;
      for (let j = col; j <= n; j++) {
        aug[row]![j] = aug[row]![j]! - factor * aug[col]![j]!;
      }
    }
  }

  const x: number[] = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(aug[i]![i]!) < 1e-12) {
      x[i] = 0;
      continue;
    }
    x[i] = aug[i]![n]!;
    for (let j = i + 1; j < n; j++) {
      x[i] = x[i]! - aug[i]![j]! * x[j]!;
    }
    x[i] = x[i]! / aug[i]![i]!;
  }

  return x;
}

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

function drawCircle(cx: number, cy: number, radius: number, r: number, g: number, b: number, alpha: number): void {
  const segments = 16;

  OpenGL32.glBegin(GLenum.GL_TRIANGLE_FAN);
  OpenGL32.glColor4f(r, g, b, alpha);
  OpenGL32.glVertex2f(cx, cy);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    OpenGL32.glVertex2f(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  OpenGL32.glEnd();
}

function drawTrail(trail: { x: number; y: number }[], r: number, g: number, b: number): void {
  if (trail.length < 2) return;

  OpenGL32.glBegin(GLenum.GL_LINE_STRIP);
  for (let i = 0; i < trail.length; i++) {
    const t = i / trail.length;
    const alpha = t * 0.8;
    OpenGL32.glColor4f(r, g, b, alpha);
    OpenGL32.glVertex2f(trail[i]!.x, trail[i]!.y);
  }
  OpenGL32.glEnd();
}

function drawPivot(): void {
  const segments = 12;
  OpenGL32.glBegin(GLenum.GL_TRIANGLE_FAN);
  OpenGL32.glColor4f(0.5, 0.5, 0.5, 1.0);
  OpenGL32.glVertex2f(PIVOT_X, PIVOT_Y);
  OpenGL32.glColor4f(0.3, 0.3, 0.3, 1.0);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    OpenGL32.glVertex2f(PIVOT_X + Math.cos(angle) * 10, PIVOT_Y + Math.sin(angle) * 10);
  }
  OpenGL32.glEnd();
}

function drawPendulum(p: PendulumInstance): void {
  const { r, g, b } = p.color;

  // Calculate all bob positions
  const positions: { x: number; y: number }[] = [{ x: PIVOT_X, y: PIVOT_Y }];
  let x = PIVOT_X;
  let y = PIVOT_Y;
  for (let i = 0; i < SEGMENTS_PER_PENDULUM; i++) {
    x += p.lengths[i]! * Math.sin(p.angles[i]!);
    y += p.lengths[i]! * Math.cos(p.angles[i]!);
    positions.push({ x, y });
  }

  // Draw trail
  drawTrail(p.trail, r, g, b);

  // Draw arms
  OpenGL32.glLineWidth(2.5);
  OpenGL32.glBegin(GLenum.GL_LINE_STRIP);
  OpenGL32.glColor4f(r * 0.8, g * 0.8, b * 0.8, 1.0);
  for (const pos of positions) {
    OpenGL32.glVertex2f(pos.x, pos.y);
  }
  OpenGL32.glEnd();
  OpenGL32.glLineWidth(2.0);

  // Draw bobs - all same size
  const bobRadius = 8;
  for (let i = 0; i < SEGMENTS_PER_PENDULUM; i++) {
    drawCircle(positions[i + 1]!.x, positions[i + 1]!.y, bobRadius, r, g, b, 1.0);
  }
}

function render(): void {
  OpenGL32.glClear(GLenum.GL_COLOR_BUFFER_BIT);
  OpenGL32.glLoadIdentity();

  // Draw all pendulums
  for (let i = 0; i < pendulums.length; i++) {
    drawPendulum(pendulums[i]!);
  }

  // Draw pivot on top
  drawPivot();

  OpenGL32.glFlush();
}

// -----------------------------------------------------------------------------
// Main loop
// -----------------------------------------------------------------------------

function processMessages(): boolean {
  const msg = new ArrayBuffer(48);
  const msgPtr = ptr(new Uint8Array(msg));

  while (user32.symbols.PeekMessageW(msgPtr, 0n, 0, 0, PM.PM_REMOVE)) {
    const msgView = new DataView(msg);
    const message = msgView.getUint32(8, true);
    if (message === WindowMessage.WM_QUIT) return false;
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

  OpenGL32.PreloadExtensions(['wglSwapIntervalEXT']);
  OpenGL32.wglSwapIntervalEXT(1); // VSync on for smooth animation

  console.log('Initializing...');
  initGL();

  console.log(`\nChaos Theory Demonstration`);
  console.log(`==========================`);
  console.log(`  ${NUM_INSTANCES} identical ${SEGMENTS_PER_PENDULUM}-segment pendulums`);
  console.log(`  Initial angle difference: ${INITIAL_DEVIATION} radians (${((INITIAL_DEVIATION * 180) / Math.PI).toFixed(6)} degrees)`);
  console.log(`\n  Watch how tiny differences lead to completely different paths!`);
  console.log(`  All pendulums start nearly identically but diverge over time.`);
  console.log(`\n  Press Ctrl+C or close the window to exit.\n`);

  let lastTime = Bun.nanoseconds();
  let frameCount = 0;
  let fpsTime = 0;
  let accumulator = 0;
  let simulationTime = 0;
  const FIXED_DT = 1 / 120;

  while (processMessages()) {
    const currentTime = Bun.nanoseconds();
    const deltaTime = Math.min((currentTime - lastTime) / 1_000_000_000, 0.1);
    lastTime = currentTime;

    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
      process.stdout.write(`\rFPS: ${frameCount} | Time: ${simulationTime.toFixed(1)}s | Pendulums: ${NUM_INSTANCES}    `);
      frameCount = 0;
      fpsTime = 0;
    }

    accumulator += deltaTime;
    while (accumulator >= FIXED_DT) {
      for (const p of pendulums) {
        updatePendulumInstance(p, FIXED_DT);
      }
      simulationTime += FIXED_DT;
      accumulator -= FIXED_DT;
    }

    render();
    gdi32.symbols.SwapBuffers(hdc);
  }

  console.log();

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
