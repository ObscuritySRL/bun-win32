/**
 * OpenGL 1.1 constants for direct use without enum lookups
 * All values are compile-time constants for maximum performance
 */

import type { GLenum } from '@bun-win32/opengl32';

// Windows constants
export const AC_SRC_ALPHA = 0x01;
export const AC_SRC_OVER = 0x00;
export const DIB_RGB_COLORS = 0x00;
export const GWLP_WNDPROC = -4;
export const HWND_TOPMOST = 0xffff_ffff_ffff_ffffn; // (HWND)-1
export const PM_REMOVE = 0x0001;
export const SM_CXSCREEN = 0x00;
export const SM_CYSCREEN = 0x01;
export const SWP_NOACTIVATE = 0x0010;
export const SWP_NOSIZE = 0x0001;
export const SW_HIDE = 0x00;
export const SW_SHOWNOACTIVATE = 0x04;
export const ULW_ALPHA = 0x00000002;
export const WM_DESTROY = 0x0002;
export const WS_EX_LAYERED = 0x00080000;
export const WS_EX_NOACTIVATE = 0x08000000;
export const WS_EX_TOPMOST = 0x00000008;
export const WS_EX_TRANSPARENT = 0x00000020;
export const WS_EX_OVERLAY = WS_EX_LAYERED | WS_EX_NOACTIVATE | WS_EX_TOPMOST | WS_EX_TRANSPARENT; // after its parts
export const WS_POPUP = 0x80000000;

// GDI text
export const ANTIALIASED_QUALITY = 0x04;
export const DEFAULT_CHARSET = 0x01;
export const OUT_TT_PRECIS = 0x04;
export const TRANSPARENT = 0x01;

// Enable capabilities
export const GL_ALPHA_TEST = 0x0bc0;
export const GL_BLEND = 0x0be2;
export const GL_CULL_FACE = 0x0b44;
export const GL_DEPTH_TEST = 0x0b71;
export const GL_DITHER = 0x0bd0;
export const GL_LINE_SMOOTH = 0x0b20;
export const GL_POLYGON_SMOOTH = 0x0b41;
export const GL_SAMPLE_ALPHA_TO_COVERAGE = 0x809e;
export const GL_SCISSOR_TEST = 0x0c11;
export const GL_TEXTURE_2D = 0x0de1;

// CullFace / ReadBuffer
export const GL_BACK = 0x0405;
export const GL_FRONT = 0x0404;

// PixelFormat
export const GL_BGRA = 0x80e1 as GLenum; // GL 1.2, universally available
export const GL_RGBA = 0x1908;

// FrontFace
export const GL_CCW = 0x0901;
export const GL_CW = 0x0900;

// Texture parameters
export const GL_CLAMP_TO_EDGE = 0x812f; // GL 1.2, universally available
export const GL_LINEAR = 0x2601;
export const GL_TEXTURE_MAG_FILTER = 0x2800;
export const GL_TEXTURE_MIN_FILTER = 0x2801;
export const GL_TEXTURE_WRAP_S = 0x2802;
export const GL_TEXTURE_WRAP_T = 0x2803;

// ClientState
export const GL_COLOR_ARRAY = 0x8076;
export const GL_TEXTURE_COORD_ARRAY = 0x8078;
export const GL_VERTEX_ARRAY = 0x8074;

// Clear buffer masks
export const GL_COLOR_BUFFER_BIT = 0x00004000;
export const GL_DEPTH_BUFFER_BIT = 0x00000100;

// Boolean
export const GL_FALSE = 0x00;
export const GL_TRUE = 0x01;

// DataType
export const GL_FLOAT = 0x1406;
export const GL_SHORT = 0x1402;
export const GL_UNSIGNED_BYTE = 0x1401;
export const GL_UNSIGNED_INT = 0x1405 as GLenum;

// DepthFunc / AlphaFunc
export const GL_GREATER = 0x0204;
export const GL_LEQUAL = 0x0203;
export const GL_LESS = 0x0201;

// BeginMode (draw primitives)
export const GL_LINES = 0x0001;
export const GL_LINE_LOOP = 0x0002;
export const GL_LINE_STRIP = 0x0003;
export const GL_POINTS = 0x0000;
export const GL_TRIANGLES = 0x0004;
export const GL_TRIANGLE_FAN = 0x0006;
export const GL_TRIANGLE_STRIP = 0x0005;

// MatrixMode
export const GL_MODELVIEW = 0x1700;
export const GL_PROJECTION = 0x1701;
export const GL_TEXTURE = 0x1702;

// BlendingFactor
export const GL_ONE = 0x01;
export const GL_ONE_MINUS_SRC_ALPHA = 0x0303;
export const GL_SRC_ALPHA = 0x0302;
export const GL_ZERO = 0x00;

// PixelStore
export const GL_PACK_ALIGNMENT = 0x0d05;
export const GL_PACK_ROW_LENGTH = 0x0d02;
export const GL_UNPACK_ALIGNMENT = 0x0cf5;
