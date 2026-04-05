import type { Pointer } from 'bun:ffi';

export type { NULL } from '@bun-win32/core';

export enum GLenum {
  /* Boolean */
  GLU_FALSE = 0x0,
  GLU_TRUE = 0x1,

  /* Version */
  GLU_VERSION_1_1 = 0x1,
  GLU_VERSION_1_2 = 0x1,

  /* Quadric normals */
  GLU_FLAT = 0x186a1,
  GLU_NONE = 0x186a2,
  GLU_SMOOTH = 0x186a0,

  /* Quadric draw styles */
  GLU_FILL = 0x186ac,
  GLU_LINE = 0x186ab,
  GLU_POINT = 0x186aa,
  GLU_SILHOUETTE = 0x186ad,

  /* Quadric orientation */
  GLU_INSIDE = 0x186b5,
  GLU_OUTSIDE = 0x186b4,

  /* Errors */
  GLU_INCOMPATIBLE_GL_VERSION = 0x18a27,
  GLU_INVALID_ENUM = 0x18a24,
  GLU_INVALID_VALUE = 0x18a25,
  GLU_OUT_OF_MEMORY = 0x18a26,

  /* String names */
  GLU_EXTENSIONS = 0x189c1,
  GLU_VERSION = 0x189c0,

  /* Tessellation properties */
  GLU_TESS_BOUNDARY_ONLY = 0x1872d,
  GLU_TESS_TOLERANCE = 0x1872e,
  GLU_TESS_WINDING_RULE = 0x1872c,

  /* Tessellation winding */
  GLU_TESS_WINDING_ABS_GEQ_TWO = 0x18726,
  GLU_TESS_WINDING_NEGATIVE = 0x18725,
  GLU_TESS_WINDING_NONZERO = 0x18723,
  GLU_TESS_WINDING_ODD = 0x18722,
  GLU_TESS_WINDING_POSITIVE = 0x18724,

  /* Tessellation callbacks */
  GLU_TESS_BEGIN = 0x18704,
  GLU_TESS_BEGIN_DATA = 0x1870a,
  GLU_TESS_VERTEX = 0x18705,
  GLU_TESS_VERTEX_DATA = 0x1870b,
  GLU_TESS_END = 0x18706,
  GLU_TESS_END_DATA = 0x1870c,
  GLU_TESS_ERROR = 0x18707,
  GLU_TESS_ERROR_DATA = 0x1870d,
  GLU_TESS_EDGE_FLAG = 0x18708,
  GLU_TESS_EDGE_FLAG_DATA = 0x1870e,
  GLU_TESS_COMBINE = 0x18709,
  GLU_TESS_COMBINE_DATA = 0x1870f,

  /* Tessellation errors */
  GLU_TESS_ERROR1 = 0x18737,
  GLU_TESS_ERROR2 = 0x18738,
  GLU_TESS_ERROR3 = 0x18739,
  GLU_TESS_ERROR4 = 0x1873a,
  GLU_TESS_ERROR5 = 0x1873b,
  GLU_TESS_ERROR6 = 0x1873c,
  GLU_TESS_ERROR7 = 0x1873d,
  GLU_TESS_ERROR8 = 0x1873e,

  /* NURBS properties */
  GLU_AUTO_LOAD_MATRIX = 0x18768,
  GLU_CULLING = 0x18769,
  GLU_PARAMETRIC_TOLERANCE = 0x1876a,
  GLU_SAMPLING_TOLERANCE = 0x1876b,
  GLU_DISPLAY_MODE = 0x1876c,
  GLU_SAMPLING_METHOD = 0x1876d,
  GLU_U_STEP = 0x1876e,
  GLU_V_STEP = 0x1876f,

  /* NURBS sampling */
  GLU_PATH_LENGTH = 0x18777,
  GLU_PARAMETRIC_ERROR = 0x18778,
  GLU_DOMAIN_DISTANCE = 0x18779,

  /* NURBS trim */
  GLU_MAP1_TRIM_2 = 0x18772,
  GLU_MAP1_TRIM_3 = 0x18773,

  /* NURBS display */
  GLU_OUTLINE_POLYGON = 0x18790,
  GLU_OUTLINE_PATCH = 0x18791,

  /* NURBS errors */
  GLU_NURBS_ERROR1 = 0x1879b,
  GLU_NURBS_ERROR2 = 0x1879c,
  GLU_NURBS_ERROR3 = 0x1879d,
  GLU_NURBS_ERROR4 = 0x1879e,
  GLU_NURBS_ERROR5 = 0x1879f,
  GLU_NURBS_ERROR6 = 0x187a0,
  GLU_NURBS_ERROR7 = 0x187a1,
  GLU_NURBS_ERROR8 = 0x187a2,
  GLU_NURBS_ERROR9 = 0x187a3,
  GLU_NURBS_ERROR10 = 0x187a4,
  GLU_NURBS_ERROR11 = 0x187a5,
  GLU_NURBS_ERROR12 = 0x187a6,
  GLU_NURBS_ERROR13 = 0x187a7,
  GLU_NURBS_ERROR14 = 0x187a8,
  GLU_NURBS_ERROR15 = 0x187a9,
  GLU_NURBS_ERROR16 = 0x187aa,
  GLU_NURBS_ERROR17 = 0x187ab,
  GLU_NURBS_ERROR18 = 0x187ac,
  GLU_NURBS_ERROR19 = 0x187ad,
  GLU_NURBS_ERROR20 = 0x187ae,
  GLU_NURBS_ERROR21 = 0x187af,
  GLU_NURBS_ERROR22 = 0x187b0,
  GLU_NURBS_ERROR23 = 0x187b1,
  GLU_NURBS_ERROR24 = 0x187b2,
  GLU_NURBS_ERROR25 = 0x187b3,
  GLU_NURBS_ERROR26 = 0x187b4,
  GLU_NURBS_ERROR27 = 0x187b5,
  GLU_NURBS_ERROR28 = 0x187b6,
  GLU_NURBS_ERROR29 = 0x187b7,
  GLU_NURBS_ERROR30 = 0x187b8,
  GLU_NURBS_ERROR31 = 0x187b9,
  GLU_NURBS_ERROR32 = 0x187ba,
  GLU_NURBS_ERROR33 = 0x187bb,
  GLU_NURBS_ERROR34 = 0x187bc,
  GLU_NURBS_ERROR35 = 0x187bd,
  GLU_NURBS_ERROR36 = 0x187be,
  GLU_NURBS_ERROR37 = 0x187bf,

  /* Legacy contour types */
  GLU_CW = 0x18718,
  GLU_CCW = 0x18719,
  GLU_INTERIOR = 0x1871a,
  GLU_EXTERIOR = 0x1871b,
  GLU_UNKNOWN = 0x1871c,
}

/* Scalar types */
export type GLboolean = number;
export type GLdouble = number;
export type GLfloat = number;
export type GLint = number;
export type GLsizei = number;
export type GLubyte = number;
export type GLvoid = void;

/* Pointer-qualified variants */
export type GLWChar_ = Pointer;
export type GLdouble_ = Pointer;
export type GLfloat_ = Pointer;
export type GLint_ = Pointer;
export type GLvoid_ = Pointer;
export type GLubyte_ = Pointer;

/* GLU handles and callbacks */
export type GLUnurbs = Pointer;
export type GLUnurbsErrorProc = Pointer;
export type GLUquadric = Pointer;
export type GLUquadricErrorProc = Pointer;
export type GLUtesselator = Pointer;
export type GLUtessBeginDataProc = Pointer;
export type GLUtessBeginProc = Pointer;
export type GLUtessCallbackProc = Pointer;
export type GLUtessCombineDataProc = Pointer;
export type GLUtessCombineProc = Pointer;
export type GLUtessEdgeFlagDataProc = Pointer;
export type GLUtessEdgeFlagProc = Pointer;
export type GLUtessEndDataProc = Pointer;
export type GLUtessEndProc = Pointer;
export type GLUtessErrorDataProc = Pointer;
export type GLUtessErrorProc = Pointer;
export type GLUtessVertexDataProc = Pointer;
export type GLUtessVertexProc = Pointer;
