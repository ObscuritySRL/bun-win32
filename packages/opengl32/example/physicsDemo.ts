/**
 * Physics Demo Example
 *
 * Demonstrates gravity, bouncing physics, and particle effects with @bun-win32/opengl32.
 * Features multiple balls with realistic physics, trails, and sparks on collision.
 *
 * Run with: bun run example/physicsDemo.ts
 */

import { dlopen, FFIType, ptr, JSCallback } from 'bun:ffi';
import OpenGL32, { GLenum } from '../index';

// Window dimensions
const HEIGHT = 600,
  WIDTH = 800;

// Physics constants
const GRAVITY = 980; // pixels per second squared
const BOUNCE_DAMPING = 0.85; // Energy retained on bounce (0-1)
const FRICTION = 0.999; // Air resistance per frame (lower = more friction)
const MIN_VELOCITY = 5; // Minimum velocity before stopping
const FLOOR_Y = 590; // Floor position (HEIGHT - 10)

// Ball settings
const NUM_BALLS = 50;
const MIN_RADIUS = 5;
const MAX_RADIUS = 25;

// Particle settings
const MAX_PARTICLES = 500;
const PARTICLE_LIFETIME = 0.8;
const PARTICLES_PER_COLLISION = 12;

// Types
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  r: number;
  g: number;
  b: number;
  trail: { x: number; y: number; age: number }[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  g: number;
  b: number;
  size: number;
}

// State
const balls: Ball[] = [];
const particles: Particle[] = [];

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
    Buffer.from('Physics Demo - @bun-win32/opengl32\0', 'utf16le'),
    WindowStyle.WS_OVERLAPPEDWINDOW | WindowStyle.WS_VISIBLE,
    x,
    y,
    adjustedWidth,
    adjustedHeight,
    0n, // hWndParent
    0n, // hMenu
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
  OpenGL32.glClearColor(0.05, 0.05, 0.1, 1.0);
  OpenGL32.glEnable(GLenum.GL_BLEND);
  OpenGL32.glBlendFunc(GLenum.GL_SRC_ALPHA, GLenum.GL_ONE_MINUS_SRC_ALPHA);
  OpenGL32.glEnable(GLenum.GL_POINT_SMOOTH);
  OpenGL32.glEnable(GLenum.GL_LINE_SMOOTH);
}

// -----------------------------------------------------------------------------
// Physics initialization
// -----------------------------------------------------------------------------

function initBalls(): void {
  const colors = [
    [1.0, 0.3, 0.3], // Red
    [0.3, 1.0, 0.3], // Green
    [0.3, 0.5, 1.0], // Blue
    [1.0, 1.0, 0.3], // Yellow
    [1.0, 0.5, 0.0], // Orange
    [0.8, 0.3, 1.0], // Purple
    [0.3, 1.0, 1.0], // Cyan
    [1.0, 0.6, 0.8], // Pink
  ];

  for (let i = 0; i < NUM_BALLS; i++) {
    const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
    const color = colors[i % colors.length];
    balls.push({
      x: radius + Math.random() * (WIDTH - 2 * radius),
      y: radius + Math.random() * (HEIGHT / 3), // Start in upper third
      vx: (Math.random() - 0.5) * 400,
      vy: (Math.random() - 0.5) * 200,
      radius,
      r: color[0],
      g: color[1],
      b: color[2],
      trail: [],
    });
  }
}

// -----------------------------------------------------------------------------
// Particle system
// -----------------------------------------------------------------------------

function spawnParticles(x: number, y: number, r: number, g: number, b: number, intensity: number): void {
  const count = Math.floor(PARTICLES_PER_COLLISION * intensity);
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 200 * intensity;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 100, // Bias upward
      life: PARTICLE_LIFETIME,
      maxLife: PARTICLE_LIFETIME,
      r: r + (1 - r) * 0.5, // Brighten
      g: g + (1 - g) * 0.5,
      b: b + (1 - b) * 0.5,
      size: 2 + Math.random() * 3,
    });
  }
}

function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += GRAVITY * 0.3 * dt; // Light gravity on particles
    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// -----------------------------------------------------------------------------
// Physics update
// -----------------------------------------------------------------------------

function updateBalls(dt: number): void {
  for (const ball of balls) {
    // Store trail point
    ball.trail.push({ x: ball.x, y: ball.y, age: 0 });
    if (ball.trail.length > 20) ball.trail.shift();

    // Age trail points
    for (const point of ball.trail) {
      point.age += dt * 3;
    }

    // Apply gravity
    ball.vy += GRAVITY * dt;

    // Apply air friction
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    // Update position
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Floor collision
    if (ball.y + ball.radius > FLOOR_Y) {
      ball.y = FLOOR_Y - ball.radius;
      const impactVelocity = Math.abs(ball.vy);
      ball.vy = -ball.vy * BOUNCE_DAMPING;

      // Spawn particles on significant impact
      if (impactVelocity > 50) {
        spawnParticles(ball.x, FLOOR_Y - 5, ball.r, ball.g, ball.b, impactVelocity / 500);
      }

      // Stop if velocity is too low
      if (Math.abs(ball.vy) < MIN_VELOCITY) {
        ball.vy = 0;
      }
    }

    // Ceiling collision
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy * BOUNCE_DAMPING;
    }

    // Wall collisions
    if (ball.x + ball.radius > WIDTH) {
      ball.x = WIDTH - ball.radius;
      const impactVelocity = Math.abs(ball.vx);
      ball.vx = -ball.vx * BOUNCE_DAMPING;
      if (impactVelocity > 50) {
        spawnParticles(WIDTH - 5, ball.y, ball.r, ball.g, ball.b, impactVelocity / 500);
      }
    }
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      const impactVelocity = Math.abs(ball.vx);
      ball.vx = -ball.vx * BOUNCE_DAMPING;
      if (impactVelocity > 50) {
        spawnParticles(5, ball.y, ball.r, ball.g, ball.b, impactVelocity / 500);
      }
    }
  }

  // Ball-to-ball collisions
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0) {
        // Normalize collision vector
        const nx = dx / dist;
        const ny = dy / dist;

        // Relative velocity
        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const dvn = dvx * nx + dvy * ny;

        // Only resolve if balls are approaching
        if (dvn > 0) {
          // Mass proportional to radius squared
          const ma = a.radius * a.radius;
          const mb = b.radius * b.radius;
          const totalMass = ma + mb;

          // Impulse
          const impulse = (2 * dvn) / totalMass;

          a.vx -= impulse * mb * nx * BOUNCE_DAMPING;
          a.vy -= impulse * mb * ny * BOUNCE_DAMPING;
          b.vx += impulse * ma * nx * BOUNCE_DAMPING;
          b.vy += impulse * ma * ny * BOUNCE_DAMPING;

          // Separate balls
          const overlap = minDist - dist;
          const separationX = (overlap / 2 + 1) * nx;
          const separationY = (overlap / 2 + 1) * ny;
          a.x -= separationX;
          a.y -= separationY;
          b.x += separationX;
          b.y += separationY;

          // Spawn particles at collision point
          const collisionX = a.x + nx * a.radius;
          const collisionY = a.y + ny * a.radius;
          const impactSpeed = Math.abs(dvn);
          if (impactSpeed > 30) {
            spawnParticles(collisionX, collisionY, (a.r + b.r) / 2, (a.g + b.g) / 2, (a.b + b.b) / 2, impactSpeed / 300);
          }
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

function drawCircle(cx: number, cy: number, radius: number, r: number, g: number, b: number, segments: number): void {
  // Outer glow
  OpenGL32.glBegin(GLenum.GL_TRIANGLE_FAN);
  OpenGL32.glColor4f(r, g, b, 0.0);
  OpenGL32.glVertex2f(cx, cy);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    OpenGL32.glColor4f(r, g, b, 0.0);
    OpenGL32.glVertex2f(cx + Math.cos(angle) * radius * 1.3, cy + Math.sin(angle) * radius * 1.3);
  }
  OpenGL32.glEnd();

  // Main ball with gradient
  OpenGL32.glBegin(GLenum.GL_TRIANGLE_FAN);
  OpenGL32.glColor4f(1.0, 1.0, 1.0, 1.0); // Bright center
  OpenGL32.glVertex2f(cx - radius * 0.3, cy - radius * 0.3);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    OpenGL32.glColor4f(r * 0.8, g * 0.8, b * 0.8, 1.0);
    OpenGL32.glVertex2f(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  OpenGL32.glEnd();
}

function drawTrail(trail: { x: number; y: number; age: number }[], r: number, g: number, b: number): void {
  if (trail.length < 2) return;

  OpenGL32.glBegin(GLenum.GL_LINE_STRIP);
  for (let i = 0; i < trail.length; i++) {
    const point = trail[i];
    const alpha = Math.max(0, 1 - point.age) * 0.5;
    OpenGL32.glColor4f(r, g, b, alpha);
    OpenGL32.glVertex2f(point.x, point.y);
  }
  OpenGL32.glEnd();
}

function drawParticles(): void {
  OpenGL32.glBegin(GLenum.GL_QUADS);
  for (const p of particles) {
    const alpha = (p.life / p.maxLife) * 0.8;
    const size = p.size * (p.life / p.maxLife);
    OpenGL32.glColor4f(p.r, p.g, p.b, alpha);
    OpenGL32.glVertex2f(p.x - size, p.y - size);
    OpenGL32.glVertex2f(p.x + size, p.y - size);
    OpenGL32.glVertex2f(p.x + size, p.y + size);
    OpenGL32.glVertex2f(p.x - size, p.y + size);
  }
  OpenGL32.glEnd();
}

function drawFloor(): void {
  // Floor gradient
  OpenGL32.glBegin(GLenum.GL_QUADS);
  OpenGL32.glColor4f(0.15, 0.15, 0.2, 1.0);
  OpenGL32.glVertex2f(0, HEIGHT - 10);
  OpenGL32.glVertex2f(WIDTH, HEIGHT - 10);
  OpenGL32.glColor4f(0.1, 0.1, 0.15, 1.0);
  OpenGL32.glVertex2f(WIDTH, HEIGHT);
  OpenGL32.glVertex2f(0, HEIGHT);
  OpenGL32.glEnd();

  // Floor line
  OpenGL32.glBegin(GLenum.GL_LINES);
  OpenGL32.glColor4f(0.3, 0.3, 0.4, 1.0);
  OpenGL32.glVertex2f(0, HEIGHT - 10);
  OpenGL32.glVertex2f(WIDTH, HEIGHT - 10);
  OpenGL32.glEnd();
}

function render(): void {
  OpenGL32.glClear(GLenum.GL_COLOR_BUFFER_BIT);
  OpenGL32.glLoadIdentity();

  drawFloor();

  // Draw trails
  for (const ball of balls) {
    drawTrail(ball.trail, ball.r, ball.g, ball.b);
  }

  // Draw particles
  drawParticles();

  // Draw balls
  for (const ball of balls) {
    drawCircle(ball.x, ball.y, ball.radius, ball.r, ball.g, ball.b, 24);
  }

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
  initBalls();

  console.log('Starting physics simulation...');
  console.log(`  ${NUM_BALLS} balls with gravity, bouncing, and collisions`);
  console.log('  Press Ctrl+C or close the window to exit.\n');

  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTime = 0;
  let accumulator = 0;
  const FIXED_DT = 1 / 60; // Fixed physics timestep (60 Hz)

  while (processMessages()) {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
      process.stdout.write(`\rFPS: ${frameCount} | Particles: ${particles.length}    `);
      frameCount = 0;
      fpsTime = 0;
    }

    // Fixed timestep physics update
    accumulator += deltaTime;
    while (accumulator >= FIXED_DT) {
      updateBalls(FIXED_DT);
      updateParticles(FIXED_DT);
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
