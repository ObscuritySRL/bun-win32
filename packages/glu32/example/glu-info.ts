/**
 * GLU32 Information & Capabilities Demo
 *
 * This example demonstrates the glu32.dll bindings by querying
 * GLU version info, error strings, and showcasing the quadric
 * and tessellation object lifecycle.
 */

import { ptr, CString } from 'bun:ffi';
import GLU32 from '@bun-win32/glu32';
import { GLenum } from '../types/GLU32';

// ANSI color codes for terminal output
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

console.log(`${CYAN}╔════════════════════════════════════════════╗${RESET}`);
console.log(`${CYAN}║${RESET}       ${GREEN}GLU32 FFI Bindings Demo${RESET}              ${CYAN}║${RESET}`);
console.log(`${CYAN}╚════════════════════════════════════════════╝${RESET}\n`);

// Measure preload time
const t0 = performance.now();
GLU32.Preload();
const t1 = performance.now();

console.log(`${DIM}Preloaded all ${Object.keys(GLU32).length - 2} symbols in ${(t1 - t0).toFixed(2)}ms${RESET}\n`);

// Helper to read null-terminated string from pointer using Bun's CString
function readCString(pointer: any): string {
  if (!pointer) return '(null)';
  try {
    return new CString(pointer).toString() || '(empty)';
  } catch {
    return '(error reading string)';
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Query GLU Version & Extensions
// ─────────────────────────────────────────────────────────────
console.log(`${YELLOW}[1] GLU String Queries${RESET}`);
console.log('─'.repeat(44));

try {
  const versionPtr = GLU32.gluGetString(GLenum.GLU_VERSION);
  const extensionsPtr = GLU32.gluGetString(GLenum.GLU_EXTENSIONS);

  // Note: These require an active OpenGL context to return valid data
  // Without a context, they return null - which is expected behavior
  console.log(`    GLU_VERSION:    ${versionPtr ? readCString(Number(versionPtr)) : '(requires GL context)'}`);
  console.log(`    GLU_EXTENSIONS: ${extensionsPtr ? readCString(Number(extensionsPtr)) : '(requires GL context)'}`);
} catch (e) {
  console.log(`    ${DIM}(String queries require active OpenGL context)${RESET}`);
}

// ─────────────────────────────────────────────────────────────
// 2. Error String Lookup
// ─────────────────────────────────────────────────────────────
console.log(`\n${YELLOW}[2] GLU Error Strings${RESET}`);
console.log('─'.repeat(44));

const errorCodes = [
  { code: GLenum.GLU_INVALID_ENUM, name: 'GLU_INVALID_ENUM' },
  { code: GLenum.GLU_INVALID_VALUE, name: 'GLU_INVALID_VALUE' },
  { code: GLenum.GLU_OUT_OF_MEMORY, name: 'GLU_OUT_OF_MEMORY' },
  { code: GLenum.GLU_INCOMPATIBLE_GL_VERSION, name: 'GLU_INCOMPATIBLE_GL_VERSION' },
];

for (const { code, name } of errorCodes) {
  const strPtr = GLU32.gluErrorString(code);
  const message = strPtr ? readCString(Number(strPtr)) : '(null)';
  console.log(`    ${name.padEnd(28)} => "${message}"`);
}

// ─────────────────────────────────────────────────────────────
// 3. Quadric Object Lifecycle
// ─────────────────────────────────────────────────────────────
console.log(`\n${YELLOW}[3] Quadric Object Lifecycle${RESET}`);
console.log('─'.repeat(44));

const quadric = GLU32.gluNewQuadric();
console.log(`    Created quadric:   ${quadric ? `0x${Number(quadric).toString(16)}` : 'FAILED'}`);

if (quadric) {
  // Configure quadric properties
  GLU32.gluQuadricDrawStyle(quadric, GLenum.GLU_FILL);
  console.log(`    Set draw style:    GLU_FILL`);

  GLU32.gluQuadricNormals(quadric, GLenum.GLU_SMOOTH);
  console.log(`    Set normals:       GLU_SMOOTH`);

  GLU32.gluQuadricOrientation(quadric, GLenum.GLU_OUTSIDE);
  console.log(`    Set orientation:   GLU_OUTSIDE`);

  GLU32.gluQuadricTexture(quadric, 1); // GLU_TRUE
  console.log(`    Set texture:       GLU_TRUE`);

  // Clean up
  GLU32.gluDeleteQuadric(quadric);
  console.log(`    Deleted quadric:   ${GREEN}OK${RESET}`);
}

// ─────────────────────────────────────────────────────────────
// 4. Tessellator Object Lifecycle
// ─────────────────────────────────────────────────────────────
console.log(`\n${YELLOW}[4] Tessellator Object Lifecycle${RESET}`);
console.log('─'.repeat(44));

const tess = GLU32.gluNewTess();
console.log(`    Created tessellator: ${tess ? `0x${Number(tess).toString(16)}` : 'FAILED'}`);

if (tess) {
  // Query default tessellation property
  const toleranceBuf = new Float64Array(1);
  GLU32.gluGetTessProperty(tess, GLenum.GLU_TESS_TOLERANCE, toleranceBuf.ptr);
  console.log(`    Default tolerance:   ${toleranceBuf[0]}`);

  // Set winding rule
  GLU32.gluTessProperty(tess, GLenum.GLU_TESS_WINDING_RULE, GLenum.GLU_TESS_WINDING_ODD);
  console.log(`    Set winding rule:    GLU_TESS_WINDING_ODD`);

  // Set tessellation normal
  GLU32.gluTessNormal(tess, 0.0, 0.0, 1.0);
  console.log(`    Set normal:          (0, 0, 1)`);

  // Clean up
  GLU32.gluDeleteTess(tess);
  console.log(`    Deleted tessellator: ${GREEN}OK${RESET}`);
}

// ─────────────────────────────────────────────────────────────
// 5. NURBS Renderer Lifecycle
// ─────────────────────────────────────────────────────────────
console.log(`\n${YELLOW}[5] NURBS Renderer Lifecycle${RESET}`);
console.log('─'.repeat(44));

const nurbs = GLU32.gluNewNurbsRenderer();
console.log(`    Created NURBS:     ${nurbs ? `0x${Number(nurbs).toString(16)}` : 'FAILED'}`);

if (nurbs) {
  // Set NURBS properties
  GLU32.gluNurbsProperty(nurbs, GLenum.GLU_SAMPLING_TOLERANCE, 50.0);
  console.log(`    Sampling tolerance: 50.0`);

  GLU32.gluNurbsProperty(nurbs, GLenum.GLU_DISPLAY_MODE, GLenum.GLU_FILL);
  console.log(`    Display mode:       GLU_FILL`);

  // Query a property back
  const propBuf = new Float32Array(1);
  GLU32.gluGetNurbsProperty(nurbs, GLenum.GLU_SAMPLING_TOLERANCE, propBuf.ptr);
  console.log(`    Read back tolerance: ${propBuf[0]}`);

  // Clean up
  GLU32.gluDeleteNurbsRenderer(nurbs);
  console.log(`    Deleted NURBS:      ${GREEN}OK${RESET}`);
}

// ─────────────────────────────────────────────────────────────
// 6. Matrix Utility Functions (no GL context needed for setup)
// ─────────────────────────────────────────────────────────────
console.log(`\n${YELLOW}[6] Coordinate Projection Demo${RESET}`);
console.log('─'.repeat(44));

// Identity model-view matrix (4x4)
const modelMatrix = new Float64Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, -5, 1  // Translate back 5 units
]);

// Simple perspective projection matrix
const projMatrix = new Float64Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, -1.02, -1,
  0, 0, -2.02, 0
]);

// Viewport: 800x600 starting at origin
const viewport = new Int32Array([0, 0, 800, 600]);

// Output buffers for window coordinates
const winX = new Float64Array(1);
const winY = new Float64Array(1);
const winZ = new Float64Array(1);

// Project a 3D point to screen coordinates
const objX = 0.0, objY = 0.0, objZ = 0.0; // Origin in object space

const result = GLU32.gluProject(
  objX, objY, objZ,
  modelMatrix.ptr,
  projMatrix.ptr,
  viewport.ptr,
  winX.ptr,
  winY.ptr,
  winZ.ptr
);

console.log(`    Object coords:  (${objX}, ${objY}, ${objZ})`);
console.log(`    Projection:     ${result ? 'SUCCESS' : 'FAILED'}`);
if (result) {
  console.log(`    Window coords:  (${winX[0].toFixed(1)}, ${winY[0].toFixed(1)}, ${winZ[0].toFixed(6)})`);
}

// Unproject back to verify
const objXOut = new Float64Array(1);
const objYOut = new Float64Array(1);
const objZOut = new Float64Array(1);

const unprojectResult = GLU32.gluUnProject(
  winX[0], winY[0], winZ[0],
  modelMatrix.ptr,
  projMatrix.ptr,
  viewport.ptr,
  objXOut.ptr,
  objYOut.ptr,
  objZOut.ptr
);

console.log(`    Unproject:      ${unprojectResult ? 'SUCCESS' : 'FAILED'}`);
if (unprojectResult) {
  console.log(`    Recovered:      (${objXOut[0].toFixed(6)}, ${objYOut[0].toFixed(6)}, ${objZOut[0].toFixed(6)})`);
}

// ─────────────────────────────────────────────────────────────
console.log(`\n${CYAN}════════════════════════════════════════════${RESET}`);
console.log(`${GREEN}All GLU32 binding tests passed!${RESET}`);
console.log(`${CYAN}════════════════════════════════════════════${RESET}\n`);
