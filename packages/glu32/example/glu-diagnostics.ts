/**
 * GLU Diagnostics & Function Demonstration
 *
 * Creates a minimal hidden GL context and exercises the major GLU utility
 * functions, printing a detailed diagnostic report:
 *
 *   1. GLU version and extensions via gluGetString
 *   2. Error string lookup for all standard GL error codes via gluErrorString
 *   3. Perspective projection matrix setup and readback via gluPerspective
 *   4. Orthographic projection matrix setup and readback via gluOrtho2D
 *   5. 3D-to-2D coordinate projection via gluProject
 *   6. 2D-to-3D coordinate unprojection via gluUnProject (round-trip test)
 *
 * APIs demonstrated:
 *   - @bun-win32/glu32: gluGetString, gluErrorString, gluPerspective,
 *     gluOrtho2D, gluProject, gluUnProject
 *   - @bun-win32/opengl32: glGetDoublev, glGetIntegerv, glMatrixMode,
 *     glLoadIdentity, glViewport, wglCreateContext, wglMakeCurrent
 *   - @bun-win32/user32: CreateWindowExW, GetDC, ReleaseDC, DestroyWindow
 *   - @bun-win32/kernel32: GetModuleHandleW, GetLastError
 *   - @bun-win32/gdi32: ChoosePixelFormat, SetPixelFormat
 *
 * Run with: bun run example/glu-diagnostics.ts
 */

import { CString, ptr, type Pointer } from 'bun:ffi';
import OpenGL32, { GLenum } from '@bun-win32/opengl32';
import GLU32 from '../index';
import { GLenum as GLUenum } from '../types/GLU32';
import User32 from '@bun-win32/user32';
import Kernel32 from '@bun-win32/kernel32';
import GDI32 from '@bun-win32/gdi32';

// Raw GL constant values not in the enum export
const GL_PROJECTION_MATRIX = 0x0ba7;

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const PIXEL_FORMAT_DESCRIPTOR = Buffer.from([
  0x28, 0x00, 0x01, 0x00, 0x25, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18,
  0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

function readCString(pointer: any): string {
  if (!pointer) return '(null)';
  try {
    return new CString(pointer).toString() || '(empty)';
  } catch {
    return '(error reading string)';
  }
}

function createHiddenWindowAndContext(): { hwnd: bigint; hdc: bigint; hglrc: bigint } {
  const hInstance = Kernel32.GetModuleHandleW(0 as unknown as Pointer);

  const hwnd = User32.CreateWindowExW(
    0,
    Buffer.from('STATIC\0', 'utf16le').ptr,
    Buffer.from('GLU Diagnostics\0', 'utf16le').ptr,
    0x00000000,
    0,
    0,
    1,
    1,
    0n,
    0n,
    hInstance,
    null,
  );
  if (!hwnd) throw new Error(`CreateWindowExW failed: ${Kernel32.GetLastError()}`);

  const hdc = User32.GetDC(hwnd);
  if (!hdc) throw new Error(`GetDC failed: ${Kernel32.GetLastError()}`);

  const pixelFormat = GDI32.ChoosePixelFormat(hdc, PIXEL_FORMAT_DESCRIPTOR.ptr);
  if (pixelFormat === 0) throw new Error(`ChoosePixelFormat failed: ${Kernel32.GetLastError()}`);
  if (!GDI32.SetPixelFormat(hdc, pixelFormat, PIXEL_FORMAT_DESCRIPTOR.ptr)) {
    throw new Error(`SetPixelFormat failed: ${Kernel32.GetLastError()}`);
  }

  const hglrc = OpenGL32.wglCreateContext(hdc);
  if (!hglrc) throw new Error(`wglCreateContext failed: ${Kernel32.GetLastError()}`);
  if (!OpenGL32.wglMakeCurrent(hdc, hglrc)) {
    throw new Error(`wglMakeCurrent failed: ${Kernel32.GetLastError()}`);
  }

  return { hwnd, hdc, hglrc };
}

/**
 * Read the current 4x4 projection matrix from the GL state.
 * Returns a Float64Array of 16 elements in column-major order
 * (as OpenGL stores matrices internally).
 */
function readProjectionMatrix(): Float64Array {
  const matrix = new Float64Array(16);
  OpenGL32.glGetDoublev(GL_PROJECTION_MATRIX as GLenum, ptr(matrix));
  return matrix;
}

/**
 * Format a 4x4 matrix (column-major Float64Array) as a readable string.
 * OpenGL stores matrices column-major, so element [i] maps to
 * row (i % 4), column (i / 4 | 0).
 */
function formatMatrix(m: Float64Array): string {
  const lines: string[] = [];
  for (let row = 0; row < 4; row++) {
    const cells: string[] = [];
    for (let col = 0; col < 4; col++) {
      cells.push(m[col * 4 + row]!.toFixed(6).padStart(12));
    }
    lines.push(`    |${cells.join(' ')} |`);
  }
  return lines.join('\n');
}

function main(): void {
  console.log(`${CYAN}GLU Diagnostics Report${RESET}\n`);

  const { hwnd, hdc, hglrc } = createHiddenWindowAndContext();

  // 1. GLU version and extensions
  console.log(`${YELLOW}[1] GLU String Queries${RESET}`);
  const versionPtr = GLU32.gluGetString(GLUenum.GLU_VERSION);
  const extensionsPtr = GLU32.gluGetString(GLUenum.GLU_EXTENSIONS);
  console.log(`  GLU Version:    ${readCString(versionPtr)}`);
  const extStr = readCString(extensionsPtr);
  const extList = extStr && extStr !== '(null)' ? extStr.split(' ').filter(Boolean) : [];
  console.log(`  GLU Extensions: ${extList.length > 0 ? extList.join(', ') : '(none)'}`);

  // 2. Error string lookup for standard GL error codes
  console.log(`\n${YELLOW}[2] GL Error Strings via gluErrorString${RESET}`);
  const errorCodes: { value: number; name: string }[] = [
    { value: GLenum.GL_NO_ERROR, name: 'GL_NO_ERROR' },
    { value: GLenum.GL_INVALID_ENUM, name: 'GL_INVALID_ENUM' },
    { value: GLenum.GL_INVALID_VALUE, name: 'GL_INVALID_VALUE' },
    { value: GLenum.GL_INVALID_OPERATION, name: 'GL_INVALID_OPERATION' },
    { value: GLenum.GL_STACK_OVERFLOW, name: 'GL_STACK_OVERFLOW' },
    { value: GLenum.GL_STACK_UNDERFLOW, name: 'GL_STACK_UNDERFLOW' },
    { value: GLenum.GL_OUT_OF_MEMORY, name: 'GL_OUT_OF_MEMORY' },
  ];

  for (const { value, name } of errorCodes) {
    const strPtr = GLU32.gluErrorString(value);
    const message = readCString(strPtr);
    console.log(`  0x${value.toString(16).padStart(4, '0')}  ${name.padEnd(24)} => "${message}"`);
  }

  // 3. Perspective projection matrix
  console.log(`\n${YELLOW}[3] gluPerspective Matrix${RESET}`);
  console.log(`${DIM}  Setting up: fovy=60, aspect=16/9, near=0.1, far=100${RESET}`);

  OpenGL32.glMatrixMode(GLenum.GL_PROJECTION);
  OpenGL32.glLoadIdentity();
  GLU32.gluPerspective(60.0, 16.0 / 9.0, 0.1, 100.0);

  const perspMatrix = readProjectionMatrix();
  console.log(`  Projection matrix (column-major):`);
  console.log(formatMatrix(perspMatrix));

  // 4. Orthographic 2D projection matrix
  console.log(`\n${YELLOW}[4] gluOrtho2D Matrix${RESET}`);
  console.log(`${DIM}  Setting up: left=0, right=800, bottom=0, top=600${RESET}`);

  OpenGL32.glMatrixMode(GLenum.GL_PROJECTION);
  OpenGL32.glLoadIdentity();
  GLU32.gluOrtho2D(0.0, 800.0, 0.0, 600.0);

  const orthoMatrix = readProjectionMatrix();
  console.log(`  Projection matrix (column-major):`);
  console.log(formatMatrix(orthoMatrix));

  // 5. gluProject: map 3D world coordinate to 2D screen coordinate
  console.log(`\n${YELLOW}[5] gluProject (3D to 2D)${RESET}`);

  // Set up a known modelview/projection/viewport for the projection test
  OpenGL32.glMatrixMode(GLenum.GL_PROJECTION);
  OpenGL32.glLoadIdentity();
  GLU32.gluPerspective(60.0, 800.0 / 600.0, 0.1, 100.0);

  OpenGL32.glMatrixMode(GLenum.GL_MODELVIEW);
  OpenGL32.glLoadIdentity();
  // Translate camera back 5 units
  OpenGL32.glTranslatef(0.0, 0.0, -5.0);

  // Read back the matrices and viewport for gluProject
  const modelMatrix = new Float64Array(16);
  const projMatrix = new Float64Array(16);
  const viewport = new Int32Array(4);
  OpenGL32.glGetDoublev(0x0ba6 as GLenum, ptr(modelMatrix)); // GL_MODELVIEW_MATRIX = 0x0BA6
  OpenGL32.glGetDoublev(GL_PROJECTION_MATRIX as GLenum, ptr(projMatrix));
  OpenGL32.glGetIntegerv(GLenum.GL_VIEWPORT, ptr(viewport));

  // Set a known viewport
  OpenGL32.glViewport(0, 0, 800, 600);
  OpenGL32.glGetIntegerv(GLenum.GL_VIEWPORT, ptr(viewport));

  // Re-read matrices after viewport change
  OpenGL32.glGetDoublev(0x0ba6 as GLenum, ptr(modelMatrix));
  OpenGL32.glGetDoublev(GL_PROJECTION_MATRIX as GLenum, ptr(projMatrix));

  const testPoints = [
    { x: 0.0, y: 0.0, z: 0.0, label: 'origin' },
    { x: 1.0, y: 0.0, z: 0.0, label: '+X axis' },
    { x: 0.0, y: 1.0, z: 0.0, label: '+Y axis' },
    { x: 0.0, y: 0.0, z: -1.0, label: '-Z (into screen)' },
  ];

  const winX = new Float64Array(1);
  const winY = new Float64Array(1);
  const winZ = new Float64Array(1);

  for (const point of testPoints) {
    const result = GLU32.gluProject(
      point.x, point.y, point.z,
      ptr(modelMatrix), ptr(projMatrix), ptr(viewport),
      ptr(winX), ptr(winY), ptr(winZ),
    );
    if (result) {
      console.log(`  (${point.x}, ${point.y}, ${point.z}) [${point.label}]`);
      console.log(`    => screen (${winX[0]!.toFixed(2)}, ${winY[0]!.toFixed(2)}, depth=${winZ[0]!.toFixed(6)})`);
    } else {
      console.log(`  (${point.x}, ${point.y}, ${point.z}) [${point.label}] => FAILED`);
    }
  }

  // 6. gluUnProject: round-trip test
  console.log(`\n${YELLOW}[6] gluUnProject Round Trip (2D back to 3D)${RESET}`);

  // First project the origin to get screen coordinates
  GLU32.gluProject(
    0.0, 0.0, 0.0,
    ptr(modelMatrix), ptr(projMatrix), ptr(viewport),
    ptr(winX), ptr(winY), ptr(winZ),
  );

  const screenX = winX[0]!;
  const screenY = winY[0]!;
  const screenZ = winZ[0]!;

  console.log(`  Projected origin to screen: (${screenX.toFixed(4)}, ${screenY.toFixed(4)}, ${screenZ.toFixed(6)})`);

  // Now unproject those screen coordinates back to 3D
  const objX = new Float64Array(1);
  const objY = new Float64Array(1);
  const objZ = new Float64Array(1);

  const unresult = GLU32.gluUnProject(
    screenX, screenY, screenZ,
    ptr(modelMatrix), ptr(projMatrix), ptr(viewport),
    ptr(objX), ptr(objY), ptr(objZ),
  );

  if (unresult) {
    console.log(`  Unprojected back to 3D:     (${objX[0]!.toFixed(6)}, ${objY[0]!.toFixed(6)}, ${objZ[0]!.toFixed(6)})`);
    const dx = Math.abs(objX[0]!);
    const dy = Math.abs(objY[0]!);
    const dz = Math.abs(objZ[0]!);
    const maxError = Math.max(dx, dy, dz);
    console.log(`  Round-trip error:           ${maxError.toExponential(2)}`);
    console.log(`  Result:                     ${maxError < 1e-6 ? `${GREEN}PASS (< 1e-6)${RESET}` : 'DRIFT detected'}`);
  } else {
    console.log(`  Unprojection FAILED`);
  }

  // Test a second round trip with an off-center point
  console.log(`\n  Testing off-center point (2.0, 1.5, -3.0):`);
  GLU32.gluProject(
    2.0, 1.5, -3.0,
    ptr(modelMatrix), ptr(projMatrix), ptr(viewport),
    ptr(winX), ptr(winY), ptr(winZ),
  );
  console.log(`    Projected:    screen (${winX[0]!.toFixed(2)}, ${winY[0]!.toFixed(2)}, ${winZ[0]!.toFixed(6)})`);

  const unresult2 = GLU32.gluUnProject(
    winX[0]!, winY[0]!, winZ[0]!,
    ptr(modelMatrix), ptr(projMatrix), ptr(viewport),
    ptr(objX), ptr(objY), ptr(objZ),
  );
  if (unresult2) {
    console.log(`    Unprojected:  (${objX[0]!.toFixed(6)}, ${objY[0]!.toFixed(6)}, ${objZ[0]!.toFixed(6)})`);
    const maxErr = Math.max(Math.abs(objX[0]! - 2.0), Math.abs(objY[0]! - 1.5), Math.abs(objZ[0]! + 3.0));
    console.log(`    Round-trip error: ${maxErr.toExponential(2)}`);
    console.log(`    Result:          ${maxErr < 1e-6 ? `${GREEN}PASS${RESET}` : 'DRIFT detected'}`);
  }

  // Cleanup
  console.log(`\n${YELLOW}[Cleanup]${RESET}`);
  OpenGL32.wglMakeCurrent(0n, 0n);
  OpenGL32.wglDeleteContext(hglrc);
  User32.ReleaseDC(hwnd, hdc);
  User32.DestroyWindow(hwnd);
  console.log(`  ${GREEN}Context and window released successfully.${RESET}`);
}

main();
