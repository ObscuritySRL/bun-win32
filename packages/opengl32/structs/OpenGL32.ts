import { type FFIFunction, FFIType, CFunction } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  INT,
  UINT,
  DWORD,
  GLbitfield,
  GLboolean,
  GLboolean_,
  GLbyte,
  GLbyte_,
  GLchar_,
  GLclampd,
  GLclampf,
  GLclampf_,
  GLdouble,
  GLdouble_,
  GLenum,
  GLenum_,
  GLfloat,
  GLfloat_,
  GLint,
  GLint_,
  GLintptr,
  GLshort,
  GLshort_,
  GLsizei,
  GLsizei_,
  GLsizeiptr,
  GLubyte,
  GLubyte_,
  GLuint,
  GLuint_,
  GLushort,
  GLushort_,
  GLvoid_,
  HDC,
  HGLRC,
  PROC,
  LPCSTR,
  LPPIXELFORMATDESCRIPTOR,
  LPLAYERPLANEDESCRIPTOR,
  LPGLYPHMETRICSFLOAT,
  LPWGLSWAP,
  NULL,
} from '../types/OpenGL32';

/**
 * Thin, lazy-loaded FFI bindings for `opengl32.dll` (OpenGL 1.1 + WGL).
 *
 * Each static method corresponds one-to-one with a native export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import OpenGL32 from './structs/OpenGL32';
 *
 * // Lazy: bind on first call
 * OpenGL32.glGetString(GLenum.GL_VENDOR);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * OpenGL32.Preload(['glGetString', 'glClear', 'wglGetProcAddress']);
 * ```
 */
class OpenGL32 extends Win32 {
  protected static override name = 'opengl32.dll';

  /**
   * Lazily binds a single OpenGL extension via `wglGetProcAddress` and memoizes it.
   *
   * Requires an active OpenGL context. If the extension is unavailable, throws an error.
   * Subsequent calls go directly through the memoized native function.
   *
   * @param method Exact extension name from `ExtensionSymbols`.
   * @returns The bound native function.
   * @throws Error if extension is not available.
   */
  private static LoadExtension<T extends keyof typeof OpenGL32.ExtensionSymbols>(method: T): (typeof OpenGL32)[T] {
    const skip = Object.getOwnPropertyDescriptor(OpenGL32, method)?.configurable === false;

    if (skip) {
      return OpenGL32[method];
    }

    const lpszProc = Buffer.from(`${method}\0`, 'utf8');
    const proc = OpenGL32.wglGetProcAddress(lpszProc.ptr);

    if (!proc || proc === 0) {
      throw new Error(`OpenGL extension '${method}' is not available. Ensure an OpenGL context is current.`);
    }

    const spec = OpenGL32.ExtensionSymbols[method];
    const fn = CFunction({
      ptr: proc,
      args: spec.args,
      returns: spec.returns,
    });

    Object.defineProperty(OpenGL32, method, { configurable: false, value: fn });

    return OpenGL32[method];
  }

  /**
   * Eagerly loads multiple OpenGL extensions at once.
   *
   * Requires an active OpenGL context. Pass a subset of extension names to load
   * only what you need; when omitted, all extensions in `ExtensionSymbols` are loaded.
   * Unavailable extensions are silently skipped.
   *
   * @param methods Optional list of extension names to load.
   * @example
   * ```ts
   * // After creating an OpenGL context:
   * OpenGL32.PreloadExtensions(['wglSwapIntervalEXT', 'wglGetSwapIntervalEXT']);
   * OpenGL32.wglSwapIntervalEXT(1); // Enable VSync
   * ```
   */
  public static PreloadExtensions(methods?: (keyof typeof OpenGL32.ExtensionSymbols)[]): void {
    methods ??= Object.keys(OpenGL32.ExtensionSymbols) as (keyof typeof OpenGL32.ExtensionSymbols)[];

    for (const method of methods) {
      try {
        OpenGL32.LoadExtension(method);
      } catch {
        // Extension not available, skip silently
      }
    }
  }

  /**
   * Extension function signatures loaded via `wglGetProcAddress`.
   *
   * These are OpenGL/WGL extensions not exported by opengl32.dll directly.
   * Use `LoadExtensions` after creating an OpenGL context to bind them.
   */
  private static readonly ExtensionSymbols = {
    // WGL_ARB_extensions_string
    wglGetExtensionsStringARB: { args: [FFIType.u64], returns: FFIType.ptr },

    // WGL_ARB_pixel_format
    wglChoosePixelFormatARB: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    wglGetPixelFormatAttribfvARB: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    wglGetPixelFormatAttribivARB: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },

    // WGL_ARB_create_context
    wglCreateContextAttribsARB: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },

    // WGL_EXT_extensions_string
    wglGetExtensionsStringEXT: { args: [], returns: FFIType.ptr },

    // WGL_EXT_swap_control
    wglGetSwapIntervalEXT: { args: [], returns: FFIType.i32 },
    wglSwapIntervalEXT: { args: [FFIType.i32], returns: FFIType.i32 },

    // GL_ARB_vertex_buffer_object / OpenGL 1.5+
    glBindBuffer: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glBufferData: { args: [FFIType.u32, FFIType.i64, FFIType.ptr, FFIType.u32], returns: FFIType.void },
    glBufferSubData: { args: [FFIType.u32, FFIType.i64, FFIType.i64, FFIType.ptr], returns: FFIType.void },
    glDeleteBuffers: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glGenBuffers: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glGetBufferParameteriv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetBufferPointerv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetBufferSubData: { args: [FFIType.u32, FFIType.i64, FFIType.i64, FFIType.ptr], returns: FFIType.void },
    glIsBuffer: { args: [FFIType.u32], returns: FFIType.u8 },
    glMapBuffer: { args: [FFIType.u32, FFIType.u32], returns: FFIType.ptr },
    glUnmapBuffer: { args: [FFIType.u32], returns: FFIType.u8 },

    // GL_ARB_shader_objects / OpenGL 2.0+
    glAttachShader: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glCompileShader: { args: [FFIType.u32], returns: FFIType.void },
    glCreateProgram: { args: [], returns: FFIType.u32 },
    glCreateShader: { args: [FFIType.u32], returns: FFIType.u32 },
    glDeleteProgram: { args: [FFIType.u32], returns: FFIType.void },
    glDeleteShader: { args: [FFIType.u32], returns: FFIType.void },
    glDetachShader: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glGetProgramInfoLog: { args: [FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glGetProgramiv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetShaderInfoLog: { args: [FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glGetShaderiv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetShaderSource: { args: [FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glGetUniformLocation: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    glIsProgram: { args: [FFIType.u32], returns: FFIType.u8 },
    glIsShader: { args: [FFIType.u32], returns: FFIType.u8 },
    glLinkProgram: { args: [FFIType.u32], returns: FFIType.void },
    glShaderSource: { args: [FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glUniform1f: { args: [FFIType.i32, FFIType.f32], returns: FFIType.void },
    glUniform1fv: { args: [FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glUniform1i: { args: [FFIType.i32, FFIType.i32], returns: FFIType.void },
    glUniform1iv: { args: [FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glUniform2f: { args: [FFIType.i32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glUniform2fv: { args: [FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glUniform2i: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glUniform2iv: { args: [FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glUniform3f: { args: [FFIType.i32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glUniform3fv: { args: [FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glUniform3i: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glUniform3iv: { args: [FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glUniform4f: { args: [FFIType.i32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glUniform4fv: { args: [FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glUniform4i: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glUniform4iv: { args: [FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glUniformMatrix2fv: { args: [FFIType.i32, FFIType.i32, FFIType.u8, FFIType.ptr], returns: FFIType.void },
    glUniformMatrix3fv: { args: [FFIType.i32, FFIType.i32, FFIType.u8, FFIType.ptr], returns: FFIType.void },
    glUniformMatrix4fv: { args: [FFIType.i32, FFIType.i32, FFIType.u8, FFIType.ptr], returns: FFIType.void },
    glUseProgram: { args: [FFIType.u32], returns: FFIType.void },
    glValidateProgram: { args: [FFIType.u32], returns: FFIType.void },

    // GL_ARB_vertex_shader / OpenGL 2.0+
    glBindAttribLocation: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glDisableVertexAttribArray: { args: [FFIType.u32], returns: FFIType.void },
    glEnableVertexAttribArray: { args: [FFIType.u32], returns: FFIType.void },
    glGetActiveAttrib: { args: [FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glGetActiveUniform: { args: [FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glGetAttribLocation: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    glGetVertexAttribdv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetVertexAttribfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetVertexAttribiv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetVertexAttribPointerv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib1d: { args: [FFIType.u32, FFIType.f64], returns: FFIType.void },
    glVertexAttrib1dv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib1f: { args: [FFIType.u32, FFIType.f32], returns: FFIType.void },
    glVertexAttrib1fv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib1s: { args: [FFIType.u32, FFIType.i16], returns: FFIType.void },
    glVertexAttrib1sv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib2d: { args: [FFIType.u32, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glVertexAttrib2dv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib2f: { args: [FFIType.u32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glVertexAttrib2fv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib2s: { args: [FFIType.u32, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glVertexAttrib2sv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib3d: { args: [FFIType.u32, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glVertexAttrib3dv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib3f: { args: [FFIType.u32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glVertexAttrib3fv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib3s: { args: [FFIType.u32, FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glVertexAttrib3sv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4bv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4d: { args: [FFIType.u32, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glVertexAttrib4dv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4f: { args: [FFIType.u32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glVertexAttrib4fv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4iv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4Nbv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4Niv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4Nsv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4Nub: { args: [FFIType.u32, FFIType.u8, FFIType.u8, FFIType.u8, FFIType.u8], returns: FFIType.void },
    glVertexAttrib4Nubv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4Nuiv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4Nusv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4s: { args: [FFIType.u32, FFIType.i16, FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glVertexAttrib4sv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4ubv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4uiv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttrib4usv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glVertexAttribPointer: { args: [FFIType.u32, FFIType.i32, FFIType.u32, FFIType.u8, FFIType.i32, FFIType.ptr], returns: FFIType.void },

    // GL_ARB_vertex_array_object / OpenGL 3.0+
    glBindVertexArray: { args: [FFIType.u32], returns: FFIType.void },
    glDeleteVertexArrays: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glGenVertexArrays: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glIsVertexArray: { args: [FFIType.u32], returns: FFIType.u8 },

    // GL_ARB_framebuffer_object / OpenGL 3.0+
    glBindFramebuffer: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glBindRenderbuffer: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glCheckFramebufferStatus: { args: [FFIType.u32], returns: FFIType.u32 },
    glDeleteFramebuffers: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glDeleteRenderbuffers: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glFramebufferRenderbuffer: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.void },
    glFramebufferTexture2D: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.void },
    glGenFramebuffers: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glGenRenderbuffers: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glGenerateMipmap: { args: [FFIType.u32], returns: FFIType.void },
    glGetFramebufferAttachmentParameteriv: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetRenderbufferParameteriv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glIsFramebuffer: { args: [FFIType.u32], returns: FFIType.u8 },
    glIsRenderbuffer: { args: [FFIType.u32], returns: FFIType.u8 },
    glRenderbufferStorage: { args: [FFIType.u32, FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.void },
  } as const;

  /** @inheritdoc */
  protected static override readonly Symbols = {
    glAccum: { args: [FFIType.u32, FFIType.f32], returns: FFIType.void },
    glAlphaFunc: { args: [FFIType.u32, FFIType.f32], returns: FFIType.void },
    glAreTexturesResident: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    glArrayElement: { args: [FFIType.i32], returns: FFIType.void },
    glBegin: { args: [FFIType.u32], returns: FFIType.void },
    glBindTexture: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glBitmap: { args: [FFIType.i32, FFIType.i32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.ptr], returns: FFIType.void },
    glBlendFunc: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glCallList: { args: [FFIType.u32], returns: FFIType.void },
    glCallLists: { args: [FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glClear: { args: [FFIType.u32], returns: FFIType.void },
    glClearAccum: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glClearColor: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glClearDepth: { args: [FFIType.f64], returns: FFIType.void },
    glClearIndex: { args: [FFIType.f32], returns: FFIType.void },
    glClearStencil: { args: [FFIType.i32], returns: FFIType.void },
    glClipPlane: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glColor3b: { args: [FFIType.i8, FFIType.i8, FFIType.i8], returns: FFIType.void },
    glColor3bv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor3d: { args: [FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glColor3dv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor3f: { args: [FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glColor3fv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor3i: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glColor3iv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor3s: { args: [FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glColor3sv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor3ub: { args: [FFIType.u8, FFIType.u8, FFIType.u8], returns: FFIType.void },
    glColor3ubv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor3ui: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.void },
    glColor3uiv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor3us: { args: [FFIType.u16, FFIType.u16, FFIType.u16], returns: FFIType.void },
    glColor3usv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor4b: { args: [FFIType.i8, FFIType.i8, FFIType.i8, FFIType.i8], returns: FFIType.void },
    glColor4bv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor4d: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glColor4dv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor4f: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glColor4fv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor4i: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glColor4iv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor4s: { args: [FFIType.i16, FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glColor4sv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor4ub: { args: [FFIType.u8, FFIType.u8, FFIType.u8, FFIType.u8], returns: FFIType.void },
    glColor4ubv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor4ui: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.void },
    glColor4uiv: { args: [FFIType.ptr], returns: FFIType.void },
    glColor4us: { args: [FFIType.u16, FFIType.u16, FFIType.u16, FFIType.u16], returns: FFIType.void },
    glColor4usv: { args: [FFIType.ptr], returns: FFIType.void },
    glColorMask: { args: [FFIType.u8, FFIType.u8, FFIType.u8, FFIType.u8], returns: FFIType.void },
    glColorMaterial: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glColorPointer: { args: [FFIType.i32, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glCopyPixels: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.void },
    glCopyTexImage1D: { args: [FFIType.u32, FFIType.i32, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glCopyTexImage2D: { args: [FFIType.u32, FFIType.i32, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glCopyTexSubImage1D: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glCopyTexSubImage2D: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glCullFace: { args: [FFIType.u32], returns: FFIType.void },
    glDeleteLists: { args: [FFIType.u32, FFIType.i32], returns: FFIType.void },
    glDeleteTextures: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glDepthFunc: { args: [FFIType.u32], returns: FFIType.void },
    glDepthMask: { args: [FFIType.u8], returns: FFIType.void },
    glDepthRange: { args: [FFIType.f64, FFIType.f64], returns: FFIType.void },
    glDisable: { args: [FFIType.u32], returns: FFIType.void },
    glDisableClientState: { args: [FFIType.u32], returns: FFIType.void },
    glDrawArrays: { args: [FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glDrawBuffer: { args: [FFIType.u32], returns: FFIType.void },
    glDrawElements: { args: [FFIType.u32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glDrawPixels: { args: [FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glEdgeFlag: { args: [FFIType.u8], returns: FFIType.void },
    glEdgeFlagPointer: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glEdgeFlagv: { args: [FFIType.ptr], returns: FFIType.void },
    glEnable: { args: [FFIType.u32], returns: FFIType.void },
    glEnableClientState: { args: [FFIType.u32], returns: FFIType.void },
    glEnd: { args: [], returns: FFIType.void },
    glEndList: { args: [], returns: FFIType.void },
    glEvalCoord1d: { args: [FFIType.f64], returns: FFIType.void },
    glEvalCoord1dv: { args: [FFIType.ptr], returns: FFIType.void },
    glEvalCoord1f: { args: [FFIType.f32], returns: FFIType.void },
    glEvalCoord1fv: { args: [FFIType.ptr], returns: FFIType.void },
    glEvalCoord2d: { args: [FFIType.f64, FFIType.f64], returns: FFIType.void },
    glEvalCoord2dv: { args: [FFIType.ptr], returns: FFIType.void },
    glEvalCoord2f: { args: [FFIType.f32, FFIType.f32], returns: FFIType.void },
    glEvalCoord2fv: { args: [FFIType.ptr], returns: FFIType.void },
    glEvalMesh1: { args: [FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glEvalMesh2: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glEvalPoint1: { args: [FFIType.i32], returns: FFIType.void },
    glEvalPoint2: { args: [FFIType.i32, FFIType.i32], returns: FFIType.void },
    glFeedbackBuffer: { args: [FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glFinish: { args: [], returns: FFIType.void },
    glFlush: { args: [], returns: FFIType.void },
    glFogf: { args: [FFIType.u32, FFIType.f32], returns: FFIType.void },
    glFogfv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glFogi: { args: [FFIType.u32, FFIType.i32], returns: FFIType.void },
    glFogiv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glFrontFace: { args: [FFIType.u32], returns: FFIType.void },
    glFrustum: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glGenLists: { args: [FFIType.i32], returns: FFIType.u32 },
    glGenTextures: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glGetBooleanv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetClipPlane: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetDoublev: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetError: { args: [], returns: FFIType.u32 },
    glGetFloatv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetIntegerv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetLightfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetLightiv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetMapdv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetMapfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetMapiv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetMaterialfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetMaterialiv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetPixelMapfv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetPixelMapuiv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetPixelMapusv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetPointerv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetPolygonStipple: { args: [FFIType.ptr], returns: FFIType.void },
    glGetString: { args: [FFIType.u32], returns: FFIType.ptr },
    glGetTexEnvfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetTexEnviv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetTexGendv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetTexGenfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetTexGeniv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetTexImage: { args: [FFIType.u32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetTexLevelParameterfv: { args: [FFIType.u32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetTexLevelParameteriv: { args: [FFIType.u32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetTexParameterfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glGetTexParameteriv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glHint: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glIndexd: { args: [FFIType.f64], returns: FFIType.void },
    glIndexdv: { args: [FFIType.ptr], returns: FFIType.void },
    glIndexf: { args: [FFIType.f32], returns: FFIType.void },
    glIndexfv: { args: [FFIType.ptr], returns: FFIType.void },
    glIndexi: { args: [FFIType.i32], returns: FFIType.void },
    glIndexiv: { args: [FFIType.ptr], returns: FFIType.void },
    glIndexMask: { args: [FFIType.u32], returns: FFIType.void },
    glIndexPointer: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glIndexs: { args: [FFIType.i16], returns: FFIType.void },
    glIndexsv: { args: [FFIType.ptr], returns: FFIType.void },
    glIndexub: { args: [FFIType.u8], returns: FFIType.void },
    glIndexubv: { args: [FFIType.ptr], returns: FFIType.void },
    glInitNames: { args: [], returns: FFIType.void },
    glInterleavedArrays: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glIsEnabled: { args: [FFIType.u32], returns: FFIType.u8 },
    glIsList: { args: [FFIType.u32], returns: FFIType.u8 },
    glIsTexture: { args: [FFIType.u32], returns: FFIType.u8 },
    glLightf: { args: [FFIType.u32, FFIType.u32, FFIType.f32], returns: FFIType.void },
    glLightfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glLighti: { args: [FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.void },
    glLightiv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glLightModelf: { args: [FFIType.u32, FFIType.f32], returns: FFIType.void },
    glLightModelfv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glLightModeli: { args: [FFIType.u32, FFIType.i32], returns: FFIType.void },
    glLightModeliv: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glLineStipple: { args: [FFIType.i32, FFIType.u16], returns: FFIType.void },
    glLineWidth: { args: [FFIType.f32], returns: FFIType.void },
    glListBase: { args: [FFIType.u32], returns: FFIType.void },
    glLoadIdentity: { args: [], returns: FFIType.void },
    glLoadMatrixd: { args: [FFIType.ptr], returns: FFIType.void },
    glLoadMatrixf: { args: [FFIType.ptr], returns: FFIType.void },
    glLoadName: { args: [FFIType.u32], returns: FFIType.void },
    glLogicOp: { args: [FFIType.u32], returns: FFIType.void },
    glMap1d: { args: [FFIType.u32, FFIType.f64, FFIType.f64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glMap1f: { args: [FFIType.u32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glMap2d: { args: [FFIType.u32, FFIType.f64, FFIType.f64, FFIType.i32, FFIType.i32, FFIType.f64, FFIType.f64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void }, // prettier-ignore
    glMap2f: { args: [FFIType.u32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.i32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.void }, // prettier-ignore
    glMapGrid1d: { args: [FFIType.i32, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glMapGrid1f: { args: [FFIType.i32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glMapGrid2d: { args: [FFIType.i32, FFIType.f64, FFIType.f64, FFIType.i32, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glMapGrid2f: { args: [FFIType.i32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glMaterialf: { args: [FFIType.u32, FFIType.u32, FFIType.f32], returns: FFIType.void },
    glMaterialfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glMateriali: { args: [FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.void },
    glMaterialiv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glMatrixMode: { args: [FFIType.u32], returns: FFIType.void },
    glMultMatrixd: { args: [FFIType.ptr], returns: FFIType.void },
    glMultMatrixf: { args: [FFIType.ptr], returns: FFIType.void },
    glNewList: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glNormal3b: { args: [FFIType.i8, FFIType.i8, FFIType.i8], returns: FFIType.void },
    glNormal3bv: { args: [FFIType.ptr], returns: FFIType.void },
    glNormal3d: { args: [FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glNormal3dv: { args: [FFIType.ptr], returns: FFIType.void },
    glNormal3f: { args: [FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glNormal3fv: { args: [FFIType.ptr], returns: FFIType.void },
    glNormal3i: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glNormal3iv: { args: [FFIType.ptr], returns: FFIType.void },
    glNormal3s: { args: [FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glNormal3sv: { args: [FFIType.ptr], returns: FFIType.void },
    glNormalPointer: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glOrtho: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glPassThrough: { args: [FFIType.f32], returns: FFIType.void },
    glPixelMapfv: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glPixelMapuiv: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glPixelMapusv: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glPixelStoref: { args: [FFIType.u32, FFIType.f32], returns: FFIType.void },
    glPixelStorei: { args: [FFIType.u32, FFIType.i32], returns: FFIType.void },
    glPixelTransferf: { args: [FFIType.u32, FFIType.f32], returns: FFIType.void },
    glPixelTransferi: { args: [FFIType.u32, FFIType.i32], returns: FFIType.void },
    glPixelZoom: { args: [FFIType.f32, FFIType.f32], returns: FFIType.void },
    glPointSize: { args: [FFIType.f32], returns: FFIType.void },
    glPolygonMode: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    glPolygonOffset: { args: [FFIType.f32, FFIType.f32], returns: FFIType.void },
    glPolygonStipple: { args: [FFIType.ptr], returns: FFIType.void },
    glPopAttrib: { args: [], returns: FFIType.void },
    glPopClientAttrib: { args: [], returns: FFIType.void },
    glPopMatrix: { args: [], returns: FFIType.void },
    glPopName: { args: [], returns: FFIType.void },
    glPrioritizeTextures: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glPushAttrib: { args: [FFIType.u32], returns: FFIType.void },
    glPushClientAttrib: { args: [FFIType.u32], returns: FFIType.void },
    glPushMatrix: { args: [], returns: FFIType.void },
    glPushName: { args: [FFIType.u32], returns: FFIType.void },
    glRasterPos2d: { args: [FFIType.f64, FFIType.f64], returns: FFIType.void },
    glRasterPos2dv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos2f: { args: [FFIType.f32, FFIType.f32], returns: FFIType.void },
    glRasterPos2fv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos2i: { args: [FFIType.i32, FFIType.i32], returns: FFIType.void },
    glRasterPos2iv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos2s: { args: [FFIType.i16, FFIType.i16], returns: FFIType.void },
    glRasterPos2sv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos3d: { args: [FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glRasterPos3dv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos3f: { args: [FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glRasterPos3fv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos3i: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glRasterPos3iv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos3s: { args: [FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glRasterPos3sv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos4d: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glRasterPos4dv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos4f: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glRasterPos4fv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos4i: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glRasterPos4iv: { args: [FFIType.ptr], returns: FFIType.void },
    glRasterPos4s: { args: [FFIType.i16, FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glRasterPos4sv: { args: [FFIType.ptr], returns: FFIType.void },
    glReadBuffer: { args: [FFIType.u32], returns: FFIType.void },
    glReadPixels: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glRectd: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glRectdv: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glRectf: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glRectfv: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glRecti: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glRectiv: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glRects: { args: [FFIType.i16, FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glRectsv: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    glRenderMode: { args: [FFIType.u32], returns: FFIType.i32 },
    glRotated: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glRotatef: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glScaled: { args: [FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glScalef: { args: [FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glScissor: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glSelectBuffer: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glShadeModel: { args: [FFIType.u32], returns: FFIType.void },
    glStencilFunc: { args: [FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.void },
    glStencilMask: { args: [FFIType.u32], returns: FFIType.void },
    glStencilOp: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.void },
    glTexCoord1d: { args: [FFIType.f64], returns: FFIType.void },
    glTexCoord1dv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord1f: { args: [FFIType.f32], returns: FFIType.void },
    glTexCoord1fv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord1i: { args: [FFIType.i32], returns: FFIType.void },
    glTexCoord1iv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord1s: { args: [FFIType.i16], returns: FFIType.void },
    glTexCoord1sv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord2d: { args: [FFIType.f64, FFIType.f64], returns: FFIType.void },
    glTexCoord2dv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord2f: { args: [FFIType.f32, FFIType.f32], returns: FFIType.void },
    glTexCoord2fv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord2i: { args: [FFIType.i32, FFIType.i32], returns: FFIType.void },
    glTexCoord2iv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord2s: { args: [FFIType.i16, FFIType.i16], returns: FFIType.void },
    glTexCoord2sv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord3d: { args: [FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glTexCoord3dv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord3f: { args: [FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glTexCoord3fv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord3i: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glTexCoord3iv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord3s: { args: [FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glTexCoord3sv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord4d: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glTexCoord4dv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord4f: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glTexCoord4fv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord4i: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glTexCoord4iv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoord4s: { args: [FFIType.i16, FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glTexCoord4sv: { args: [FFIType.ptr], returns: FFIType.void },
    glTexCoordPointer: { args: [FFIType.i32, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glTexEnvf: { args: [FFIType.u32, FFIType.u32, FFIType.f32], returns: FFIType.void },
    glTexEnvfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glTexEnvi: { args: [FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.void },
    glTexEnviv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glTexGend: { args: [FFIType.u32, FFIType.u32, FFIType.f64], returns: FFIType.void },
    glTexGendv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glTexGenf: { args: [FFIType.u32, FFIType.u32, FFIType.f32], returns: FFIType.void },
    glTexGenfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glTexGeni: { args: [FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.void },
    glTexGeniv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glTexImage1D: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glTexImage2D: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.void }, // prettier-ignore
    glTexParameterf: { args: [FFIType.u32, FFIType.u32, FFIType.f32], returns: FFIType.void },
    glTexParameterfv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glTexParameteri: { args: [FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.void },
    glTexParameteriv: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glTexSubImage1D: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    glTexSubImage2D: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void }, // prettier-ignore
    glTranslated: { args: [FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glTranslatef: { args: [FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glVertex2d: { args: [FFIType.f64, FFIType.f64], returns: FFIType.void },
    glVertex2dv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex2f: { args: [FFIType.f32, FFIType.f32], returns: FFIType.void },
    glVertex2fv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex2i: { args: [FFIType.i32, FFIType.i32], returns: FFIType.void },
    glVertex2iv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex2s: { args: [FFIType.i16, FFIType.i16], returns: FFIType.void },
    glVertex2sv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex3d: { args: [FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glVertex3dv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex3f: { args: [FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glVertex3fv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex3i: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glVertex3iv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex3s: { args: [FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glVertex3sv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex4d: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    glVertex4dv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex4f: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.void },
    glVertex4fv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex4i: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    glVertex4iv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertex4s: { args: [FFIType.i16, FFIType.i16, FFIType.i16, FFIType.i16], returns: FFIType.void },
    glVertex4sv: { args: [FFIType.ptr], returns: FFIType.void },
    glVertexPointer: { args: [FFIType.i32, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    glViewport: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.void },
    wglChoosePixelFormat: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    wglCopyContext: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    wglCreateContext: { args: [FFIType.u64], returns: FFIType.u64 },
    wglCreateLayerContext: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    wglDeleteContext: { args: [FFIType.u64], returns: FFIType.i32 },
    wglDescribeLayerPlane: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    wglDescribePixelFormat: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    wglGetCurrentContext: { args: [], returns: FFIType.u64 },
    wglGetCurrentDC: { args: [], returns: FFIType.u64 },
    wglGetDefaultProcAddress: { args: [FFIType.ptr], returns: FFIType.ptr },
    wglGetLayerPaletteEntries: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    wglGetProcAddress: { args: [FFIType.ptr], returns: FFIType.ptr },
    wglMakeCurrent: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    wglRealizeLayerPalette: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    wglSetLayerPaletteEntries: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    wglSetPixelFormat: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    wglShareLists: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    wglSwapBuffers: { args: [FFIType.u64], returns: FFIType.i32 },
    wglSwapLayerBuffers: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    wglSwapMultipleBuffers: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    wglUseFontBitmapsA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    wglUseFontBitmapsW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    wglUseFontOutlinesA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    wglUseFontOutlinesW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glaccum
  public static glAccum(op: GLenum, value: GLfloat): void {
    return OpenGL32.Load('glAccum')(op, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glalphafunc
  public static glAlphaFunc(func: GLenum, ref: GLclampf): void {
    return OpenGL32.Load('glAlphaFunc')(func, ref);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glaretexturesresident
  public static glAreTexturesResident(n: GLsizei, textures: GLuint_, residences: GLboolean_): GLboolean {
    return OpenGL32.Load('glAreTexturesResident')(n, textures, residences);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glarrayelement
  public static glArrayElement(i: GLint): void {
    return OpenGL32.Load('glArrayElement')(i);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glbegin
  public static glBegin(mode: GLenum): void {
    return OpenGL32.Load('glBegin')(mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glbindtexture
  public static glBindTexture(target: GLenum, texture: GLuint): void {
    return OpenGL32.Load('glBindTexture')(target, texture);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glbitmap
  public static glBitmap(width: GLsizei, height: GLsizei, xorig: GLfloat, yorig: GLfloat, xmove: GLfloat, ymove: GLfloat, bitmap: GLubyte_): void {
    return OpenGL32.Load('glBitmap')(width, height, xorig, yorig, xmove, ymove, bitmap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glblendfunc
  public static glBlendFunc(sfactor: GLenum, dfactor: GLenum): void {
    return OpenGL32.Load('glBlendFunc')(sfactor, dfactor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcalllist
  public static glCallList(list: GLuint): void {
    return OpenGL32.Load('glCallList')(list);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcalllists
  public static glCallLists(n: GLsizei, type: GLenum, lists: GLvoid_): void {
    return OpenGL32.Load('glCallLists')(n, type, lists);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glclear
  public static glClear(mask: GLbitfield): void {
    return OpenGL32.Load('glClear')(mask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glclearaccum
  public static glClearAccum(red: GLfloat, green: GLfloat, blue: GLfloat, alpha: GLfloat): void {
    return OpenGL32.Load('glClearAccum')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glclearcolor
  public static glClearColor(red: GLclampf, green: GLclampf, blue: GLclampf, alpha: GLclampf): void {
    return OpenGL32.Load('glClearColor')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcleardepth
  public static glClearDepth(depth: GLclampd): void {
    return OpenGL32.Load('glClearDepth')(depth);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glclearindex
  public static glClearIndex(c: GLfloat): void {
    return OpenGL32.Load('glClearIndex')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glclearstencil
  public static glClearStencil(s: GLint): void {
    return OpenGL32.Load('glClearStencil')(s);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glclipplane
  public static glClipPlane(plane: GLenum, equation: GLdouble_): void {
    return OpenGL32.Load('glClipPlane')(plane, equation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3b
  public static glColor3b(red: GLbyte, green: GLbyte, blue: GLbyte): void {
    return OpenGL32.Load('glColor3b')(red, green, blue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3bv
  public static glColor3bv(v: GLbyte_): void {
    return OpenGL32.Load('glColor3bv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3d
  public static glColor3d(red: GLdouble, green: GLdouble, blue: GLdouble): void {
    return OpenGL32.Load('glColor3d')(red, green, blue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3dv
  public static glColor3dv(v: GLdouble_): void {
    return OpenGL32.Load('glColor3dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3f
  public static glColor3f(red: GLfloat, green: GLfloat, blue: GLfloat): void {
    return OpenGL32.Load('glColor3f')(red, green, blue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3fv
  public static glColor3fv(v: GLfloat_): void {
    return OpenGL32.Load('glColor3fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3i
  public static glColor3i(red: GLint, green: GLint, blue: GLint): void {
    return OpenGL32.Load('glColor3i')(red, green, blue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3iv
  public static glColor3iv(v: GLint_): void {
    return OpenGL32.Load('glColor3iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3s
  public static glColor3s(red: GLshort, green: GLshort, blue: GLshort): void {
    return OpenGL32.Load('glColor3s')(red, green, blue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3sv
  public static glColor3sv(v: GLshort_): void {
    return OpenGL32.Load('glColor3sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3ub
  public static glColor3ub(red: GLubyte, green: GLubyte, blue: GLubyte): void {
    return OpenGL32.Load('glColor3ub')(red, green, blue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3ubv
  public static glColor3ubv(v: GLubyte_): void {
    return OpenGL32.Load('glColor3ubv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3ui
  public static glColor3ui(red: GLuint, green: GLuint, blue: GLuint): void {
    return OpenGL32.Load('glColor3ui')(red, green, blue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3uiv
  public static glColor3uiv(v: GLuint_): void {
    return OpenGL32.Load('glColor3uiv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3us
  public static glColor3us(red: GLushort, green: GLushort, blue: GLushort): void {
    return OpenGL32.Load('glColor3us')(red, green, blue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor3usv
  public static glColor3usv(v: GLushort_): void {
    return OpenGL32.Load('glColor3usv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4b
  public static glColor4b(red: GLbyte, green: GLbyte, blue: GLbyte, alpha: GLbyte): void {
    return OpenGL32.Load('glColor4b')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4bv
  public static glColor4bv(v: GLbyte_): void {
    return OpenGL32.Load('glColor4bv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4d
  public static glColor4d(red: GLdouble, green: GLdouble, blue: GLdouble, alpha: GLdouble): void {
    return OpenGL32.Load('glColor4d')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4dv
  public static glColor4dv(v: GLdouble_): void {
    return OpenGL32.Load('glColor4dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4f
  public static glColor4f(red: GLfloat, green: GLfloat, blue: GLfloat, alpha: GLfloat): void {
    return OpenGL32.Load('glColor4f')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4fv
  public static glColor4fv(v: GLfloat_): void {
    return OpenGL32.Load('glColor4fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4i
  public static glColor4i(red: GLint, green: GLint, blue: GLint, alpha: GLint): void {
    return OpenGL32.Load('glColor4i')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4iv
  public static glColor4iv(v: GLint_): void {
    return OpenGL32.Load('glColor4iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4s
  public static glColor4s(red: GLshort, green: GLshort, blue: GLshort, alpha: GLshort): void {
    return OpenGL32.Load('glColor4s')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4sv
  public static glColor4sv(v: GLshort_): void {
    return OpenGL32.Load('glColor4sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4ub
  public static glColor4ub(red: GLubyte, green: GLubyte, blue: GLubyte, alpha: GLubyte): void {
    return OpenGL32.Load('glColor4ub')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4ubv
  public static glColor4ubv(v: GLubyte_): void {
    return OpenGL32.Load('glColor4ubv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4ui
  public static glColor4ui(red: GLuint, green: GLuint, blue: GLuint, alpha: GLuint): void {
    return OpenGL32.Load('glColor4ui')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4uiv
  public static glColor4uiv(v: GLuint_): void {
    return OpenGL32.Load('glColor4uiv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4us
  public static glColor4us(red: GLushort, green: GLushort, blue: GLushort, alpha: GLushort): void {
    return OpenGL32.Load('glColor4us')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolor4usv
  public static glColor4usv(v: GLushort_): void {
    return OpenGL32.Load('glColor4usv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolormask
  public static glColorMask(red: GLboolean, green: GLboolean, blue: GLboolean, alpha: GLboolean): void {
    return OpenGL32.Load('glColorMask')(red, green, blue, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolormaterial
  public static glColorMaterial(face: GLenum, mode: GLenum): void {
    return OpenGL32.Load('glColorMaterial')(face, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcolorpointer
  public static glColorPointer(size: GLint, type: GLenum, stride: GLsizei, pointer: GLvoid_): void {
    return OpenGL32.Load('glColorPointer')(size, type, stride, pointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcopypixels
  public static glCopyPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, type: GLenum): void {
    return OpenGL32.Load('glCopyPixels')(x, y, width, height, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcopyteximage1d
  public static glCopyTexImage1D(target: GLenum, level: GLint, internalformat: GLenum, x: GLint, y: GLint, width: GLsizei, border: GLint): void {
    return OpenGL32.Load('glCopyTexImage1D')(target, level, internalformat, x, y, width, border);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcopyteximage2d
  public static glCopyTexImage2D(target: GLenum, level: GLint, internalformat: GLenum, x: GLint, y: GLint, width: GLsizei, height: GLsizei, border: GLint): void {
    return OpenGL32.Load('glCopyTexImage2D')(target, level, internalformat, x, y, width, height, border);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcopytexsubimage1d
  public static glCopyTexSubImage1D(target: GLenum, level: GLint, xoffset: GLint, x: GLint, y: GLint, width: GLsizei): void {
    return OpenGL32.Load('glCopyTexSubImage1D')(target, level, xoffset, x, y, width);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcopytexsubimage2d
  public static glCopyTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, x: GLint, y: GLint, width: GLsizei, height: GLsizei): void {
    return OpenGL32.Load('glCopyTexSubImage2D')(target, level, xoffset, yoffset, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glcullface
  public static glCullFace(mode: GLenum): void {
    return OpenGL32.Load('glCullFace')(mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldeletelists
  public static glDeleteLists(list: GLuint, range: GLsizei): void {
    return OpenGL32.Load('glDeleteLists')(list, range);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldeletetextures
  public static glDeleteTextures(n: GLsizei, textures: GLuint_): void {
    return OpenGL32.Load('glDeleteTextures')(n, textures);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldepthfunc
  public static glDepthFunc(func: GLenum): void {
    return OpenGL32.Load('glDepthFunc')(func);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldepthmask
  public static glDepthMask(flag: GLboolean): void {
    return OpenGL32.Load('glDepthMask')(flag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldepthrange
  public static glDepthRange(zNear: GLclampd, zFar: GLclampd): void {
    return OpenGL32.Load('glDepthRange')(zNear, zFar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldisable
  public static glDisable(cap: GLenum): void {
    return OpenGL32.Load('glDisable')(cap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldisableclientstate
  public static glDisableClientState(array: GLenum): void {
    return OpenGL32.Load('glDisableClientState')(array);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldrawarrays
  public static glDrawArrays(mode: GLenum, first: GLint, count: GLsizei): void {
    return OpenGL32.Load('glDrawArrays')(mode, first, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldrawbuffer
  public static glDrawBuffer(mode: GLenum): void {
    return OpenGL32.Load('glDrawBuffer')(mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldrawelements
  public static glDrawElements(mode: GLenum, count: GLsizei, type: GLenum, indices: GLvoid_ | NULL): void {
    return OpenGL32.Load('glDrawElements')(mode, count, type, indices);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gldrawpixels
  public static glDrawPixels(width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, pixels: GLvoid_): void {
    return OpenGL32.Load('glDrawPixels')(width, height, format, type, pixels);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gledgeflag
  public static glEdgeFlag(flag: GLboolean): void {
    return OpenGL32.Load('glEdgeFlag')(flag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gledgeflagpointer
  public static glEdgeFlagPointer(stride: GLsizei, pointer: GLvoid_): void {
    return OpenGL32.Load('glEdgeFlagPointer')(stride, pointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gledgeflagv
  public static glEdgeFlagv(flag: GLboolean_): void {
    return OpenGL32.Load('glEdgeFlagv')(flag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glenable
  public static glEnable(cap: GLenum): void {
    return OpenGL32.Load('glEnable')(cap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glenableclientstate
  public static glEnableClientState(array: GLenum): void {
    return OpenGL32.Load('glEnableClientState')(array);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glend
  public static glEnd(): void {
    return OpenGL32.Load('glEnd')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glendlist
  public static glEndList(): void {
    return OpenGL32.Load('glEndList')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalcoord1d
  public static glEvalCoord1d(u: GLdouble): void {
    return OpenGL32.Load('glEvalCoord1d')(u);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalcoord1dv
  public static glEvalCoord1dv(u: GLdouble_): void {
    return OpenGL32.Load('glEvalCoord1dv')(u);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalcoord1f
  public static glEvalCoord1f(u: GLfloat): void {
    return OpenGL32.Load('glEvalCoord1f')(u);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalcoord1fv
  public static glEvalCoord1fv(u: GLfloat_): void {
    return OpenGL32.Load('glEvalCoord1fv')(u);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalcoord2d
  public static glEvalCoord2d(u: GLdouble, v: GLdouble): void {
    return OpenGL32.Load('glEvalCoord2d')(u, v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalcoord2dv
  public static glEvalCoord2dv(u: GLdouble_): void {
    return OpenGL32.Load('glEvalCoord2dv')(u);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalcoord2f
  public static glEvalCoord2f(u: GLfloat, v: GLfloat): void {
    return OpenGL32.Load('glEvalCoord2f')(u, v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalcoord2fv
  public static glEvalCoord2fv(u: GLfloat_): void {
    return OpenGL32.Load('glEvalCoord2fv')(u);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalmesh1
  public static glEvalMesh1(mode: GLenum, i1: GLint, i2: GLint): void {
    return OpenGL32.Load('glEvalMesh1')(mode, i1, i2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalmesh2
  public static glEvalMesh2(mode: GLenum, i1: GLint, i2: GLint, j1: GLint, j2: GLint): void {
    return OpenGL32.Load('glEvalMesh2')(mode, i1, i2, j1, j2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalpoint1
  public static glEvalPoint1(i: GLint): void {
    return OpenGL32.Load('glEvalPoint1')(i);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glevalpoint2
  public static glEvalPoint2(i: GLint, j: GLint): void {
    return OpenGL32.Load('glEvalPoint2')(i, j);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glfeedbackbuffer
  public static glFeedbackBuffer(size: GLsizei, type: GLenum, buffer: GLfloat_): void {
    return OpenGL32.Load('glFeedbackBuffer')(size, type, buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glfinish
  public static glFinish(): void {
    return OpenGL32.Load('glFinish')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glflush
  public static glFlush(): void {
    return OpenGL32.Load('glFlush')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glfogf
  public static glFogf(pname: GLenum, param: GLfloat): void {
    return OpenGL32.Load('glFogf')(pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glfogfv
  public static glFogfv(pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glFogfv')(pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glfogi
  public static glFogi(pname: GLenum, param: GLint): void {
    return OpenGL32.Load('glFogi')(pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glfogiv
  public static glFogiv(pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glFogiv')(pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glfrontface
  public static glFrontFace(mode: GLenum): void {
    return OpenGL32.Load('glFrontFace')(mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glfrustum
  public static glFrustum(left: GLdouble, right: GLdouble, bottom: GLdouble, top: GLdouble, zNear: GLdouble, zFar: GLdouble): void {
    return OpenGL32.Load('glFrustum')(left, right, bottom, top, zNear, zFar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgenlists
  public static glGenLists(range: GLsizei): GLuint {
    return OpenGL32.Load('glGenLists')(range);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgentextures
  public static glGenTextures(n: GLsizei, textures: GLuint_): void {
    return OpenGL32.Load('glGenTextures')(n, textures);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetbooleanv
  public static glGetBooleanv(pname: GLenum, params: GLboolean_): void {
    return OpenGL32.Load('glGetBooleanv')(pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetclipplane
  public static glGetClipPlane(plane: GLenum, equation: GLdouble_): void {
    return OpenGL32.Load('glGetClipPlane')(plane, equation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetdoublev
  public static glGetDoublev(pname: GLenum, params: GLdouble_): void {
    return OpenGL32.Load('glGetDoublev')(pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgeterror
  public static glGetError(): GLenum {
    return OpenGL32.Load('glGetError')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetfloatv
  public static glGetFloatv(pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glGetFloatv')(pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetintegerv
  public static glGetIntegerv(pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glGetIntegerv')(pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetlightfv
  public static glGetLightfv(light: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glGetLightfv')(light, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetlightiv
  public static glGetLightiv(light: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glGetLightiv')(light, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetmapdv
  public static glGetMapdv(target: GLenum, query: GLenum, v: GLdouble_): void {
    return OpenGL32.Load('glGetMapdv')(target, query, v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetmapfv
  public static glGetMapfv(target: GLenum, query: GLenum, v: GLfloat_): void {
    return OpenGL32.Load('glGetMapfv')(target, query, v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetmapiv
  public static glGetMapiv(target: GLenum, query: GLenum, v: GLint_): void {
    return OpenGL32.Load('glGetMapiv')(target, query, v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetmaterialfv
  public static glGetMaterialfv(face: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glGetMaterialfv')(face, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetmaterialiv
  public static glGetMaterialiv(face: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glGetMaterialiv')(face, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetpixelmapfv
  public static glGetPixelMapfv(map: GLenum, values: GLfloat_): void {
    return OpenGL32.Load('glGetPixelMapfv')(map, values);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetpixelmapuiv
  public static glGetPixelMapuiv(map: GLenum, values: GLuint_): void {
    return OpenGL32.Load('glGetPixelMapuiv')(map, values);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetpixelmapusv
  public static glGetPixelMapusv(map: GLenum, values: GLushort_): void {
    return OpenGL32.Load('glGetPixelMapusv')(map, values);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetpointerv
  public static glGetPointerv(pname: GLenum, params: GLvoid_): void {
    return OpenGL32.Load('glGetPointerv')(pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetpolygonstipple
  public static glGetPolygonStipple(mask: GLubyte_): void {
    return OpenGL32.Load('glGetPolygonStipple')(mask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetstring
  public static glGetString(name: GLenum): GLubyte_ {
    return OpenGL32.Load('glGetString')(name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgettexenvfv
  public static glGetTexEnvfv(target: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glGetTexEnvfv')(target, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgettexenviv
  public static glGetTexEnviv(target: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glGetTexEnviv')(target, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgettexgendv
  public static glGetTexGendv(coord: GLenum, pname: GLenum, params: GLdouble_): void {
    return OpenGL32.Load('glGetTexGendv')(coord, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgettexgenfv
  public static glGetTexGenfv(coord: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glGetTexGenfv')(coord, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgettexgeniv
  public static glGetTexGeniv(coord: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glGetTexGeniv')(coord, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgetteximage
  public static glGetTexImage(target: GLenum, level: GLint, format: GLenum, type: GLenum, pixels: GLvoid_): void {
    return OpenGL32.Load('glGetTexImage')(target, level, format, type, pixels);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgettexlevelparameterfv
  public static glGetTexLevelParameterfv(target: GLenum, level: GLint, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glGetTexLevelParameterfv')(target, level, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgettexlevelparameteriv
  public static glGetTexLevelParameteriv(target: GLenum, level: GLint, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glGetTexLevelParameteriv')(target, level, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgettexparameterfv
  public static glGetTexParameterfv(target: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glGetTexParameterfv')(target, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glgettexparameteriv
  public static glGetTexParameteriv(target: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glGetTexParameteriv')(target, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glhint
  public static glHint(target: GLenum, mode: GLenum): void {
    return OpenGL32.Load('glHint')(target, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexmask
  public static glIndexMask(mask: GLuint): void {
    return OpenGL32.Load('glIndexMask')(mask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexpointer
  public static glIndexPointer(type: GLenum, stride: GLsizei, pointer: GLvoid_): void {
    return OpenGL32.Load('glIndexPointer')(type, stride, pointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexd
  public static glIndexd(c: GLdouble): void {
    return OpenGL32.Load('glIndexd')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexdv
  public static glIndexdv(c: GLdouble_): void {
    return OpenGL32.Load('glIndexdv')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexf
  public static glIndexf(c: GLfloat): void {
    return OpenGL32.Load('glIndexf')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexfv
  public static glIndexfv(c: GLfloat_): void {
    return OpenGL32.Load('glIndexfv')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexi
  public static glIndexi(c: GLint): void {
    return OpenGL32.Load('glIndexi')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexiv
  public static glIndexiv(c: GLint_): void {
    return OpenGL32.Load('glIndexiv')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexs
  public static glIndexs(c: GLshort): void {
    return OpenGL32.Load('glIndexs')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexsv
  public static glIndexsv(c: GLshort_): void {
    return OpenGL32.Load('glIndexsv')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexub
  public static glIndexub(c: GLubyte): void {
    return OpenGL32.Load('glIndexub')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glindexubv
  public static glIndexubv(c: GLubyte_): void {
    return OpenGL32.Load('glIndexubv')(c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glinitnames
  public static glInitNames(): void {
    return OpenGL32.Load('glInitNames')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glinterleavedarrays
  public static glInterleavedArrays(format: GLenum, stride: GLsizei, pointer: GLvoid_): void {
    return OpenGL32.Load('glInterleavedArrays')(format, stride, pointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glisenabled
  public static glIsEnabled(cap: GLenum): GLboolean {
    return OpenGL32.Load('glIsEnabled')(cap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glislist
  public static glIsList(list: GLuint): GLboolean {
    return OpenGL32.Load('glIsList')(list);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glistexture
  public static glIsTexture(texture: GLuint): GLboolean {
    return OpenGL32.Load('glIsTexture')(texture);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllightmodelf
  public static glLightModelf(pname: GLenum, param: GLfloat): void {
    return OpenGL32.Load('glLightModelf')(pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllightmodelfv
  public static glLightModelfv(pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glLightModelfv')(pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllightmodeli
  public static glLightModeli(pname: GLenum, param: GLint): void {
    return OpenGL32.Load('glLightModeli')(pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllightmodeliv
  public static glLightModeliv(pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glLightModeliv')(pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllightf
  public static glLightf(light: GLenum, pname: GLenum, param: GLfloat): void {
    return OpenGL32.Load('glLightf')(light, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllightfv
  public static glLightfv(light: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glLightfv')(light, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllighti
  public static glLighti(light: GLenum, pname: GLenum, param: GLint): void {
    return OpenGL32.Load('glLighti')(light, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllightiv
  public static glLightiv(light: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glLightiv')(light, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllinestipple
  public static glLineStipple(factor: GLint, pattern: GLushort): void {
    return OpenGL32.Load('glLineStipple')(factor, pattern);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllinewidth
  public static glLineWidth(width: GLfloat): void {
    return OpenGL32.Load('glLineWidth')(width);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllistbase
  public static glListBase(base: GLuint): void {
    return OpenGL32.Load('glListBase')(base);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glloadidentity
  public static glLoadIdentity(): void {
    return OpenGL32.Load('glLoadIdentity')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glloadmatrixd
  public static glLoadMatrixd(m: GLdouble_): void {
    return OpenGL32.Load('glLoadMatrixd')(m);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glloadmatrixf
  public static glLoadMatrixf(m: GLfloat_): void {
    return OpenGL32.Load('glLoadMatrixf')(m);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glloadname
  public static glLoadName(name: GLuint): void {
    return OpenGL32.Load('glLoadName')(name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gllogicop
  public static glLogicOp(opcode: GLenum): void {
    return OpenGL32.Load('glLogicOp')(opcode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmap1d
  public static glMap1d(target: GLenum, u1: GLdouble, u2: GLdouble, stride: GLint, order: GLint, points: GLdouble_): void {
    return OpenGL32.Load('glMap1d')(target, u1, u2, stride, order, points);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmap1f
  public static glMap1f(target: GLenum, u1: GLfloat, u2: GLfloat, stride: GLint, order: GLint, points: GLfloat_): void {
    return OpenGL32.Load('glMap1f')(target, u1, u2, stride, order, points);
  }

  // prettier-ignore
  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmap2d
  public static glMap2d(target: GLenum, u1: GLdouble, u2: GLdouble, ustride: GLint, uorder: GLint, v1: GLdouble, v2: GLdouble, vstride: GLint, vorder: GLint, points: GLdouble_) : void {
    return OpenGL32.Load('glMap2d')(target, u1, u2, ustride, uorder, v1, v2, vstride, vorder, points);
  }

  // prettier-ignore
  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmap2f
  public static glMap2f(target: GLenum, u1: GLfloat, u2: GLfloat, ustride: GLint, uorder: GLint, v1: GLfloat, v2: GLfloat, vstride: GLint, vorder: GLint, points: GLfloat_) : void {
    return OpenGL32.Load('glMap2f')(target, u1, u2, ustride, uorder, v1, v2, vstride, vorder, points);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmapgrid1d
  public static glMapGrid1d(un: GLint, u1: GLdouble, u2: GLdouble): void {
    return OpenGL32.Load('glMapGrid1d')(un, u1, u2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmapgrid1f
  public static glMapGrid1f(un: GLint, u1: GLfloat, u2: GLfloat): void {
    return OpenGL32.Load('glMapGrid1f')(un, u1, u2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmapgrid2d
  public static glMapGrid2d(un: GLint, u1: GLdouble, u2: GLdouble, vn: GLint, v1: GLdouble, v2: GLdouble): void {
    return OpenGL32.Load('glMapGrid2d')(un, u1, u2, vn, v1, v2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmapgrid2f
  public static glMapGrid2f(un: GLint, u1: GLfloat, u2: GLfloat, vn: GLint, v1: GLfloat, v2: GLfloat): void {
    return OpenGL32.Load('glMapGrid2f')(un, u1, u2, vn, v1, v2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmaterialf
  public static glMaterialf(face: GLenum, pname: GLenum, param: GLfloat): void {
    return OpenGL32.Load('glMaterialf')(face, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmaterialfv
  public static glMaterialfv(face: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glMaterialfv')(face, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmateriali
  public static glMateriali(face: GLenum, pname: GLenum, param: GLint): void {
    return OpenGL32.Load('glMateriali')(face, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmaterialiv
  public static glMaterialiv(face: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glMaterialiv')(face, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmatrixmode
  public static glMatrixMode(mode: GLenum): void {
    return OpenGL32.Load('glMatrixMode')(mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmultmatrixd
  public static glMultMatrixd(m: GLdouble_): void {
    return OpenGL32.Load('glMultMatrixd')(m);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glmultmatrixf
  public static glMultMatrixf(m: GLfloat_): void {
    return OpenGL32.Load('glMultMatrixf')(m);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnewlist
  public static glNewList(list: GLuint, mode: GLenum): void {
    return OpenGL32.Load('glNewList')(list, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3b
  public static glNormal3b(nx: GLbyte, ny: GLbyte, nz: GLbyte): void {
    return OpenGL32.Load('glNormal3b')(nx, ny, nz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3bv
  public static glNormal3bv(v: GLbyte_): void {
    return OpenGL32.Load('glNormal3bv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3d
  public static glNormal3d(nx: GLdouble, ny: GLdouble, nz: GLdouble): void {
    return OpenGL32.Load('glNormal3d')(nx, ny, nz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3dv
  public static glNormal3dv(v: GLdouble_): void {
    return OpenGL32.Load('glNormal3dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3f
  public static glNormal3f(nx: GLfloat, ny: GLfloat, nz: GLfloat): void {
    return OpenGL32.Load('glNormal3f')(nx, ny, nz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3fv
  public static glNormal3fv(v: GLfloat_): void {
    return OpenGL32.Load('glNormal3fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3i
  public static glNormal3i(nx: GLint, ny: GLint, nz: GLint): void {
    return OpenGL32.Load('glNormal3i')(nx, ny, nz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3iv
  public static glNormal3iv(v: GLint_): void {
    return OpenGL32.Load('glNormal3iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3s
  public static glNormal3s(nx: GLshort, ny: GLshort, nz: GLshort): void {
    return OpenGL32.Load('glNormal3s')(nx, ny, nz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormal3sv
  public static glNormal3sv(v: GLshort_): void {
    return OpenGL32.Load('glNormal3sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glnormalpointer
  public static glNormalPointer(type: GLenum, stride: GLsizei, pointer: GLvoid_): void {
    return OpenGL32.Load('glNormalPointer')(type, stride, pointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glortho
  public static glOrtho(left: GLdouble, right: GLdouble, bottom: GLdouble, top: GLdouble, zNear: GLdouble, zFar: GLdouble): void {
    return OpenGL32.Load('glOrtho')(left, right, bottom, top, zNear, zFar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpassthrough
  public static glPassThrough(token: GLfloat): void {
    return OpenGL32.Load('glPassThrough')(token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpixelmapfv
  public static glPixelMapfv(map: GLenum, mapsize: GLsizei, values: GLfloat_): void {
    return OpenGL32.Load('glPixelMapfv')(map, mapsize, values);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpixelmapuiv
  public static glPixelMapuiv(map: GLenum, mapsize: GLsizei, values: GLuint_): void {
    return OpenGL32.Load('glPixelMapuiv')(map, mapsize, values);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpixelmapusv
  public static glPixelMapusv(map: GLenum, mapsize: GLsizei, values: GLushort_): void {
    return OpenGL32.Load('glPixelMapusv')(map, mapsize, values);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpixelstoref
  public static glPixelStoref(pname: GLenum, param: GLfloat): void {
    return OpenGL32.Load('glPixelStoref')(pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpixelstorei
  public static glPixelStorei(pname: GLenum, param: GLint): void {
    return OpenGL32.Load('glPixelStorei')(pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpixeltransferf
  public static glPixelTransferf(pname: GLenum, param: GLfloat): void {
    return OpenGL32.Load('glPixelTransferf')(pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpixeltransferi
  public static glPixelTransferi(pname: GLenum, param: GLint): void {
    return OpenGL32.Load('glPixelTransferi')(pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpixelzoom
  public static glPixelZoom(xfactor: GLfloat, yfactor: GLfloat): void {
    return OpenGL32.Load('glPixelZoom')(xfactor, yfactor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpointsize
  public static glPointSize(size: GLfloat): void {
    return OpenGL32.Load('glPointSize')(size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpolygonmode
  public static glPolygonMode(face: GLenum, mode: GLenum): void {
    return OpenGL32.Load('glPolygonMode')(face, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpolygonoffset
  public static glPolygonOffset(factor: GLfloat, units: GLfloat): void {
    return OpenGL32.Load('glPolygonOffset')(factor, units);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpolygonstipple
  public static glPolygonStipple(mask: GLubyte_): void {
    return OpenGL32.Load('glPolygonStipple')(mask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpopattrib
  public static glPopAttrib(): void {
    return OpenGL32.Load('glPopAttrib')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpopclientattrib
  public static glPopClientAttrib(): void {
    return OpenGL32.Load('glPopClientAttrib')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpopmatrix
  public static glPopMatrix(): void {
    return OpenGL32.Load('glPopMatrix')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpopname
  public static glPopName(): void {
    return OpenGL32.Load('glPopName')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glprioritizetextures
  public static glPrioritizeTextures(n: GLsizei, textures: GLuint_, priorities: GLclampf_): void {
    return OpenGL32.Load('glPrioritizeTextures')(n, textures, priorities);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpushattrib
  public static glPushAttrib(mask: GLbitfield): void {
    return OpenGL32.Load('glPushAttrib')(mask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpushclientattrib
  public static glPushClientAttrib(mask: GLbitfield): void {
    return OpenGL32.Load('glPushClientAttrib')(mask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpushmatrix
  public static glPushMatrix(): void {
    return OpenGL32.Load('glPushMatrix')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glpushname
  public static glPushName(name: GLuint): void {
    return OpenGL32.Load('glPushName')(name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos2d
  public static glRasterPos2d(x: GLdouble, y: GLdouble): void {
    return OpenGL32.Load('glRasterPos2d')(x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos2dv
  public static glRasterPos2dv(v: GLdouble_): void {
    return OpenGL32.Load('glRasterPos2dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos2f
  public static glRasterPos2f(x: GLfloat, y: GLfloat): void {
    return OpenGL32.Load('glRasterPos2f')(x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos2fv
  public static glRasterPos2fv(v: GLfloat_): void {
    return OpenGL32.Load('glRasterPos2fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos2i
  public static glRasterPos2i(x: GLint, y: GLint): void {
    return OpenGL32.Load('glRasterPos2i')(x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos2iv
  public static glRasterPos2iv(v: GLint_): void {
    return OpenGL32.Load('glRasterPos2iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos2s
  public static glRasterPos2s(x: GLshort, y: GLshort): void {
    return OpenGL32.Load('glRasterPos2s')(x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos2sv
  public static glRasterPos2sv(v: GLshort_): void {
    return OpenGL32.Load('glRasterPos2sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos3d
  public static glRasterPos3d(x: GLdouble, y: GLdouble, z: GLdouble): void {
    return OpenGL32.Load('glRasterPos3d')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos3dv
  public static glRasterPos3dv(v: GLdouble_): void {
    return OpenGL32.Load('glRasterPos3dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos3f
  public static glRasterPos3f(x: GLfloat, y: GLfloat, z: GLfloat): void {
    return OpenGL32.Load('glRasterPos3f')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos3fv
  public static glRasterPos3fv(v: GLfloat_): void {
    return OpenGL32.Load('glRasterPos3fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos3i
  public static glRasterPos3i(x: GLint, y: GLint, z: GLint): void {
    return OpenGL32.Load('glRasterPos3i')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos3iv
  public static glRasterPos3iv(v: GLint_): void {
    return OpenGL32.Load('glRasterPos3iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos3s
  public static glRasterPos3s(x: GLshort, y: GLshort, z: GLshort): void {
    return OpenGL32.Load('glRasterPos3s')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos3sv
  public static glRasterPos3sv(v: GLshort_): void {
    return OpenGL32.Load('glRasterPos3sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos4d
  public static glRasterPos4d(x: GLdouble, y: GLdouble, z: GLdouble, w: GLdouble): void {
    return OpenGL32.Load('glRasterPos4d')(x, y, z, w);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos4dv
  public static glRasterPos4dv(v: GLdouble_): void {
    return OpenGL32.Load('glRasterPos4dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos4f
  public static glRasterPos4f(x: GLfloat, y: GLfloat, z: GLfloat, w: GLfloat): void {
    return OpenGL32.Load('glRasterPos4f')(x, y, z, w);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos4fv
  public static glRasterPos4fv(v: GLfloat_): void {
    return OpenGL32.Load('glRasterPos4fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos4i
  public static glRasterPos4i(x: GLint, y: GLint, z: GLint, w: GLint): void {
    return OpenGL32.Load('glRasterPos4i')(x, y, z, w);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos4iv
  public static glRasterPos4iv(v: GLint_): void {
    return OpenGL32.Load('glRasterPos4iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos4s
  public static glRasterPos4s(x: GLshort, y: GLshort, z: GLshort, w: GLshort): void {
    return OpenGL32.Load('glRasterPos4s')(x, y, z, w);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrasterpos4sv
  public static glRasterPos4sv(v: GLshort_): void {
    return OpenGL32.Load('glRasterPos4sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glreadbuffer
  public static glReadBuffer(mode: GLenum): void {
    return OpenGL32.Load('glReadBuffer')(mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glreadpixels
  public static glReadPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, pixels: GLvoid_): void {
    return OpenGL32.Load('glReadPixels')(x, y, width, height, format, type, pixels);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrectd
  public static glRectd(x1: GLdouble, y1: GLdouble, x2: GLdouble, y2: GLdouble): void {
    return OpenGL32.Load('glRectd')(x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrectdv
  public static glRectdv(v1: GLdouble_, v2: GLdouble_): void {
    return OpenGL32.Load('glRectdv')(v1, v2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrectf
  public static glRectf(x1: GLfloat, y1: GLfloat, x2: GLfloat, y2: GLfloat): void {
    return OpenGL32.Load('glRectf')(x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrectfv
  public static glRectfv(v1: GLfloat_, v2: GLfloat_): void {
    return OpenGL32.Load('glRectfv')(v1, v2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrecti
  public static glRecti(x1: GLint, y1: GLint, x2: GLint, y2: GLint): void {
    return OpenGL32.Load('glRecti')(x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrectiv
  public static glRectiv(v1: GLint_, v2: GLint_): void {
    return OpenGL32.Load('glRectiv')(v1, v2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrects
  public static glRects(x1: GLshort, y1: GLshort, x2: GLshort, y2: GLshort): void {
    return OpenGL32.Load('glRects')(x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrectsv
  public static glRectsv(v1: GLshort_, v2: GLshort_): void {
    return OpenGL32.Load('glRectsv')(v1, v2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrendermode
  public static glRenderMode(mode: GLenum): GLint {
    return OpenGL32.Load('glRenderMode')(mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrotated
  public static glRotated(angle: GLdouble, x: GLdouble, y: GLdouble, z: GLdouble): void {
    return OpenGL32.Load('glRotated')(angle, x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glrotatef
  public static glRotatef(angle: GLfloat, x: GLfloat, y: GLfloat, z: GLfloat): void {
    return OpenGL32.Load('glRotatef')(angle, x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glscaled
  public static glScaled(x: GLdouble, y: GLdouble, z: GLdouble): void {
    return OpenGL32.Load('glScaled')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glscalef
  public static glScalef(x: GLfloat, y: GLfloat, z: GLfloat): void {
    return OpenGL32.Load('glScalef')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glscissor
  public static glScissor(x: GLint, y: GLint, width: GLsizei, height: GLsizei): void {
    return OpenGL32.Load('glScissor')(x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glselectbuffer
  public static glSelectBuffer(size: GLsizei, buffer: GLuint_): void {
    return OpenGL32.Load('glSelectBuffer')(size, buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glshademodel
  public static glShadeModel(mode: GLenum): void {
    return OpenGL32.Load('glShadeModel')(mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glstencilfunc
  public static glStencilFunc(func: GLenum, ref: GLint, mask: GLuint): void {
    return OpenGL32.Load('glStencilFunc')(func, ref, mask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glstencilmask
  public static glStencilMask(mask: GLuint): void {
    return OpenGL32.Load('glStencilMask')(mask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glstencilop
  public static glStencilOp(fail: GLenum, zfail: GLenum, zpass: GLenum): void {
    return OpenGL32.Load('glStencilOp')(fail, zfail, zpass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord1d
  public static glTexCoord1d(s: GLdouble): void {
    return OpenGL32.Load('glTexCoord1d')(s);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord1dv
  public static glTexCoord1dv(v: GLdouble_): void {
    return OpenGL32.Load('glTexCoord1dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord1f
  public static glTexCoord1f(s: GLfloat): void {
    return OpenGL32.Load('glTexCoord1f')(s);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord1fv
  public static glTexCoord1fv(v: GLfloat_): void {
    return OpenGL32.Load('glTexCoord1fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord1i
  public static glTexCoord1i(s: GLint): void {
    return OpenGL32.Load('glTexCoord1i')(s);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord1iv
  public static glTexCoord1iv(v: GLint_): void {
    return OpenGL32.Load('glTexCoord1iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord1s
  public static glTexCoord1s(s: GLshort): void {
    return OpenGL32.Load('glTexCoord1s')(s);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord1sv
  public static glTexCoord1sv(v: GLshort_): void {
    return OpenGL32.Load('glTexCoord1sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord2d
  public static glTexCoord2d(s: GLdouble, t: GLdouble): void {
    return OpenGL32.Load('glTexCoord2d')(s, t);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord2dv
  public static glTexCoord2dv(v: GLdouble_): void {
    return OpenGL32.Load('glTexCoord2dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord2f
  public static glTexCoord2f(s: GLfloat, t: GLfloat): void {
    return OpenGL32.Load('glTexCoord2f')(s, t);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord2fv
  public static glTexCoord2fv(v: GLfloat_): void {
    return OpenGL32.Load('glTexCoord2fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord2i
  public static glTexCoord2i(s: GLint, t: GLint): void {
    return OpenGL32.Load('glTexCoord2i')(s, t);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord2iv
  public static glTexCoord2iv(v: GLint_): void {
    return OpenGL32.Load('glTexCoord2iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord2s
  public static glTexCoord2s(s: GLshort, t: GLshort): void {
    return OpenGL32.Load('glTexCoord2s')(s, t);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord2sv
  public static glTexCoord2sv(v: GLshort_): void {
    return OpenGL32.Load('glTexCoord2sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord3d
  public static glTexCoord3d(s: GLdouble, t: GLdouble, r: GLdouble): void {
    return OpenGL32.Load('glTexCoord3d')(s, t, r);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord3dv
  public static glTexCoord3dv(v: GLdouble_): void {
    return OpenGL32.Load('glTexCoord3dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord3f
  public static glTexCoord3f(s: GLfloat, t: GLfloat, r: GLfloat): void {
    return OpenGL32.Load('glTexCoord3f')(s, t, r);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord3fv
  public static glTexCoord3fv(v: GLfloat_): void {
    return OpenGL32.Load('glTexCoord3fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord3i
  public static glTexCoord3i(s: GLint, t: GLint, r: GLint): void {
    return OpenGL32.Load('glTexCoord3i')(s, t, r);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord3iv
  public static glTexCoord3iv(v: GLint_): void {
    return OpenGL32.Load('glTexCoord3iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord3s
  public static glTexCoord3s(s: GLshort, t: GLshort, r: GLshort): void {
    return OpenGL32.Load('glTexCoord3s')(s, t, r);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord3sv
  public static glTexCoord3sv(v: GLshort_): void {
    return OpenGL32.Load('glTexCoord3sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord4d
  public static glTexCoord4d(s: GLdouble, t: GLdouble, r: GLdouble, q: GLdouble): void {
    return OpenGL32.Load('glTexCoord4d')(s, t, r, q);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord4dv
  public static glTexCoord4dv(v: GLdouble_): void {
    return OpenGL32.Load('glTexCoord4dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord4f
  public static glTexCoord4f(s: GLfloat, t: GLfloat, r: GLfloat, q: GLfloat): void {
    return OpenGL32.Load('glTexCoord4f')(s, t, r, q);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord4fv
  public static glTexCoord4fv(v: GLfloat_): void {
    return OpenGL32.Load('glTexCoord4fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord4i
  public static glTexCoord4i(s: GLint, t: GLint, r: GLint, q: GLint): void {
    return OpenGL32.Load('glTexCoord4i')(s, t, r, q);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord4iv
  public static glTexCoord4iv(v: GLint_): void {
    return OpenGL32.Load('glTexCoord4iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord4s
  public static glTexCoord4s(s: GLshort, t: GLshort, r: GLshort, q: GLshort): void {
    return OpenGL32.Load('glTexCoord4s')(s, t, r, q);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoord4sv
  public static glTexCoord4sv(v: GLshort_): void {
    return OpenGL32.Load('glTexCoord4sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexcoordpointer
  public static glTexCoordPointer(size: GLint, type: GLenum, stride: GLsizei, pointer: GLvoid_): void {
    return OpenGL32.Load('glTexCoordPointer')(size, type, stride, pointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexenvf
  public static glTexEnvf(target: GLenum, pname: GLenum, param: GLfloat): void {
    return OpenGL32.Load('glTexEnvf')(target, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexenvfv
  public static glTexEnvfv(target: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glTexEnvfv')(target, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexenvi
  public static glTexEnvi(target: GLenum, pname: GLenum, param: GLint): void {
    return OpenGL32.Load('glTexEnvi')(target, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexenviv
  public static glTexEnviv(target: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glTexEnviv')(target, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexgend
  public static glTexGend(coord: GLenum, pname: GLenum, param: GLdouble): void {
    return OpenGL32.Load('glTexGend')(coord, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexgendv
  public static glTexGendv(coord: GLenum, pname: GLenum, params: GLdouble_): void {
    return OpenGL32.Load('glTexGendv')(coord, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexgenf
  public static glTexGenf(coord: GLenum, pname: GLenum, param: GLfloat): void {
    return OpenGL32.Load('glTexGenf')(coord, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexgenfv
  public static glTexGenfv(coord: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glTexGenfv')(coord, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexgeni
  public static glTexGeni(coord: GLenum, pname: GLenum, param: GLint): void {
    return OpenGL32.Load('glTexGeni')(coord, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexgeniv
  public static glTexGeniv(coord: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glTexGeniv')(coord, pname, params);
  }

  // prettier-ignore
  // https://learn.microsoft.com/en-us/windows/win32/opengl/glteximage1d
  public static glTexImage1D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, border: GLint, format: GLint, type: GLenum, pixels: GLvoid_ | NULL) : void {
    return OpenGL32.Load('glTexImage1D')(target, level, internalformat, width, border, format, type, pixels);
  }

  // prettier-ignore
  // https://learn.microsoft.com/en-us/windows/win32/opengl/glteximage2d
  public static glTexImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLint, type: GLenum, pixels: GLvoid_ | NULL) : void {
    return OpenGL32.Load('glTexImage2D')(target, level, internalformat, width, height, border, format, type, pixels);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexparameterf
  public static glTexParameterf(target: GLenum, pname: GLenum, param: GLfloat): void {
    return OpenGL32.Load('glTexParameterf')(target, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexparameterfv
  public static glTexParameterfv(target: GLenum, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.Load('glTexParameterfv')(target, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexparameteri
  public static glTexParameteri(target: GLenum, pname: GLenum, param: GLint): void {
    return OpenGL32.Load('glTexParameteri')(target, pname, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexparameteriv
  public static glTexParameteriv(target: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.Load('glTexParameteriv')(target, pname, params);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexsubimage1d
  public static glTexSubImage1D(target: GLenum, level: GLint, xoffset: GLint, width: GLsizei, format: GLenum, type: GLenum, pixels: GLvoid_): void {
    return OpenGL32.Load('glTexSubImage1D')(target, level, xoffset, width, format, type, pixels);
  }

  // prettier-ignore
  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltexsubimage2d
  public static glTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, pixels: GLvoid_) : void {
    return OpenGL32.Load('glTexSubImage2D')(target, level, xoffset, yoffset, width, height, format, type, pixels);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltranslated
  public static glTranslated(x: GLdouble, y: GLdouble, z: GLdouble): void {
    return OpenGL32.Load('glTranslated')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gltranslatef
  public static glTranslatef(x: GLfloat, y: GLfloat, z: GLfloat): void {
    return OpenGL32.Load('glTranslatef')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex2d
  public static glVertex2d(x: GLdouble, y: GLdouble): void {
    return OpenGL32.Load('glVertex2d')(x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex2dv
  public static glVertex2dv(v: GLdouble_): void {
    return OpenGL32.Load('glVertex2dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex2f
  public static glVertex2f(x: GLfloat, y: GLfloat): void {
    return OpenGL32.Load('glVertex2f')(x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex2fv
  public static glVertex2fv(v: GLfloat_): void {
    return OpenGL32.Load('glVertex2fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex2i
  public static glVertex2i(x: GLint, y: GLint): void {
    return OpenGL32.Load('glVertex2i')(x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex2iv
  public static glVertex2iv(v: GLint_): void {
    return OpenGL32.Load('glVertex2iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex2s
  public static glVertex2s(x: GLshort, y: GLshort): void {
    return OpenGL32.Load('glVertex2s')(x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex2sv
  public static glVertex2sv(v: GLshort_): void {
    return OpenGL32.Load('glVertex2sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex3d
  public static glVertex3d(x: GLdouble, y: GLdouble, z: GLdouble): void {
    return OpenGL32.Load('glVertex3d')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex3dv
  public static glVertex3dv(v: GLdouble_): void {
    return OpenGL32.Load('glVertex3dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex3f
  public static glVertex3f(x: GLfloat, y: GLfloat, z: GLfloat): void {
    return OpenGL32.Load('glVertex3f')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex3fv
  public static glVertex3fv(v: GLfloat_): void {
    return OpenGL32.Load('glVertex3fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex3i
  public static glVertex3i(x: GLint, y: GLint, z: GLint): void {
    return OpenGL32.Load('glVertex3i')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex3iv
  public static glVertex3iv(v: GLint_): void {
    return OpenGL32.Load('glVertex3iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex3s
  public static glVertex3s(x: GLshort, y: GLshort, z: GLshort): void {
    return OpenGL32.Load('glVertex3s')(x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex3sv
  public static glVertex3sv(v: GLshort_): void {
    return OpenGL32.Load('glVertex3sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex4d
  public static glVertex4d(x: GLdouble, y: GLdouble, z: GLdouble, w: GLdouble): void {
    return OpenGL32.Load('glVertex4d')(x, y, z, w);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex4dv
  public static glVertex4dv(v: GLdouble_): void {
    return OpenGL32.Load('glVertex4dv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex4f
  public static glVertex4f(x: GLfloat, y: GLfloat, z: GLfloat, w: GLfloat): void {
    return OpenGL32.Load('glVertex4f')(x, y, z, w);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex4fv
  public static glVertex4fv(v: GLfloat_): void {
    return OpenGL32.Load('glVertex4fv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex4i
  public static glVertex4i(x: GLint, y: GLint, z: GLint, w: GLint): void {
    return OpenGL32.Load('glVertex4i')(x, y, z, w);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex4iv
  public static glVertex4iv(v: GLint_): void {
    return OpenGL32.Load('glVertex4iv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex4s
  public static glVertex4s(x: GLshort, y: GLshort, z: GLshort, w: GLshort): void {
    return OpenGL32.Load('glVertex4s')(x, y, z, w);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertex4sv
  public static glVertex4sv(v: GLshort_): void {
    return OpenGL32.Load('glVertex4sv')(v);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glvertexpointer
  public static glVertexPointer(size: GLint, type: GLenum, stride: GLsizei, pointer: GLvoid_): void {
    return OpenGL32.Load('glVertexPointer')(size, type, stride, pointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glviewport
  public static glViewport(x: GLint, y: GLint, width: GLsizei, height: GLsizei): void {
    return OpenGL32.Load('glViewport')(x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglchoosepixelformat
  public static wglChoosePixelFormat(hdc: HDC, ppfd: LPPIXELFORMATDESCRIPTOR): INT {
    return OpenGL32.Load('wglChoosePixelFormat')(hdc, ppfd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglcopycontext
  public static wglCopyContext(hglrcSrc: HGLRC, hglrcDst: HGLRC, mask: UINT): BOOL {
    return OpenGL32.Load('wglCopyContext')(hglrcSrc, hglrcDst, mask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglcreatecontext
  public static wglCreateContext(hdc: HDC): HGLRC {
    return OpenGL32.Load('wglCreateContext')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglcreatelayercontext
  public static wglCreateLayerContext(hdc: HDC, iLayerPlane: INT): HGLRC {
    return OpenGL32.Load('wglCreateLayerContext')(hdc, iLayerPlane);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wgldeletecontext
  public static wglDeleteContext(hglrc: HGLRC): BOOL {
    return OpenGL32.Load('wglDeleteContext')(hglrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wgldescribelayerplane
  public static wglDescribeLayerPlane(hdc: HDC, iPixelFormat: INT, iLayerPlane: INT, nBytes: UINT, plpd: LPLAYERPLANEDESCRIPTOR): BOOL {
    return OpenGL32.Load('wglDescribeLayerPlane')(hdc, iPixelFormat, iLayerPlane, nBytes, plpd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wgldescribepixelformat
  public static wglDescribePixelFormat(hdc: HDC, iPixelFormat: INT, nBytes: UINT, ppfd: LPPIXELFORMATDESCRIPTOR | NULL): INT {
    return OpenGL32.Load('wglDescribePixelFormat')(hdc, iPixelFormat, nBytes, ppfd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglgetcurrentcontext
  public static wglGetCurrentContext(): HGLRC {
    return OpenGL32.Load('wglGetCurrentContext')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglgetcurrentdc
  public static wglGetCurrentDC(): HDC {
    return OpenGL32.Load('wglGetCurrentDC')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglgetlayerpaletteentries
  public static wglGetLayerPaletteEntries(hdc: HDC, iLayerPlane: INT, iStart: INT, cEntries: INT, pcr: GLvoid_): INT {
    return OpenGL32.Load('wglGetLayerPaletteEntries')(hdc, iLayerPlane, iStart, cEntries, pcr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglgetprocaddress
  public static wglGetProcAddress(lpszProc: LPCSTR): PROC {
    return OpenGL32.Load('wglGetProcAddress')(lpszProc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglmakecurrent
  public static wglMakeCurrent(hdc: HDC, hglrc: HGLRC | 0n): BOOL {
    return OpenGL32.Load('wglMakeCurrent')(hdc, hglrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglrealizelayerpalette
  public static wglRealizeLayerPalette(hdc: HDC, iLayerPlane: INT, bRealize: BOOL): BOOL {
    return OpenGL32.Load('wglRealizeLayerPalette')(hdc, iLayerPlane, bRealize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglsetlayerpaletteentries
  public static wglSetLayerPaletteEntries(hdc: HDC, iLayerPlane: INT, iStart: INT, cEntries: INT, pcr: GLvoid_): INT {
    return OpenGL32.Load('wglSetLayerPaletteEntries')(hdc, iLayerPlane, iStart, cEntries, pcr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglsetpixelformat
  public static wglSetPixelFormat(hdc: HDC, iPixelFormat: INT, ppfd: LPPIXELFORMATDESCRIPTOR): BOOL {
    return OpenGL32.Load('wglSetPixelFormat')(hdc, iPixelFormat, ppfd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglsharelists
  public static wglShareLists(hglrc1: HGLRC, hglrc2: HGLRC): BOOL {
    return OpenGL32.Load('wglShareLists')(hglrc1, hglrc2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglswapbuffers
  public static wglSwapBuffers(hdc: HDC): BOOL {
    return OpenGL32.Load('wglSwapBuffers')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglswaplayerbuffers
  public static wglSwapLayerBuffers(hdc: HDC, fuPlanes: UINT): BOOL {
    return OpenGL32.Load('wglSwapLayerBuffers')(hdc, fuPlanes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglusefontbitmapsa
  public static wglUseFontBitmapsA(hdc: HDC, first: DWORD, count: DWORD, listBase: DWORD): BOOL {
    return OpenGL32.Load('wglUseFontBitmapsA')(hdc, first, count, listBase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglusefontbitmapsw
  public static wglUseFontBitmapsW(hdc: HDC, first: DWORD, count: DWORD, listBase: DWORD): BOOL {
    return OpenGL32.Load('wglUseFontBitmapsW')(hdc, first, count, listBase);
  }

  // prettier-ignore
  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglusefontoutlinesa
  public static wglUseFontOutlinesA(hdc: HDC, first: DWORD, count: DWORD, listBase: DWORD, deviation: GLfloat, extrusion: GLfloat, format: INT, lpgmf: LPGLYPHMETRICSFLOAT | NULL) : BOOL {
    return OpenGL32.Load('wglUseFontOutlinesA')(hdc, first, count, listBase, deviation, extrusion, format, lpgmf);
  }

  // prettier-ignore
  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglusefontoutlinesw
  public static wglUseFontOutlinesW(hdc: HDC, first: DWORD, count: DWORD, listBase: DWORD, deviation: GLfloat, extrusion: GLfloat, format: INT, lpgmf: LPGLYPHMETRICSFLOAT | NULL) : BOOL {
    return OpenGL32.Load('wglUseFontOutlinesW')(hdc, first, count, listBase, deviation, extrusion, format, lpgmf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglgetdefaultprocaddress
  public static wglGetDefaultProcAddress(lpszProc: LPCSTR): PROC {
    return OpenGL32.Load('wglGetDefaultProcAddress')(lpszProc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-wglswapmultiplebuffers
  public static wglSwapMultipleBuffers(n: UINT, lpBuffers: LPWGLSWAP): DWORD {
    return OpenGL32.Load('wglSwapMultipleBuffers')(n, lpBuffers);
  }

  // ---------------------------------------------------------------------------
  // WGL Extensions (lazy-loaded via wglGetProcAddress)
  // ---------------------------------------------------------------------------

  public static wglChoosePixelFormatARB(hdc: HDC, piAttribIList: GLint_ | NULL, pfAttribFList: GLfloat_ | NULL, nMaxFormats: UINT, piFormats: GLint_, nNumFormats: GLuint_): BOOL {
    return OpenGL32.LoadExtension('wglChoosePixelFormatARB')(hdc, piAttribIList, pfAttribFList, nMaxFormats, piFormats, nNumFormats);
  }
  public static wglCreateContextAttribsARB(hdc: HDC, hShareContext: HGLRC | 0n, attribList: GLint_): HGLRC {
    return OpenGL32.LoadExtension('wglCreateContextAttribsARB')(hdc, hShareContext, attribList);
  }
  public static wglGetExtensionsStringARB(hdc: HDC): GLchar_ {
    return OpenGL32.LoadExtension('wglGetExtensionsStringARB')(hdc);
  }
  public static wglGetExtensionsStringEXT(): GLchar_ {
    return OpenGL32.LoadExtension('wglGetExtensionsStringEXT')();
  }
  public static wglGetPixelFormatAttribfvARB(hdc: HDC, iPixelFormat: INT, iLayerPlane: INT, nAttributes: UINT, piAttributes: GLint_, pfValues: GLfloat_): BOOL {
    return OpenGL32.LoadExtension('wglGetPixelFormatAttribfvARB')(hdc, iPixelFormat, iLayerPlane, nAttributes, piAttributes, pfValues);
  }
  public static wglGetPixelFormatAttribivARB(hdc: HDC, iPixelFormat: INT, iLayerPlane: INT, nAttributes: UINT, piAttributes: GLint_, piValues: GLint_): BOOL {
    return OpenGL32.LoadExtension('wglGetPixelFormatAttribivARB')(hdc, iPixelFormat, iLayerPlane, nAttributes, piAttributes, piValues);
  }
  public static wglGetSwapIntervalEXT(): INT {
    return OpenGL32.LoadExtension('wglGetSwapIntervalEXT')();
  }
  public static wglSwapIntervalEXT(interval: INT): BOOL {
    return OpenGL32.LoadExtension('wglSwapIntervalEXT')(interval);
  }

  // ---------------------------------------------------------------------------
  // GL Extensions - VBO (lazy-loaded via wglGetProcAddress)
  // ---------------------------------------------------------------------------

  public static glBindBuffer(target: GLenum, buffer: GLuint): void {
    return OpenGL32.LoadExtension('glBindBuffer')(target, buffer);
  }
  public static glBufferData(target: GLenum, size: GLsizeiptr, data: GLvoid_ | NULL, usage: GLenum): void {
    return OpenGL32.LoadExtension('glBufferData')(target, size, data, usage);
  }
  public static glBufferSubData(target: GLenum, offset: GLintptr, size: GLsizeiptr, data: GLvoid_): void {
    return OpenGL32.LoadExtension('glBufferSubData')(target, offset, size, data);
  }
  public static glDeleteBuffers(n: GLsizei, buffers: GLuint_): void {
    return OpenGL32.LoadExtension('glDeleteBuffers')(n, buffers);
  }
  public static glGenBuffers(n: GLsizei, buffers: GLuint_): void {
    return OpenGL32.LoadExtension('glGenBuffers')(n, buffers);
  }
  public static glGetBufferParameteriv(target: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.LoadExtension('glGetBufferParameteriv')(target, pname, params);
  }
  public static glGetBufferPointerv(target: GLenum, pname: GLenum, params: GLvoid_): void {
    return OpenGL32.LoadExtension('glGetBufferPointerv')(target, pname, params);
  }
  public static glGetBufferSubData(target: GLenum, offset: GLintptr, size: GLsizeiptr, data: GLvoid_): void {
    return OpenGL32.LoadExtension('glGetBufferSubData')(target, offset, size, data);
  }
  public static glIsBuffer(buffer: GLuint): GLboolean {
    return OpenGL32.LoadExtension('glIsBuffer')(buffer);
  }
  public static glMapBuffer(target: GLenum, access: GLenum): GLvoid_ {
    return OpenGL32.LoadExtension('glMapBuffer')(target, access);
  }
  public static glUnmapBuffer(target: GLenum): GLboolean {
    return OpenGL32.LoadExtension('glUnmapBuffer')(target);
  }

  // ---------------------------------------------------------------------------
  // GL Extensions - Shaders (lazy-loaded via wglGetProcAddress)
  // ---------------------------------------------------------------------------

  public static glAttachShader(program: GLuint, shader: GLuint): void {
    return OpenGL32.LoadExtension('glAttachShader')(program, shader);
  }
  public static glCompileShader(shader: GLuint): void {
    return OpenGL32.LoadExtension('glCompileShader')(shader);
  }
  public static glCreateProgram(): GLuint {
    return OpenGL32.LoadExtension('glCreateProgram')();
  }
  public static glCreateShader(type: GLenum): GLuint {
    return OpenGL32.LoadExtension('glCreateShader')(type);
  }
  public static glDeleteProgram(program: GLuint): void {
    return OpenGL32.LoadExtension('glDeleteProgram')(program);
  }
  public static glDeleteShader(shader: GLuint): void {
    return OpenGL32.LoadExtension('glDeleteShader')(shader);
  }
  public static glDetachShader(program: GLuint, shader: GLuint): void {
    return OpenGL32.LoadExtension('glDetachShader')(program, shader);
  }
  public static glGetProgramInfoLog(program: GLuint, bufSize: GLsizei, length: GLsizei_ | NULL, infoLog: GLchar_): void {
    return OpenGL32.LoadExtension('glGetProgramInfoLog')(program, bufSize, length, infoLog);
  }
  public static glGetProgramiv(program: GLuint, pname: GLenum, params: GLint_): void {
    return OpenGL32.LoadExtension('glGetProgramiv')(program, pname, params);
  }
  public static glGetShaderInfoLog(shader: GLuint, bufSize: GLsizei, length: GLsizei_ | NULL, infoLog: GLchar_): void {
    return OpenGL32.LoadExtension('glGetShaderInfoLog')(shader, bufSize, length, infoLog);
  }
  public static glGetShaderiv(shader: GLuint, pname: GLenum, params: GLint_): void {
    return OpenGL32.LoadExtension('glGetShaderiv')(shader, pname, params);
  }
  public static glGetShaderSource(shader: GLuint, bufSize: GLsizei, length: GLsizei_ | NULL, source: GLchar_): void {
    return OpenGL32.LoadExtension('glGetShaderSource')(shader, bufSize, length, source);
  }
  public static glGetUniformLocation(program: GLuint, name: GLchar_): GLint {
    return OpenGL32.LoadExtension('glGetUniformLocation')(program, name);
  }
  public static glIsProgram(program: GLuint): GLboolean {
    return OpenGL32.LoadExtension('glIsProgram')(program);
  }
  public static glIsShader(shader: GLuint): GLboolean {
    return OpenGL32.LoadExtension('glIsShader')(shader);
  }
  public static glLinkProgram(program: GLuint): void {
    return OpenGL32.LoadExtension('glLinkProgram')(program);
  }
  public static glShaderSource(shader: GLuint, count: GLsizei, string: GLchar_, length: GLint_ | NULL): void {
    return OpenGL32.LoadExtension('glShaderSource')(shader, count, string, length);
  }
  public static glUseProgram(program: GLuint): void {
    return OpenGL32.LoadExtension('glUseProgram')(program);
  }
  public static glValidateProgram(program: GLuint): void {
    return OpenGL32.LoadExtension('glValidateProgram')(program);
  }

  // Uniforms
  public static glUniform1f(location: GLint, v0: GLfloat): void {
    return OpenGL32.LoadExtension('glUniform1f')(location, v0);
  }
  public static glUniform1fv(location: GLint, count: GLsizei, value: GLfloat_): void {
    return OpenGL32.LoadExtension('glUniform1fv')(location, count, value);
  }
  public static glUniform1i(location: GLint, v0: GLint): void {
    return OpenGL32.LoadExtension('glUniform1i')(location, v0);
  }
  public static glUniform1iv(location: GLint, count: GLsizei, value: GLint_): void {
    return OpenGL32.LoadExtension('glUniform1iv')(location, count, value);
  }
  public static glUniform2f(location: GLint, v0: GLfloat, v1: GLfloat): void {
    return OpenGL32.LoadExtension('glUniform2f')(location, v0, v1);
  }
  public static glUniform2fv(location: GLint, count: GLsizei, value: GLfloat_): void {
    return OpenGL32.LoadExtension('glUniform2fv')(location, count, value);
  }
  public static glUniform2i(location: GLint, v0: GLint, v1: GLint): void {
    return OpenGL32.LoadExtension('glUniform2i')(location, v0, v1);
  }
  public static glUniform2iv(location: GLint, count: GLsizei, value: GLint_): void {
    return OpenGL32.LoadExtension('glUniform2iv')(location, count, value);
  }
  public static glUniform3f(location: GLint, v0: GLfloat, v1: GLfloat, v2: GLfloat): void {
    return OpenGL32.LoadExtension('glUniform3f')(location, v0, v1, v2);
  }
  public static glUniform3fv(location: GLint, count: GLsizei, value: GLfloat_): void {
    return OpenGL32.LoadExtension('glUniform3fv')(location, count, value);
  }
  public static glUniform3i(location: GLint, v0: GLint, v1: GLint, v2: GLint): void {
    return OpenGL32.LoadExtension('glUniform3i')(location, v0, v1, v2);
  }
  public static glUniform3iv(location: GLint, count: GLsizei, value: GLint_): void {
    return OpenGL32.LoadExtension('glUniform3iv')(location, count, value);
  }
  public static glUniform4f(location: GLint, v0: GLfloat, v1: GLfloat, v2: GLfloat, v3: GLfloat): void {
    return OpenGL32.LoadExtension('glUniform4f')(location, v0, v1, v2, v3);
  }
  public static glUniform4fv(location: GLint, count: GLsizei, value: GLfloat_): void {
    return OpenGL32.LoadExtension('glUniform4fv')(location, count, value);
  }
  public static glUniform4i(location: GLint, v0: GLint, v1: GLint, v2: GLint, v3: GLint): void {
    return OpenGL32.LoadExtension('glUniform4i')(location, v0, v1, v2, v3);
  }
  public static glUniform4iv(location: GLint, count: GLsizei, value: GLint_): void {
    return OpenGL32.LoadExtension('glUniform4iv')(location, count, value);
  }
  public static glUniformMatrix2fv(location: GLint, count: GLsizei, transpose: GLboolean, value: GLfloat_): void {
    return OpenGL32.LoadExtension('glUniformMatrix2fv')(location, count, transpose, value);
  }
  public static glUniformMatrix3fv(location: GLint, count: GLsizei, transpose: GLboolean, value: GLfloat_): void {
    return OpenGL32.LoadExtension('glUniformMatrix3fv')(location, count, transpose, value);
  }
  public static glUniformMatrix4fv(location: GLint, count: GLsizei, transpose: GLboolean, value: GLfloat_): void {
    return OpenGL32.LoadExtension('glUniformMatrix4fv')(location, count, transpose, value);
  }

  // ---------------------------------------------------------------------------
  // GL Extensions - Vertex Attribs (lazy-loaded via wglGetProcAddress)
  // ---------------------------------------------------------------------------

  public static glBindAttribLocation(program: GLuint, index: GLuint, name: GLchar_): void {
    return OpenGL32.LoadExtension('glBindAttribLocation')(program, index, name);
  }
  public static glDisableVertexAttribArray(index: GLuint): void {
    return OpenGL32.LoadExtension('glDisableVertexAttribArray')(index);
  }
  public static glEnableVertexAttribArray(index: GLuint): void {
    return OpenGL32.LoadExtension('glEnableVertexAttribArray')(index);
  }
  public static glGetActiveAttrib(program: GLuint, index: GLuint, bufSize: GLsizei, length: GLsizei_ | NULL, size: GLint_, type: GLenum_, name: GLchar_): void {
    return OpenGL32.LoadExtension('glGetActiveAttrib')(program, index, bufSize, length, size, type, name);
  }
  public static glGetActiveUniform(program: GLuint, index: GLuint, bufSize: GLsizei, length: GLsizei_ | NULL, size: GLint_, type: GLenum_, name: GLchar_): void {
    return OpenGL32.LoadExtension('glGetActiveUniform')(program, index, bufSize, length, size, type, name);
  }
  public static glGetAttribLocation(program: GLuint, name: GLchar_): GLint {
    return OpenGL32.LoadExtension('glGetAttribLocation')(program, name);
  }
  public static glGetVertexAttribdv(index: GLuint, pname: GLenum, params: GLdouble_): void {
    return OpenGL32.LoadExtension('glGetVertexAttribdv')(index, pname, params);
  }
  public static glGetVertexAttribfv(index: GLuint, pname: GLenum, params: GLfloat_): void {
    return OpenGL32.LoadExtension('glGetVertexAttribfv')(index, pname, params);
  }
  public static glGetVertexAttribiv(index: GLuint, pname: GLenum, params: GLint_): void {
    return OpenGL32.LoadExtension('glGetVertexAttribiv')(index, pname, params);
  }
  public static glGetVertexAttribPointerv(index: GLuint, pname: GLenum, pointer: GLvoid_): void {
    return OpenGL32.LoadExtension('glGetVertexAttribPointerv')(index, pname, pointer);
  }
  public static glVertexAttrib1d(index: GLuint, x: GLdouble): void {
    return OpenGL32.LoadExtension('glVertexAttrib1d')(index, x);
  }
  public static glVertexAttrib1dv(index: GLuint, v: GLdouble_): void {
    return OpenGL32.LoadExtension('glVertexAttrib1dv')(index, v);
  }
  public static glVertexAttrib1f(index: GLuint, x: GLfloat): void {
    return OpenGL32.LoadExtension('glVertexAttrib1f')(index, x);
  }
  public static glVertexAttrib1fv(index: GLuint, v: GLfloat_): void {
    return OpenGL32.LoadExtension('glVertexAttrib1fv')(index, v);
  }
  public static glVertexAttrib1s(index: GLuint, x: GLshort): void {
    return OpenGL32.LoadExtension('glVertexAttrib1s')(index, x);
  }
  public static glVertexAttrib1sv(index: GLuint, v: GLshort_): void {
    return OpenGL32.LoadExtension('glVertexAttrib1sv')(index, v);
  }
  public static glVertexAttrib2d(index: GLuint, x: GLdouble, y: GLdouble): void {
    return OpenGL32.LoadExtension('glVertexAttrib2d')(index, x, y);
  }
  public static glVertexAttrib2dv(index: GLuint, v: GLdouble_): void {
    return OpenGL32.LoadExtension('glVertexAttrib2dv')(index, v);
  }
  public static glVertexAttrib2f(index: GLuint, x: GLfloat, y: GLfloat): void {
    return OpenGL32.LoadExtension('glVertexAttrib2f')(index, x, y);
  }
  public static glVertexAttrib2fv(index: GLuint, v: GLfloat_): void {
    return OpenGL32.LoadExtension('glVertexAttrib2fv')(index, v);
  }
  public static glVertexAttrib2s(index: GLuint, x: GLshort, y: GLshort): void {
    return OpenGL32.LoadExtension('glVertexAttrib2s')(index, x, y);
  }
  public static glVertexAttrib2sv(index: GLuint, v: GLshort_): void {
    return OpenGL32.LoadExtension('glVertexAttrib2sv')(index, v);
  }
  public static glVertexAttrib3d(index: GLuint, x: GLdouble, y: GLdouble, z: GLdouble): void {
    return OpenGL32.LoadExtension('glVertexAttrib3d')(index, x, y, z);
  }
  public static glVertexAttrib3dv(index: GLuint, v: GLdouble_): void {
    return OpenGL32.LoadExtension('glVertexAttrib3dv')(index, v);
  }
  public static glVertexAttrib3f(index: GLuint, x: GLfloat, y: GLfloat, z: GLfloat): void {
    return OpenGL32.LoadExtension('glVertexAttrib3f')(index, x, y, z);
  }
  public static glVertexAttrib3fv(index: GLuint, v: GLfloat_): void {
    return OpenGL32.LoadExtension('glVertexAttrib3fv')(index, v);
  }
  public static glVertexAttrib3s(index: GLuint, x: GLshort, y: GLshort, z: GLshort): void {
    return OpenGL32.LoadExtension('glVertexAttrib3s')(index, x, y, z);
  }
  public static glVertexAttrib3sv(index: GLuint, v: GLshort_): void {
    return OpenGL32.LoadExtension('glVertexAttrib3sv')(index, v);
  }
  public static glVertexAttrib4bv(index: GLuint, v: GLbyte_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4bv')(index, v);
  }
  public static glVertexAttrib4d(index: GLuint, x: GLdouble, y: GLdouble, z: GLdouble, w: GLdouble): void {
    return OpenGL32.LoadExtension('glVertexAttrib4d')(index, x, y, z, w);
  }
  public static glVertexAttrib4dv(index: GLuint, v: GLdouble_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4dv')(index, v);
  }
  public static glVertexAttrib4f(index: GLuint, x: GLfloat, y: GLfloat, z: GLfloat, w: GLfloat): void {
    return OpenGL32.LoadExtension('glVertexAttrib4f')(index, x, y, z, w);
  }
  public static glVertexAttrib4fv(index: GLuint, v: GLfloat_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4fv')(index, v);
  }
  public static glVertexAttrib4iv(index: GLuint, v: GLint_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4iv')(index, v);
  }
  public static glVertexAttrib4Nbv(index: GLuint, v: GLbyte_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4Nbv')(index, v);
  }
  public static glVertexAttrib4Niv(index: GLuint, v: GLint_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4Niv')(index, v);
  }
  public static glVertexAttrib4Nsv(index: GLuint, v: GLshort_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4Nsv')(index, v);
  }
  public static glVertexAttrib4Nub(index: GLuint, x: GLubyte, y: GLubyte, z: GLubyte, w: GLubyte): void {
    return OpenGL32.LoadExtension('glVertexAttrib4Nub')(index, x, y, z, w);
  }
  public static glVertexAttrib4Nubv(index: GLuint, v: GLubyte_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4Nubv')(index, v);
  }
  public static glVertexAttrib4Nuiv(index: GLuint, v: GLuint_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4Nuiv')(index, v);
  }
  public static glVertexAttrib4Nusv(index: GLuint, v: GLushort_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4Nusv')(index, v);
  }
  public static glVertexAttrib4s(index: GLuint, x: GLshort, y: GLshort, z: GLshort, w: GLshort): void {
    return OpenGL32.LoadExtension('glVertexAttrib4s')(index, x, y, z, w);
  }
  public static glVertexAttrib4sv(index: GLuint, v: GLshort_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4sv')(index, v);
  }
  public static glVertexAttrib4ubv(index: GLuint, v: GLubyte_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4ubv')(index, v);
  }
  public static glVertexAttrib4uiv(index: GLuint, v: GLuint_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4uiv')(index, v);
  }
  public static glVertexAttrib4usv(index: GLuint, v: GLushort_): void {
    return OpenGL32.LoadExtension('glVertexAttrib4usv')(index, v);
  }
  public static glVertexAttribPointer(index: GLuint, size: GLint, type: GLenum, normalized: GLboolean, stride: GLsizei, pointer: GLvoid_): void {
    return OpenGL32.LoadExtension('glVertexAttribPointer')(index, size, type, normalized, stride, pointer);
  }

  // ---------------------------------------------------------------------------
  // GL Extensions - VAO (lazy-loaded via wglGetProcAddress)
  // ---------------------------------------------------------------------------

  public static glBindVertexArray(array: GLuint): void {
    return OpenGL32.LoadExtension('glBindVertexArray')(array);
  }
  public static glDeleteVertexArrays(n: GLsizei, arrays: GLuint_): void {
    return OpenGL32.LoadExtension('glDeleteVertexArrays')(n, arrays);
  }
  public static glGenVertexArrays(n: GLsizei, arrays: GLuint_): void {
    return OpenGL32.LoadExtension('glGenVertexArrays')(n, arrays);
  }
  public static glIsVertexArray(array: GLuint): GLboolean {
    return OpenGL32.LoadExtension('glIsVertexArray')(array);
  }

  // ---------------------------------------------------------------------------
  // GL Extensions - FBO (lazy-loaded via wglGetProcAddress)
  // ---------------------------------------------------------------------------

  public static glBindFramebuffer(target: GLenum, framebuffer: GLuint): void {
    return OpenGL32.LoadExtension('glBindFramebuffer')(target, framebuffer);
  }
  public static glBindRenderbuffer(target: GLenum, renderbuffer: GLuint): void {
    return OpenGL32.LoadExtension('glBindRenderbuffer')(target, renderbuffer);
  }
  public static glCheckFramebufferStatus(target: GLenum): GLenum {
    return OpenGL32.LoadExtension('glCheckFramebufferStatus')(target);
  }
  public static glDeleteFramebuffers(n: GLsizei, framebuffers: GLuint_): void {
    return OpenGL32.LoadExtension('glDeleteFramebuffers')(n, framebuffers);
  }
  public static glDeleteRenderbuffers(n: GLsizei, renderbuffers: GLuint_): void {
    return OpenGL32.LoadExtension('glDeleteRenderbuffers')(n, renderbuffers);
  }
  public static glFramebufferRenderbuffer(target: GLenum, attachment: GLenum, renderbuffertarget: GLenum, renderbuffer: GLuint): void {
    return OpenGL32.LoadExtension('glFramebufferRenderbuffer')(target, attachment, renderbuffertarget, renderbuffer);
  }
  public static glFramebufferTexture2D(target: GLenum, attachment: GLenum, textarget: GLenum, texture: GLuint, level: GLint): void {
    return OpenGL32.LoadExtension('glFramebufferTexture2D')(target, attachment, textarget, texture, level);
  }
  public static glGenFramebuffers(n: GLsizei, framebuffers: GLuint_): void {
    return OpenGL32.LoadExtension('glGenFramebuffers')(n, framebuffers);
  }
  public static glGenRenderbuffers(n: GLsizei, renderbuffers: GLuint_): void {
    return OpenGL32.LoadExtension('glGenRenderbuffers')(n, renderbuffers);
  }
  public static glGenerateMipmap(target: GLenum): void {
    return OpenGL32.LoadExtension('glGenerateMipmap')(target);
  }
  public static glGetFramebufferAttachmentParameteriv(target: GLenum, attachment: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.LoadExtension('glGetFramebufferAttachmentParameteriv')(target, attachment, pname, params);
  }
  public static glGetRenderbufferParameteriv(target: GLenum, pname: GLenum, params: GLint_): void {
    return OpenGL32.LoadExtension('glGetRenderbufferParameteriv')(target, pname, params);
  }
  public static glIsFramebuffer(framebuffer: GLuint): GLboolean {
    return OpenGL32.LoadExtension('glIsFramebuffer')(framebuffer);
  }
  public static glIsRenderbuffer(renderbuffer: GLuint): GLboolean {
    return OpenGL32.LoadExtension('glIsRenderbuffer')(renderbuffer);
  }
  public static glRenderbufferStorage(target: GLenum, internalformat: GLenum, width: GLsizei, height: GLsizei): void {
    return OpenGL32.LoadExtension('glRenderbufferStorage')(target, internalformat, width, height);
  }
}

export default OpenGL32;
