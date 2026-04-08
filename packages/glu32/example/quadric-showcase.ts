/**
 * GLU Quadric Showcase
 *
 * Renders four GLU quadric shapes side by side in a rotating 3D scene with
 * OpenGL lighting:
 *   1. Wireframe sphere   (GLU_LINE draw style)
 *   2. Solid cylinder     (GLU_FILL with lighting)
 *   3. Flat disk          (GLU_FILL with lighting)
 *   4. Partial disk       (GLU_SILHOUETTE draw style)
 *
 * The scene rotates slowly so you can see the shapes from all angles. A single
 * directional light illuminates the solid shapes. The camera is set up with
 * gluPerspective and gluLookAt.
 *
 * APIs demonstrated:
 *   - @bun-win32/glu32: gluNewQuadric, gluDeleteQuadric, gluQuadricDrawStyle,
 *     gluQuadricNormals, gluSphere, gluCylinder, gluDisk, gluPartialDisk,
 *     gluPerspective, gluLookAt
 *   - @bun-win32/opengl32: glEnable, glLightfv, glMaterialfv, glTranslatef,
 *     glRotatef, glPushMatrix, glPopMatrix, glViewport, glShadeModel, etc.
 *   - @bun-win32/user32: CreateWindowExW, PeekMessageW, SetWindowLongPtrW
 *   - @bun-win32/kernel32: GetModuleHandleW, GetLastError
 *   - @bun-win32/gdi32: ChoosePixelFormat, SetPixelFormat, SwapBuffers
 *
 * Run with: bun run example/quadric-showcase.ts
 */

import { FFIType, JSCallback, ptr, type Pointer } from 'bun:ffi';
import OpenGL32, { GLenum } from '@bun-win32/opengl32';
import GLU32 from '../index';
import { GLenum as GLUenum } from '../types/GLU32';
import User32 from '@bun-win32/user32';
import Kernel32 from '@bun-win32/kernel32';
import GDI32 from '@bun-win32/gdi32';

const WIDTH = 1000;
const HEIGHT = 600;

const PIXEL_FORMAT_DESCRIPTOR = Buffer.from([
  0x28, 0x00, 0x01, 0x00, 0x25, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18,
  0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

const enum PM {
  PM_REMOVE = 0x0001,
}
const enum WindowStyle {
  WS_OVERLAPPEDWINDOW = 0x00cf0000,
  WS_VISIBLE = 0x10000000,
}
const WM_CLOSE = 0x0010;
const WM_DESTROY = 0x0002;
const WM_QUIT = 0x0012;
const SW_SHOW = 5;

let wndProcCallback: JSCallback | null = null;
let shouldClose = false;

const createWndProc = () => {
  const cb = new JSCallback(
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
  wndProcCallback = cb;
  if (!cb.ptr) throw new Error('Failed to create WndProc callback');
  return cb.ptr;
};

function createWindow(): { hwnd: bigint; hdc: bigint } {
  const hInstance = Kernel32.GetModuleHandleW(0 as unknown as Pointer);
  const screenWidth = User32.GetSystemMetrics(0x00);
  const screenHeight = User32.GetSystemMetrics(0x01);
  const x = ((screenWidth - WIDTH) / 2) | 0;
  const y = ((screenHeight - HEIGHT) / 2) | 0;

  const rect = new ArrayBuffer(16);
  const rectView = new DataView(rect);
  rectView.setInt32(0, 0, true);
  rectView.setInt32(4, 0, true);
  rectView.setInt32(8, WIDTH, true);
  rectView.setInt32(12, HEIGHT, true);
  User32.AdjustWindowRectEx(ptr(new Uint8Array(rect)), WindowStyle.WS_OVERLAPPEDWINDOW, 0, 0);
  const adjustedWidth = rectView.getInt32(8, true) - rectView.getInt32(0, true);
  const adjustedHeight = rectView.getInt32(12, true) - rectView.getInt32(4, true);

  const hwnd = User32.CreateWindowExW(
    0,
    Buffer.from('STATIC\0', 'utf16le').ptr,
    Buffer.from('GLU Quadric Showcase\0', 'utf16le').ptr,
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

  const wndProcPtr = createWndProc();
  if (!User32.SetWindowLongPtrW(hwnd, -4, BigInt(wndProcPtr))) {
    throw new Error(`SetWindowLongPtrW failed: ${Kernel32.GetLastError()}`);
  }

  const hdc = User32.GetDC(hwnd);
  if (!hdc) throw new Error(`GetDC failed: ${Kernel32.GetLastError()}`);

  const pixelFormat = GDI32.ChoosePixelFormat(hdc, PIXEL_FORMAT_DESCRIPTOR.ptr);
  if (pixelFormat === 0) throw new Error(`ChoosePixelFormat failed: ${Kernel32.GetLastError()}`);
  if (!GDI32.SetPixelFormat(hdc, pixelFormat, PIXEL_FORMAT_DESCRIPTOR.ptr)) {
    throw new Error(`SetPixelFormat failed: ${Kernel32.GetLastError()}`);
  }

  User32.ShowWindow(hwnd, SW_SHOW);
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
  // Dark blue-gray background
  OpenGL32.glClearColor(0.08, 0.08, 0.12, 1.0);

  // Enable depth testing so 3D shapes render correctly
  OpenGL32.glEnable(GLenum.GL_DEPTH_TEST);
  OpenGL32.glDepthFunc(GLenum.GL_LEQUAL);

  // Smooth shading for nice lighting gradients on curved surfaces
  OpenGL32.glShadeModel(GLenum.GL_SMOOTH);

  // Enable lighting and a single white directional light (GL_LIGHT0)
  OpenGL32.glEnable(GLenum.GL_LIGHTING);
  OpenGL32.glEnable(GLenum.GL_LIGHT0);

  // Light position: directional from upper-right-front
  const lightPos = new Float32Array([2.0, 3.0, 4.0, 0.0]); // w=0 means directional
  const lightDiffuse = new Float32Array([1.0, 1.0, 0.95, 1.0]);
  const lightAmbient = new Float32Array([0.15, 0.15, 0.2, 1.0]);
  const lightSpecular = new Float32Array([1.0, 1.0, 1.0, 1.0]);

  OpenGL32.glLightfv(GLenum.GL_LIGHT0, GLenum.GL_POSITION, ptr(lightPos));
  OpenGL32.glLightfv(GLenum.GL_LIGHT0, GLenum.GL_DIFFUSE, ptr(lightDiffuse));
  OpenGL32.glLightfv(GLenum.GL_LIGHT0, GLenum.GL_AMBIENT, ptr(lightAmbient));
  OpenGL32.glLightfv(GLenum.GL_LIGHT0, GLenum.GL_SPECULAR, ptr(lightSpecular));

  // Enable color tracking so glColor calls set the material color
  OpenGL32.glEnable(GLenum.GL_COLOR_MATERIAL);
  OpenGL32.glColorMaterial(GLenum.GL_FRONT_AND_BACK, GLenum.GL_AMBIENT_AND_DIFFUSE);

  // Auto-normalize normals so scaled geometry still lights correctly
  OpenGL32.glEnable(GLenum.GL_NORMALIZE);

  setupProjection();
}

function setupProjection(): void {
  OpenGL32.glViewport(0, 0, WIDTH, HEIGHT);

  OpenGL32.glMatrixMode(GLenum.GL_PROJECTION);
  OpenGL32.glLoadIdentity();
  // 45-degree field of view, with near/far planes at 0.5 and 100
  GLU32.gluPerspective(45.0, WIDTH / HEIGHT, 0.5, 100.0);

  OpenGL32.glMatrixMode(GLenum.GL_MODELVIEW);
  OpenGL32.glLoadIdentity();
  // Camera positioned above and in front, looking at the origin
  GLU32.gluLookAt(0.0, 2.0, 10.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
}

function setMaterial(r: number, g: number, b: number): void {
  const diffuse = new Float32Array([r, g, b, 1.0]);
  const specular = new Float32Array([0.4, 0.4, 0.4, 1.0]);
  OpenGL32.glMaterialfv(GLenum.GL_FRONT_AND_BACK, GLenum.GL_AMBIENT_AND_DIFFUSE, ptr(diffuse));
  OpenGL32.glMaterialfv(GLenum.GL_FRONT_AND_BACK, GLenum.GL_SPECULAR, ptr(specular));

  const shininess = new Float32Array([30.0]);
  OpenGL32.glMaterialfv(GLenum.GL_FRONT_AND_BACK, GLenum.GL_SHININESS, ptr(shininess));
}

function render(quadric: any, rotation: number): void {
  OpenGL32.glClear(GLenum.GL_COLOR_BUFFER_BIT | GLenum.GL_DEPTH_BUFFER_BIT);

  // The four shapes are spaced evenly along the X axis
  const spacing = 3.0;
  const startX = -spacing * 1.5;

  // Shape 1: Wireframe sphere (lighting off for wireframe)
  OpenGL32.glPushMatrix();
  OpenGL32.glTranslatef(startX, 0.0, 0.0);
  OpenGL32.glRotatef(rotation, 0.3, 1.0, 0.2);
  OpenGL32.glDisable(GLenum.GL_LIGHTING);
  OpenGL32.glColor4f(0.3, 0.7, 1.0, 1.0); // light blue wireframe
  GLU32.gluQuadricDrawStyle(quadric, GLUenum.GLU_LINE);
  GLU32.gluQuadricNormals(quadric, GLUenum.GLU_SMOOTH);
  GLU32.gluSphere(quadric, 1.2, 24, 16);
  OpenGL32.glEnable(GLenum.GL_LIGHTING);
  OpenGL32.glPopMatrix();

  // Shape 2: Solid cylinder (with lighting)
  OpenGL32.glPushMatrix();
  OpenGL32.glTranslatef(startX + spacing, -1.0, 0.0);
  OpenGL32.glRotatef(rotation * 0.7, 0.5, 1.0, 0.0);
  setMaterial(0.9, 0.4, 0.1); // warm orange
  GLU32.gluQuadricDrawStyle(quadric, GLUenum.GLU_FILL);
  GLU32.gluQuadricNormals(quadric, GLUenum.GLU_SMOOTH);
  GLU32.gluCylinder(quadric, 0.8, 0.4, 2.0, 24, 8);
  OpenGL32.glPopMatrix();

  // Shape 3: Flat disk (with lighting)
  OpenGL32.glPushMatrix();
  OpenGL32.glTranslatef(startX + spacing * 2, 0.0, 0.0);
  OpenGL32.glRotatef(rotation * 0.5, 1.0, 0.5, 0.3);
  setMaterial(0.2, 0.8, 0.3); // green
  GLU32.gluQuadricDrawStyle(quadric, GLUenum.GLU_FILL);
  GLU32.gluQuadricNormals(quadric, GLUenum.GLU_SMOOTH);
  GLU32.gluDisk(quadric, 0.3, 1.2, 32, 6);
  OpenGL32.glPopMatrix();

  // Shape 4: Partial disk with silhouette style (lighting off)
  OpenGL32.glPushMatrix();
  OpenGL32.glTranslatef(startX + spacing * 3, 0.0, 0.0);
  OpenGL32.glRotatef(rotation * 0.9, 0.2, 1.0, 0.6);
  OpenGL32.glDisable(GLenum.GL_LIGHTING);
  OpenGL32.glColor4f(1.0, 0.3, 0.6, 1.0); // pink silhouette
  GLU32.gluQuadricDrawStyle(quadric, GLUenum.GLU_SILHOUETTE);
  GLU32.gluPartialDisk(quadric, 0.2, 1.2, 32, 6, 0.0, 270.0);
  OpenGL32.glEnable(GLenum.GL_LIGHTING);
  OpenGL32.glPopMatrix();

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

  OpenGL32.PreloadExtensions(['wglSwapIntervalEXT']);
  OpenGL32.wglSwapIntervalEXT(1);

  console.log('Initializing GL...');
  initGL();

  // Create a single quadric object -- we reconfigure its draw style per shape
  const quadric = GLU32.gluNewQuadric();
  if (!quadric) throw new Error('gluNewQuadric returned null');

  console.log('\nGLU Quadric Showcase');
  console.log('  Four shapes rotating with OpenGL lighting');
  console.log('  [Wireframe Sphere] [Solid Cylinder] [Flat Disk] [Partial Disk]');
  console.log('\n  Close the window or press Ctrl+C to exit.\n');

  let lastTime = Bun.nanoseconds();
  let rotation = 0;
  let frameCount = 0;
  let fpsTime = 0;

  while (processMessages()) {
    const currentTime = Bun.nanoseconds();
    const deltaTime = Math.min((currentTime - lastTime) / 1_000_000_000, 0.1);
    lastTime = currentTime;

    // Slow rotation: 20 degrees per second
    rotation += deltaTime * 20.0;

    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
      process.stdout.write(`\rFPS: ${frameCount} | Rotation: ${(rotation % 360).toFixed(0)} deg    `);
      frameCount = 0;
      fpsTime = 0;
    }

    render(quadric, rotation);
    GDI32.SwapBuffers(hdc);
  }

  console.log('\n\nCleaning up...');
  GLU32.gluDeleteQuadric(quadric);
  OpenGL32.wglMakeCurrent(0n, 0n);
  OpenGL32.wglDeleteContext(hglrc);
  User32.ReleaseDC(hwnd, hdc);

  if (wndProcCallback) {
    wndProcCallback.close();
  }

  console.log('Done!');
}

main();
