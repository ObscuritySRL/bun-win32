/**
 * OpenGL Capability Reporter
 *
 * Creates a minimal hidden window, sets up an OpenGL context, and queries the
 * driver for detailed information about the GPU, supported extensions, texture
 * limits, framebuffer bit depths, and matrix stack depths.
 *
 * This is the OpenGL equivalent of running "glxinfo" on Linux -- a diagnostic
 * tool that tells you exactly what your GPU and driver support.
 *
 * APIs demonstrated:
 *   - @bun-win32/opengl32: glGetString, glGetIntegerv, wglCreateContext,
 *     wglMakeCurrent, wglDeleteContext, PreloadExtensions, wglSwapIntervalEXT
 *   - @bun-win32/user32: CreateWindowExW, GetDC, ReleaseDC, DestroyWindow
 *   - @bun-win32/kernel32: GetModuleHandleW, GetLastError
 *   - @bun-win32/gdi32: ChoosePixelFormat, SetPixelFormat
 *
 * Run with: bun run example/capabilities.ts
 */

import { ptr, CString, type Pointer } from 'bun:ffi';
import OpenGL32, { GLenum } from '../index';
import User32 from '@bun-win32/user32';
import Kernel32 from '@bun-win32/kernel32';
import GDI32 from '@bun-win32/gdi32';

// Raw GL constant values not present in the GLenum export
const GL_MAX_CLIP_PLANES = 0x0d32;
const GL_MAX_ATTRIB_STACK_DEPTH = 0x0d35;
const GL_PROJECTION_MATRIX = 0x0ba7;

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// PIXELFORMATDESCRIPTOR: 32-bit color, double-buffered, OpenGL support
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

  // Create a tiny hidden window using the built-in STATIC class.
  // It never needs to be shown; we just need its DC for the GL context.
  const hwnd = User32.CreateWindowExW(
    0,
    Buffer.from('STATIC\0', 'utf16le').ptr,
    Buffer.from('GL Caps\0', 'utf16le').ptr,
    0x00000000, // no style flags -- window stays hidden
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

function getGLString(name: GLenum): string {
  const strPtr = OpenGL32.glGetString(name);
  return readCString(strPtr);
}

function getGLInteger(pname: number): number {
  const buf = new Int32Array(1);
  OpenGL32.glGetIntegerv(pname, ptr(buf));
  return buf[0]!;
}

function getGLInteger2(pname: number): [number, number] {
  const buf = new Int32Array(2);
  OpenGL32.glGetIntegerv(pname, ptr(buf));
  return [buf[0]!, buf[1]!];
}

function main(): void {
  console.log(`${CYAN}OpenGL Capability Report${RESET}\n`);

  const { hwnd, hdc, hglrc } = createHiddenWindowAndContext();

  // Basic driver identification
  console.log(`${YELLOW}[Driver Information]${RESET}`);
  console.log(`  Vendor:     ${getGLString(GLenum.GL_VENDOR)}`);
  console.log(`  Renderer:   ${getGLString(GLenum.GL_RENDERER)}`);
  console.log(`  Version:    ${getGLString(GLenum.GL_VERSION)}`);

  // Extensions: the string is space-separated
  const extensionsStr = getGLString(GLenum.GL_EXTENSIONS);
  const extensions = extensionsStr && extensionsStr !== '(null)' ? extensionsStr.split(' ').filter(Boolean) : [];
  console.log(`  Extensions: ${extensions.length} supported`);

  if (extensions.length > 0) {
    console.log(`${DIM}`);
    // Print extensions in columns for readability
    const columnWidth = 42;
    for (let i = 0; i < Math.min(extensions.length, 60); i += 2) {
      const left = (extensions[i] || '').padEnd(columnWidth);
      const right = extensions[i + 1] || '';
      console.log(`    ${left}${right}`);
    }
    if (extensions.length > 60) {
      console.log(`    ... and ${extensions.length - 60} more`);
    }
    console.log(`${RESET}`);
  }

  // Texture and viewport limits
  console.log(`${YELLOW}[Limits]${RESET}`);
  console.log(`  Max Texture Size:            ${getGLInteger(GLenum.GL_MAX_TEXTURE_SIZE)}`);

  const viewportDims = getGLInteger2(GLenum.GL_MAX_VIEWPORT_DIMS);
  console.log(`  Max Viewport Dims:           ${viewportDims[0]} x ${viewportDims[1]}`);

  console.log(`  Max Lights:                  ${getGLInteger(GLenum.GL_MAX_LIGHTS)}`);
  console.log(`  Max Clip Planes:             ${getGLInteger(GL_MAX_CLIP_PLANES)}`);
  console.log(`  Max Modelview Stack Depth:   ${getGLInteger(GLenum.GL_MAX_MODELVIEW_STACK_DEPTH)}`);
  console.log(`  Max Projection Stack Depth:  ${getGLInteger(GLenum.GL_MAX_PROJECTION_STACK_DEPTH)}`);
  console.log(`  Max Attrib Stack Depth:      ${getGLInteger(GL_MAX_ATTRIB_STACK_DEPTH)}`);

  // Framebuffer bit depths
  console.log(`\n${YELLOW}[Framebuffer]${RESET}`);
  console.log(`  Red Bits:     ${getGLInteger(GLenum.GL_RED_BITS)}`);
  console.log(`  Green Bits:   ${getGLInteger(GLenum.GL_GREEN_BITS)}`);
  console.log(`  Blue Bits:    ${getGLInteger(GLenum.GL_BLUE_BITS)}`);
  console.log(`  Alpha Bits:   ${getGLInteger(GLenum.GL_ALPHA_BITS)}`);
  console.log(`  Depth Bits:   ${getGLInteger(GLenum.GL_DEPTH_BITS)}`);
  console.log(`  Stencil Bits: ${getGLInteger(GLenum.GL_STENCIL_BITS)}`);

  // Check for WGL_EXT_swap_control extension availability
  console.log(`\n${YELLOW}[WGL Extensions]${RESET}`);
  let hasSwapControl = false;
  try {
    OpenGL32.PreloadExtensions(['wglSwapIntervalEXT']);
    // If PreloadExtensions didn't throw, the extension loaded successfully.
    // Try calling it to verify it actually works.
    OpenGL32.wglSwapIntervalEXT(0);
    hasSwapControl = true;
  } catch {
    hasSwapControl = false;
  }
  console.log(`  wglSwapIntervalEXT (VSync): ${hasSwapControl ? `${GREEN}available${RESET}` : 'not available'}`);

  let hasExtString = false;
  try {
    OpenGL32.PreloadExtensions(['wglGetExtensionsStringEXT']);
    const wglExtPtr = OpenGL32.wglGetExtensionsStringEXT();
    const wglExtStr = readCString(wglExtPtr);
    const wglExts = wglExtStr.split(' ').filter(Boolean);
    hasExtString = true;
    console.log(`  WGL extensions count:       ${wglExts.length}`);
    if (wglExts.length > 0) {
      console.log(`${DIM}`);
      for (let i = 0; i < Math.min(wglExts.length, 20); i++) {
        console.log(`    ${wglExts[i]}`);
      }
      if (wglExts.length > 20) {
        console.log(`    ... and ${wglExts.length - 20} more`);
      }
      console.log(`${RESET}`);
    }
  } catch {
    console.log(`  wglGetExtensionsStringEXT:  not available`);
  }

  // Cleanup: release GL context, DC, and window
  console.log(`${YELLOW}[Cleanup]${RESET}`);
  OpenGL32.wglMakeCurrent(0n, 0n);
  OpenGL32.wglDeleteContext(hglrc);
  User32.ReleaseDC(hwnd, hdc);
  User32.DestroyWindow(hwnd);
  console.log(`  ${GREEN}Context and window released successfully.${RESET}`);
}

main();
