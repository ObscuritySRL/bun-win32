/**
 * N-Pendulum Chaos Demonstration (Butterfly Effect)
 *
 * Simulates multiple identical double pendulums launched from nearly the same
 * initial conditions. Each pendulum differs from the next by an astronomically
 * small angle (1e-10 radians). Despite starting almost identically, the
 * pendulums diverge wildly over time -- a hallmark of deterministic chaos
 * known as the "butterfly effect."
 *
 * How it works:
 *
 *   Physics -- Lagrangian Mechanics
 *   The motion of an N-segment pendulum is governed by the Euler-Lagrange
 *   equations derived from the system's Lagrangian L = T - V (kinetic minus
 *   potential energy). For coupled pendulum segments, this yields a system of
 *   second-order ODEs of the form  M * alpha = F, where:
 *     - M is the mass/inertia matrix coupling each pair of segments
 *     - alpha is the vector of angular accelerations we solve for
 *     - F is the generalized force vector (gravity + Coriolis/centripetal terms)
 *   We solve M * alpha = F via Gaussian elimination with partial pivoting,
 *   then integrate with semi-implicit Euler (symplectic) using small substeps.
 *
 *   Rendering -- OpenGL 1.x immediate mode
 *   Each pendulum is drawn as connected line segments with circle bobs. The
 *   tip of the last bob leaves a fading rainbow trail. Trails use alpha
 *   blending so older points fade away, revealing the chaotic divergence
 *   pattern over time.
 *
 * APIs demonstrated:
 *   - @bun-win32/opengl32: glBegin, glEnd, glVertex2f, glColor4f, glClear,
 *     glOrtho, glBlendFunc, wglCreateContext, wglSwapIntervalEXT, etc.
 *   - @bun-win32/user32: CreateWindowExW, PeekMessageW, SetWindowLongPtrW
 *   - @bun-win32/kernel32: GetModuleHandleW, GetLastError
 *   - @bun-win32/gdi32: ChoosePixelFormat, SetPixelFormat, SwapBuffers
 *
 * Run with: bun run example/pendulum.ts
 */

import { FFIType, JSCallback, ptr, type Pointer } from 'bun:ffi';
import OpenGL32, { GLenum } from '../index';
import User32 from '@bun-win32/user32';
import Kernel32 from '@bun-win32/kernel32';
import GDI32 from '@bun-win32/gdi32';

const SEGMENTS_PER_PENDULUM = 2;
const NUM_INSTANCES = 25;
// const INITIAL_DEVIATION = 0.005; // ~1e-10 radians between successive instances
const INITIAL_DEVIATION = 0.00000000001; // ~1e-10 radians between successive instances

const HEIGHT = 850;
const WIDTH = 1100;

const GRAVITY = 400;
const SEGMENT_LENGTH = Math.min(120, 400 / SEGMENTS_PER_PENDULUM);
const SEGMENT_MASS = 10;

const MAX_TRAIL_LENGTH = 800;

const PIVOT_X = WIDTH / 2;
const PIVOT_Y = HEIGHT / 2;

interface PendulumInstance {
  angles: number[];
  angularVels: number[];
  lengths: number[];
  masses: number[];
  trail: { x: number; y: number }[];
  color: { r: number; g: number; b: number };
}

/**
 * Convert HSL color to RGB. Used to assign each pendulum a unique hue from
 * the rainbow spectrum so the divergence pattern is visually distinct.
 */
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

const pendulums: PendulumInstance[] = [];

for (let p = 0; p < NUM_INSTANCES; p++) {
  const instance: PendulumInstance = {
    angles: [],
    angularVels: [],
    lengths: [],
    masses: [],
    trail: [],
    color: hslToRgb((p / NUM_INSTANCES) * 300, 0.9, 0.55),
  };

  for (let i = 0; i < SEGMENTS_PER_PENDULUM; i++) {
    // All pendulums start pointing straight up (PI radians from the downward
    // rest position). Each instance is offset by (p+1) * INITIAL_DEVIATION so
    // even the first pendulum has a tiny nudge and won't balance forever.
    const baseAngle = Math.PI;
    const deviation = (p + 1) * INITIAL_DEVIATION;
    instance.angles.push(baseAngle + deviation);
    instance.angularVels.push(0);
    instance.lengths.push(SEGMENT_LENGTH);
    instance.masses.push(SEGMENT_MASS);
  }

  pendulums.push(instance);
}

const enum PM {
  PM_REMOVE = 0x0001,
}
const enum SW {
  SW_SHOW = 5,
}
const enum WindowMessage {
  WM_CLOSE = 0x0010,
  WM_DESTROY = 0x0002,
}
const enum WindowStyle {
  WS_OVERLAPPEDWINDOW = 0x00cf0000,
  WS_VISIBLE = 0x10000000,
}
const WM_QUIT = 0x0012;

let wndProcCallback: JSCallback | null = null;
let shouldClose = false;

const createWndProc = () => {
  const cb = new JSCallback(
    (hwnd: bigint, msg: number, wParam: number | bigint, lParam: number | bigint): bigint => {
      if (msg === WindowMessage.WM_CLOSE || msg === WindowMessage.WM_DESTROY) {
        shouldClose = true;
        User32.PostQuitMessage(0);
        return 0n;
      }
      return BigInt(User32.DefWindowProcW(hwnd, msg, BigInt(wParam), BigInt(lParam)));
    },
    { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
  );
  wndProcCallback = cb;
  if (!cb.ptr) throw new Error('Failed to create window procedure callback');
  return cb.ptr;
};

// PIXELFORMATDESCRIPTOR requesting 32-bit color, double-buffered, OpenGL-capable
const PIXEL_FORMAT_DESCRIPTOR = Buffer.from([
  0x28, 0x00, 0x01, 0x00, 0x25, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00,
]);

function createWindow(): { hwnd: bigint; hdc: bigint } {
  const hInstance = Kernel32.GetModuleHandleW(0 as unknown as Pointer);

  // Center the window on screen
  const screenWidth = User32.GetSystemMetrics(0x00); // SM_CXSCREEN
  const screenHeight = User32.GetSystemMetrics(0x01); // SM_CYSCREEN
  const x = ((screenWidth - WIDTH) / 2) | 0;
  const y = ((screenHeight - HEIGHT) / 2) | 0;

  // Adjust window rect so the client area matches our desired dimensions
  const rect = new ArrayBuffer(16);
  const rectView = new DataView(rect);
  rectView.setInt32(0, 0, true);
  rectView.setInt32(4, 0, true);
  rectView.setInt32(8, WIDTH, true);
  rectView.setInt32(12, HEIGHT, true);
  User32.AdjustWindowRectEx(ptr(new Uint8Array(rect)), WindowStyle.WS_OVERLAPPEDWINDOW, 0, 0);
  const adjustedWidth = rectView.getInt32(8, true) - rectView.getInt32(0, true);
  const adjustedHeight = rectView.getInt32(12, true) - rectView.getInt32(4, true);

  // Use the built-in "STATIC" window class to avoid registering a custom one
  const hwnd = User32.CreateWindowExW(
    0,
    Buffer.from('STATIC\0', 'utf16le').ptr,
    Buffer.from(`Chaos Demo - ${NUM_INSTANCES} Pendulums (${INITIAL_DEVIATION} rad difference)\0`, 'utf16le').ptr,
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
  if (!hwnd) throw new Error(`CreateWindowExW failed: ${Kernel32.GetLastError()}`);

  // Subclass the STATIC window with our own WndProc to handle WM_CLOSE/WM_DESTROY
  const wndProcPtr = createWndProc();
  if (!User32.SetWindowLongPtrW(hwnd, -4, BigInt(wndProcPtr))) {
    throw new Error(`SetWindowLongPtrW failed: ${Kernel32.GetLastError()}`);
  }

  const hdc = User32.GetDC(hwnd);
  if (!hdc) throw new Error(`GetDC failed: ${Kernel32.GetLastError()}`);

  // Set up the pixel format for OpenGL rendering on this DC
  const pixelFormat = GDI32.ChoosePixelFormat(hdc, PIXEL_FORMAT_DESCRIPTOR.ptr);
  if (pixelFormat === 0) throw new Error(`ChoosePixelFormat failed: ${Kernel32.GetLastError()}`);
  if (!GDI32.SetPixelFormat(hdc, pixelFormat, PIXEL_FORMAT_DESCRIPTOR.ptr)) {
    throw new Error(`SetPixelFormat failed: ${Kernel32.GetLastError()}`);
  }

  User32.ShowWindow(hwnd, SW.SW_SHOW);
  User32.UpdateWindow(hwnd);

  return { hwnd, hdc };
}

function createGLContext(hdc: bigint): bigint {
  const hglrc = OpenGL32.wglCreateContext(hdc);
  if (!hglrc) throw new Error(`wglCreateContext failed: ${Kernel32.GetLastError()}`);
  if (!OpenGL32.wglMakeCurrent(hdc, hglrc)) {
    throw new Error(`wglMakeCurrent failed: ${Kernel32.GetLastError()}`);
  }
  return hglrc;
}

function initGL(): void {
  // Set up a 2D orthographic projection matching pixel coordinates.
  // Origin is top-left, Y increases downward (matches typical screen coords).
  OpenGL32.glMatrixMode(GLenum.GL_PROJECTION);
  OpenGL32.glLoadIdentity();
  OpenGL32.glOrtho(0, WIDTH, HEIGHT, 0, -1, 1);
  OpenGL32.glMatrixMode(GLenum.GL_MODELVIEW);
  OpenGL32.glLoadIdentity();

  // Near-black background with slight blue tint
  OpenGL32.glClearColor(0.02, 0.02, 0.05, 1.0);

  // Enable alpha blending for trail fadeout
  OpenGL32.glEnable(GLenum.GL_BLEND);
  OpenGL32.glBlendFunc(GLenum.GL_SRC_ALPHA, GLenum.GL_ONE_MINUS_SRC_ALPHA);

  // Smooth lines for nicer pendulum arms and trails
  OpenGL32.glEnable(GLenum.GL_LINE_SMOOTH);
  OpenGL32.glLineWidth(2.0);
}

/**
 * Update one pendulum instance by dt seconds using Lagrangian mechanics.
 *
 * The physics works as follows for an N-segment pendulum:
 *
 * 1. Build the mass matrix M[i][j]:
 *    Each entry couples segment i with segment j through their shared inertia.
 *    M[i][j] = (sum of masses at or below max(i,j)) * L_i * L_j * cos(theta_i - theta_j)
 *    This encodes how accelerating one segment affects the others through the
 *    rigid coupling of the chain.
 *
 * 2. Build the generalized force vector F[i]:
 *    F[i] = -gravity_term - coriolis_centripetal_terms
 *    The gravity term is: (mass below segment i) * g * L_i * sin(theta_i)
 *    The Coriolis/centripetal terms account for the fictitious forces that
 *    arise because each segment swings in a rotating reference frame defined
 *    by the segments above it.
 *
 * 3. Solve M * alpha = F for the angular accelerations alpha[i] using
 *    Gaussian elimination with partial pivoting. Partial pivoting swaps rows
 *    to put the largest pivot element on the diagonal, improving numerical
 *    stability for nearly-singular configurations.
 *
 * 4. Integrate using semi-implicit Euler (symplectic):
 *      omega_new = omega_old + alpha * h
 *      theta_new = theta_old + omega_new * h
 *    This is first-order but symplectic, meaning it conserves energy on
 *    average over long runs -- important for chaotic systems. We use many
 *    substeps (h = dt/steps) to keep the integration accurate.
 */
function updatePendulumInstance(p: PendulumInstance, dt: number): void {
  const n = SEGMENTS_PER_PENDULUM;
  const g = GRAVITY;

  // More substeps for more segments to maintain stability
  const steps = Math.max(10, n * 5);
  const h = dt / steps;

  for (let step = 0; step < steps; step++) {
    // Allocate the mass matrix M and force vector F
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
      // Total mass at and below segment i (the "pendulum below" this joint)
      let massBelow = 0;
      for (let k = i; k < n; k++) {
        massBelow += p.masses[k]!;
      }

      // Build mass matrix row i: M[i][j] encodes inertial coupling between
      // segments i and j. The coupling depends on the mass hanging below
      // whichever segment is further from the pivot, times both segment
      // lengths, times the cosine of their angle difference.
      for (let j = 0; j < n; j++) {
        let massBelowMax = 0;
        for (let k = Math.max(i, j); k < n; k++) {
          massBelowMax += p.masses[k]!;
        }
        M[i]![j] = massBelowMax * p.lengths[i]! * p.lengths[j]! * Math.cos(p.angles[i]! - p.angles[j]!);
      }

      // Gravitational torque on segment i: tries to pull the pendulum downward.
      // Negative because gravity opposes upward angular displacement.
      F[i] = -massBelow * g * p.lengths[i]! * Math.sin(p.angles[i]!);

      // Coriolis and centripetal terms: when segment j is swinging, it exerts
      // a velocity-dependent force on segment i through their coupling.
      // These terms involve omega_j^2 * sin(theta_i - theta_j).
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

    // Solve the linear system M * alpha = F for angular accelerations
    const alpha = solveLinearSystem(M, F);

    // Semi-implicit Euler integration: update velocity first, then position.
    // This ordering makes the integrator symplectic (energy-preserving on average).
    for (let i = 0; i < n; i++) {
      p.angularVels[i] = p.angularVels[i]! + alpha[i]! * h;
      p.angles[i] = p.angles[i]! + p.angularVels[i]! * h;
    }
  }

  // Forward-kinematics: compute the tip position for the trail.
  // Walk down the chain, each segment contributes L*sin(theta) horizontally
  // and L*cos(theta) vertically (in screen-down Y convention).
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

/**
 * Solve A*x = b using Gaussian elimination with partial pivoting.
 *
 * Partial pivoting selects the row with the largest absolute value in the
 * current column as the pivot row. This avoids division by very small numbers
 * which would amplify floating-point errors. The algorithm:
 *
 * 1. Form the augmented matrix [A | b]
 * 2. For each column (left to right):
 *    a. Find the row below (or at) the diagonal with the largest absolute value
 *    b. Swap that row with the current row (partial pivoting)
 *    c. Eliminate all entries below the pivot by subtracting scaled rows
 * 3. Back-substitute from the bottom row upward to find x
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;

  // Build augmented matrix [A | b] so row operations apply to both sides
  const aug: number[][] = [];
  for (let i = 0; i < n; i++) {
    aug[i] = [...A[i]!, b[i]!];
  }

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find the row with the largest pivot candidate in this column
    let maxRow = col;
    let maxVal = Math.abs(aug[col]![col]!);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row]![col]!) > maxVal) {
        maxVal = Math.abs(aug[row]![col]!);
        maxRow = row;
      }
    }

    // Swap the best pivot row into position
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow]!, aug[col]!];
    }

    // Skip near-zero pivots (singular or near-singular sub-matrix)
    if (Math.abs(aug[col]![col]!) < 1e-12) {
      continue;
    }

    // Eliminate entries below the pivot
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row]![col]! / aug[col]![col]!;
      for (let j = col; j <= n; j++) {
        aug[row]![j] = aug[row]![j]! - factor * aug[col]![j]!;
      }
    }
  }

  // Back substitution: solve from bottom row upward
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

/**
 * Draw the fading trail left by the tip of a pendulum's last bob.
 * Alpha increases from 0 (oldest point) to 0.8 (newest point), creating
 * a smooth fade effect that shows the recent motion history.
 */
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

  // Forward-kinematics to get all bob positions along the chain
  const positions: { x: number; y: number }[] = [{ x: PIVOT_X, y: PIVOT_Y }];
  let x = PIVOT_X;
  let y = PIVOT_Y;
  for (let i = 0; i < SEGMENTS_PER_PENDULUM; i++) {
    x += p.lengths[i]! * Math.sin(p.angles[i]!);
    y += p.lengths[i]! * Math.cos(p.angles[i]!);
    positions.push({ x, y });
  }

  drawTrail(p.trail, r, g, b);

  // Draw the rigid arms connecting each joint
  OpenGL32.glLineWidth(2.5);
  OpenGL32.glBegin(GLenum.GL_LINE_STRIP);
  OpenGL32.glColor4f(r * 0.8, g * 0.8, b * 0.8, 1.0);
  for (const pos of positions) {
    OpenGL32.glVertex2f(pos.x, pos.y);
  }
  OpenGL32.glEnd();
  OpenGL32.glLineWidth(2.0);

  // Draw a filled circle at each bob
  const bobRadius = 8;
  for (let i = 0; i < SEGMENTS_PER_PENDULUM; i++) {
    drawCircle(positions[i + 1]!.x, positions[i + 1]!.y, bobRadius, r, g, b, 1.0);
  }
}

function render(): void {
  OpenGL32.glClear(GLenum.GL_COLOR_BUFFER_BIT);
  OpenGL32.glLoadIdentity();

  for (let i = 0; i < pendulums.length; i++) {
    drawPendulum(pendulums[i]!);
  }

  // Draw the pivot mount on top of everything
  drawPivot();

  OpenGL32.glFlush();
}

function processMessages(): boolean {
  const msg = new ArrayBuffer(48);
  const msgPtr = ptr(new Uint8Array(msg));

  while (User32.PeekMessageW(msgPtr, 0n, 0, 0, PM.PM_REMOVE)) {
    const msgView = new DataView(msg);
    const message = msgView.getUint32(8, true);
    if (message === WM_QUIT) return false;
    User32.TranslateMessage(msgPtr);
    User32.DispatchMessageW(msgPtr);
  }

  return !shouldClose;
}

function main(): void {
  console.log('Creating window...');
  const { hwnd, hdc } = createWindow();

  console.log('Creating OpenGL context...');
  const hglrc = createGLContext(hdc);

  // Enable VSync so the animation runs at monitor refresh rate
  OpenGL32.PreloadExtensions(['wglSwapIntervalEXT']);
  OpenGL32.wglSwapIntervalEXT(1);

  console.log('Initializing...');
  initGL();

  console.log(`\nChaos Theory Demonstration`);
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

  // Fixed timestep for deterministic physics, decoupled from frame rate
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

    // Accumulate real time and consume it in fixed-size physics steps
    accumulator += deltaTime;
    while (accumulator >= FIXED_DT) {
      for (const p of pendulums) {
        updatePendulumInstance(p, FIXED_DT);
      }
      simulationTime += FIXED_DT;
      accumulator -= FIXED_DT;
    }

    render();
    GDI32.SwapBuffers(hdc);
  }

  console.log();

  console.log('Cleaning up...');
  OpenGL32.wglMakeCurrent(0n, 0n);
  OpenGL32.wglDeleteContext(hglrc);
  User32.ReleaseDC(hwnd, hdc);

  if (wndProcCallback) {
    wndProcCallback.close();
  }

  console.log('Done!');
}

main();
