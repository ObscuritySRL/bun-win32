import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, INT, LPCSTR, NULL, UINT } from '@bun-win32/core';

export enum GLenum {
  /* AlphaFunction */
  GL_ALWAYS = 0x0207,
  GL_EQUAL = 0x0202,
  GL_GEQUAL = 0x0206,
  GL_GREATER = 0x0204,
  GL_LEQUAL = 0x0203,
  GL_LESS = 0x0201,
  GL_NEVER = 0x0200,
  GL_NOTEQUAL = 0x0205,

  /* BeginMode */
  GL_LINE_LOOP = 0x0002,
  GL_LINES = 0x0001,
  GL_LINE_STRIP = 0x0003,
  GL_POINTS = 0x0000,
  GL_QUAD_STRIP = 0x0008,
  GL_QUADS = 0x0007,
  GL_TRIANGLE_FAN = 0x0006,
  GL_TRIANGLES = 0x0004,
  GL_TRIANGLE_STRIP = 0x0005,

  /* BlendingFactorDest */
  GL_DST_ALPHA = 0x0304,
  GL_ONE = 1,
  GL_ONE_MINUS_DST_ALPHA = 0x0305,
  GL_ONE_MINUS_SRC_ALPHA = 0x0303,
  GL_ONE_MINUS_SRC_COLOR = 0x0301,
  GL_SRC_ALPHA = 0x0302,
  GL_SRC_COLOR = 0x0300,
  GL_ZERO = 0,

  /* BlendingFactorSrc */
  /*      GL_DST_ALPHA */
  GL_DST_COLOR = 0x0306,
  /*      GL_ONE */
  /*      GL_ONE_MINUS_DST_ALPHA */
  GL_ONE_MINUS_DST_COLOR = 0x0307,
  /*      GL_ONE_MINUS_SRC_ALPHA */
  /*      GL_SRC_ALPHA */
  GL_SRC_ALPHA_SATURATE = 0x0308,
  /*      GL_ZERO */

  /* Boolean */
  GL_FALSE = 0,
  GL_TRUE = 1,

  /* ClearBufferMask */
  GL_ACCUM_BUFFER_BIT = 0x00000200,
  GL_COLOR_BUFFER_BIT = 0x00004000,
  GL_DEPTH_BUFFER_BIT = 0x00000100,
  GL_STENCIL_BUFFER_BIT = 0x00000400,

  /* AttribMask */
  GL_CURRENT_BIT = 0x00000001,
  GL_POINT_BIT = 0x00000002,
  GL_LINE_BIT = 0x00000004,
  GL_POLYGON_BIT = 0x00000008,
  GL_POLYGON_STIPPLE_BIT = 0x00000010,
  GL_PIXEL_MODE_BIT = 0x00000020,
  GL_LIGHTING_BIT = 0x00000040,
  GL_FOG_BIT = 0x00000080,
  /*      GL_DEPTH_BUFFER_BIT */
  /*      GL_ACCUM_BUFFER_BIT */
  /*      GL_STENCIL_BUFFER_BIT */
  GL_VIEWPORT_BIT = 0x00000800,
  GL_TRANSFORM_BIT = 0x00001000,
  GL_ENABLE_BIT = 0x00002000,
  /*      GL_COLOR_BUFFER_BIT */
  GL_HINT_BIT = 0x00008000,
  GL_EVAL_BIT = 0x00010000,
  GL_LIST_BIT = 0x00020000,
  GL_TEXTURE_BIT = 0x00040000,
  GL_SCISSOR_BIT = 0x00080000,
  GL_ALL_ATTRIB_BITS = 0x000fffff,

  /* ColorMaterialFace */
  /*      GL_FRONT_AND_BACK */

  /* ColorMaterialParameter */
  /*      GL_AMBIENT_AND_DIFFUSE */

  /* ColorPointerType */
  /*      GL_FIXED */
  /*      GL_FLOAT */
  /*      GL_UNSIGNED_BYTE */

  /* CullFaceMode */
  GL_BACK = 0x0405,
  GL_FRONT = 0x0404,
  GL_FRONT_AND_BACK = 0x0408,

  /* DataType */
  GL_BYTE = 0x1400,
  GL_FIXED = 0x140c,
  GL_FLOAT = 0x1406,
  GL_SHORT = 0x1402,
  GL_UNSIGNED_BYTE = 0x1401,
  GL_UNSIGNED_SHORT = 0x1403,

  /* DepthFunction */
  /*      GL_ALWAYS */
  /*      GL_EQUAL */
  /*      GL_GEQUAL */
  /*      GL_GREATER */
  /*      GL_LEQUAL */
  /*      GL_LESS */
  /*      GL_NEVER */
  /*      GL_NOTEQUAL */

  /* DrawBufferMode */
  GL_NONE = 0x0000,
  GL_FRONT_LEFT = 0x0400,
  GL_FRONT_RIGHT = 0x0401,
  GL_BACK_LEFT = 0x0402,
  GL_BACK_RIGHT = 0x0403,
  GL_LEFT = 0x0406,
  GL_RIGHT = 0x0407,
  GL_AUX0 = 0x0409,
  GL_AUX1 = 0x040a,
  GL_AUX2 = 0x040b,
  GL_AUX3 = 0x040c,

  /* EnableCap */
  GL_ALPHA_TEST = 0x0bc0,
  GL_BLEND = 0x0be2,
  GL_COLOR_ARRAY = 0x8076,
  GL_COLOR_LOGIC_OP = 0x0bf2,
  GL_COLOR_MATERIAL = 0x0b57,
  GL_CULL_FACE = 0x0b44,
  GL_DEPTH_TEST = 0x0b71,
  GL_DITHER = 0x0bd0,
  GL_FOG = 0x0b60,
  /*      GL_LIGHT0 */
  /*      GL_LIGHT1 */
  /*      GL_LIGHT2 */
  /*      GL_LIGHT3 */
  /*      GL_LIGHT4 */
  /*      GL_LIGHT5 */
  /*      GL_LIGHT6 */
  /*      GL_LIGHT7 */
  GL_LIGHTING = 0x0b50,
  GL_LINE_SMOOTH = 0x0b20,
  GL_POLYGON_SMOOTH = 0x0b41,
  GL_MULTISAMPLE = 0x809d,
  GL_NORMAL_ARRAY = 0x8075,
  GL_NORMALIZE = 0x0ba1,
  GL_POINT_SMOOTH = 0x0b10,
  GL_POLYGON_OFFSET_FILL = 0x8037,
  GL_RESCALE_NORMAL = 0x803a,
  GL_SAMPLE_ALPHA_TO_COVERAGE = 0x809e,
  GL_SAMPLE_ALPHA_TO_ONE = 0x809f,
  GL_SAMPLE_COVERAGE = 0x80a0,
  GL_SCISSOR_TEST = 0x0c11,
  GL_STENCIL_TEST = 0x0b90,
  GL_TEXTURE_2D = 0x0de1,
  GL_TEXTURE_COORD_ARRAY = 0x8078,
  GL_VERTEX_ARRAY = 0x8074,

  /* ErrorCode */
  GL_INVALID_ENUM = 0x0500,
  GL_INVALID_OPERATION = 0x0502,
  GL_INVALID_VALUE = 0x0501,
  GL_NO_ERROR = 0,
  GL_OUT_OF_MEMORY = 0x0505,
  GL_STACK_OVERFLOW = 0x0503,
  GL_STACK_UNDERFLOW = 0x0504,

  /* FogMode */
  GL_EXP = 0x0800,
  GL_EXP2 = 0x0801,
  /*      GL_LINEAR */

  /* FogParameter */
  GL_FOG_COLOR = 0x0b66,
  GL_FOG_DENSITY = 0x0b62,
  GL_FOG_END = 0x0b64,
  GL_FOG_MODE = 0x0b65,
  GL_FOG_START = 0x0b63,

  /* FrontFaceDirection */
  GL_CCW = 0x0901,
  GL_CW = 0x0900,

  /* GetPName */
  GL_ALIASED_LINE_WIDTH_RANGE = 0x846e,
  GL_ALIASED_POINT_SIZE_RANGE = 0x846d,
  GL_ALPHA_BITS = 0x0d55,
  GL_BLUE_BITS = 0x0d54,
  GL_COMPRESSED_TEXTURE_FORMATS = 0x86a3,
  GL_DEPTH_BITS = 0x0d56,
  GL_GREEN_BITS = 0x0d53,
  GL_IMPLEMENTATION_COLOR_READ_FORMAT_OES = 0x8b9b,
  GL_IMPLEMENTATION_COLOR_READ_TYPE_OES = 0x8b9a,
  GL_LINE_WIDTH = 0x0b21,
  GL_MATRIX_MODE = 0x0ba0,
  GL_MAX_ELEMENTS_INDICES = 0x80e9,
  GL_MAX_ELEMENTS_VERTICES = 0x80e8,
  GL_MAX_LIGHTS = 0x0d31,
  GL_MAX_MODELVIEW_STACK_DEPTH = 0x0d36,
  GL_MAX_PROJECTION_STACK_DEPTH = 0x0d38,
  GL_MAX_TEXTURE_SIZE = 0x0d33,
  GL_MAX_TEXTURE_STACK_DEPTH = 0x0d39,
  GL_MAX_TEXTURE_UNITS = 0x84e2,
  GL_MAX_VIEWPORT_DIMS = 0x0d3a,
  GL_NUM_COMPRESSED_TEXTURE_FORMATS = 0x86a2,
  GL_RED_BITS = 0x0d52,
  GL_SMOOTH_LINE_WIDTH_RANGE = 0x0b22,
  GL_SMOOTH_POINT_SIZE_RANGE = 0x0b12,
  GL_STENCIL_BITS = 0x0d57,
  GL_SUBPIXEL_BITS = 0x0d50,
  GL_VIEWPORT = 0x0ba2,

  /* HintMode */
  GL_DONT_CARE = 0x1100,
  GL_FASTEST = 0x1101,
  GL_NICEST = 0x1102,

  /* HintTarget */
  GL_FOG_HINT = 0x0c54,
  GL_LINE_SMOOTH_HINT = 0x0c52,
  GL_PERSPECTIVE_CORRECTION_HINT = 0x0c50,
  GL_POINT_SMOOTH_HINT = 0x0c51,
  GL_POLYGON_SMOOTH_HINT = 0x0c53,

  /* LightModelParameter */
  GL_LIGHT_MODEL_AMBIENT = 0x0b53,
  GL_LIGHT_MODEL_TWO_SIDE = 0x0b52,

  /* LightName */
  GL_LIGHT0 = 0x4000,
  GL_LIGHT1 = 0x4001,
  GL_LIGHT2 = 0x4002,
  GL_LIGHT3 = 0x4003,
  GL_LIGHT4 = 0x4004,
  GL_LIGHT5 = 0x4005,
  GL_LIGHT6 = 0x4006,
  GL_LIGHT7 = 0x4007,

  /* LightParameter */
  GL_AMBIENT = 0x1200,
  GL_CONSTANT_ATTENUATION = 0x1207,
  GL_DIFFUSE = 0x1201,
  GL_LINEAR_ATTENUATION = 0x1208,
  GL_POSITION = 0x1203,
  GL_QUADRATIC_ATTENUATION = 0x1209,
  GL_SPECULAR = 0x1202,
  GL_SPOT_CUTOFF = 0x1206,
  GL_SPOT_DIRECTION = 0x1204,
  GL_SPOT_EXPONENT = 0x1205,

  /* LogicOp */
  GL_AND = 0x1501,
  GL_AND_INVERTED = 0x1504,
  GL_AND_REVERSE = 0x1502,
  GL_CLEAR = 0x1500,
  GL_COPY = 0x1503,
  GL_COPY_INVERTED = 0x150c,
  GL_EQUIV = 0x1509,
  GL_INVERT = 0x150a,
  GL_NAND = 0x150e,
  GL_NOOP = 0x1505,
  GL_NOR = 0x1508,
  GL_OR = 0x1507,
  GL_OR_INVERTED = 0x150d,
  GL_OR_REVERSE = 0x150b,
  GL_SET = 0x150f,
  GL_XOR = 0x1506,

  /* MaterialFace */
  /*      GL_FRONT_AND_BACK */

  /* MaterialParameter */
  /*      GL_AMBIENT */
  GL_AMBIENT_AND_DIFFUSE = 0x1602,
  /*      GL_DIFFUSE */
  GL_EMISSION = 0x1600,
  GL_SHININESS = 0x1601,
  /*      GL_SPECULAR */

  /* MatrixMode */
  GL_MODELVIEW = 0x1700,
  GL_PROJECTION = 0x1701,
  GL_TEXTURE = 0x1702,

  /* PolygonMode */
  GL_FILL = 0x1b02,
  GL_LINE = 0x1b01,
  GL_POINT = 0x1b00,

  /* NormalPointerType */
  /*      GL_BYTE */
  /*      GL_FIXED */
  /*      GL_FLOAT */
  /*      GL_SHORT */

  /* PixelFormat */
  GL_COLOR_INDEX = 0x1900,
  GL_ALPHA = 0x1906,
  GL_BLUE = 0x1905,
  GL_DEPTH_COMPONENT = 0x1902,
  GL_GREEN = 0x1904,
  GL_LUMINANCE = 0x1909,
  GL_LUMINANCE_ALPHA = 0x190a,
  GL_RED = 0x1903,
  GL_RGB = 0x1907,
  GL_RGBA = 0x1908,
  GL_STENCIL_INDEX = 0x1901,

  /* PixelInternalFormat */
  GL_PALETTE4_R5_G6_B5_OES = 0x8b92,
  GL_PALETTE4_RGB5_A1_OES = 0x8b94,
  GL_PALETTE4_RGB8_OES = 0x8b90,
  GL_PALETTE4_RGBA4_OES = 0x8b93,
  GL_PALETTE4_RGBA8_OES = 0x8b91,
  GL_PALETTE8_R5_G6_B5_OES = 0x8b97,
  GL_PALETTE8_RGB5_A1_OES = 0x8b99,
  GL_PALETTE8_RGB8_OES = 0x8b95,
  GL_PALETTE8_RGBA4_OES = 0x8b98,
  GL_PALETTE8_RGBA8_OES = 0x8b96,

  /* PixelStoreParameter */
  GL_PACK_ALIGNMENT = 0x0d05,
  GL_PACK_LSB_FIRST = 0x0d01,
  GL_PACK_ROW_LENGTH = 0x0d02,
  GL_PACK_SKIP_PIXELS = 0x0d04,
  GL_PACK_SKIP_ROWS = 0x0d03,
  GL_PACK_SWAP_BYTES = 0x0d00,
  GL_UNPACK_ALIGNMENT = 0x0cf5,
  GL_UNPACK_LSB_FIRST = 0x0cf1,
  GL_UNPACK_ROW_LENGTH = 0x0cf2,
  GL_UNPACK_SKIP_PIXELS = 0x0cf4,
  GL_UNPACK_SKIP_ROWS = 0x0cf3,
  GL_UNPACK_SWAP_BYTES = 0x0cf0,

  /* PixelType */
  /*      GL_UNSIGNED_BYTE */
  GL_UNSIGNED_SHORT_4_4_4_4 = 0x8033,
  GL_UNSIGNED_SHORT_5_5_5_1 = 0x8034,
  GL_UNSIGNED_SHORT_5_6_5 = 0x8363,

  /* ShadingModel */
  GL_FLAT = 0x1d00,
  GL_SMOOTH = 0x1d01,

  /* StencilFunction */
  /*      GL_ALWAYS */
  /*      GL_EQUAL */
  /*      GL_GEQUAL */
  /*      GL_GREATER */
  /*      GL_LEQUAL */
  /*      GL_LESS */
  /*      GL_NEVER */
  /*      GL_NOTEQUAL */

  /* StencilOp */
  GL_DECR = 0x1e03,
  GL_INCR = 0x1e02,
  /*      GL_INVERT */
  GL_KEEP = 0x1e00,
  GL_REPLACE = 0x1e01,
  /*      GL_ZERO */

  /* StringName */
  GL_EXTENSIONS = 0x1f03,
  GL_RENDERER = 0x1f01,
  GL_VENDOR = 0x1f00,
  GL_VERSION = 0x1f02,

  /* TexCoordPointerType */
  /*      GL_BYTE */
  /*      GL_FIXED */
  /*      GL_FLOAT */
  /*      GL_SHORT */

  /* TexGenCoord */
  GL_S = 0x2000,
  GL_T = 0x2001,
  GL_R = 0x2002,
  GL_Q = 0x2003,

  /* TexGenParameter */
  GL_EYE_LINEAR = 0x2400,
  GL_EYE_PLANE = 0x2502,
  GL_OBJECT_LINEAR = 0x2401,
  GL_OBJECT_PLANE = 0x2501,
  GL_SPHERE_MAP = 0x2402,
  GL_TEXTURE_GEN_MODE = 0x2500,

  /* TextureEnvMode */
  GL_ADD = 0x0104,
  /*      GL_BLEND */
  GL_DECAL = 0x2101,
  GL_MODULATE = 0x2100,
  /*      GL_REPLACE */

  /* TextureEnvParameter */
  GL_TEXTURE_ENV_COLOR = 0x2201,
  GL_TEXTURE_ENV_MODE = 0x2200,

  /* TextureEnvTarget */
  GL_TEXTURE_ENV = 0x2300,

  /* TextureMagFilter */
  GL_LINEAR = 0x2601,
  GL_NEAREST = 0x2600,

  /* TextureMinFilter */
  /*      GL_LINEAR */
  GL_LINEAR_MIPMAP_LINEAR = 0x2703,
  GL_LINEAR_MIPMAP_NEAREST = 0x2701,
  /*      GL_NEAREST */
  GL_NEAREST_MIPMAP_LINEAR = 0x2702,
  GL_NEAREST_MIPMAP_NEAREST = 0x2700,

  /* TextureParameterName */
  GL_TEXTURE_BORDER_COLOR = 0x1004,
  GL_TEXTURE_MAG_FILTER = 0x2800,
  GL_TEXTURE_MIN_FILTER = 0x2801,
  GL_TEXTURE_WRAP_S = 0x2802,
  GL_TEXTURE_WRAP_T = 0x2803,
  GL_TEXTURE_PRIORITY = 0x8066,
  GL_TEXTURE_RESIDENT = 0x8067,

  /* TextureTarget */
  /*      GL_TEXTURE_2D */

  /* TextureUnit */
  GL_TEXTURE0 = 0x84c0,
  GL_TEXTURE1 = 0x84c1,
  GL_TEXTURE10 = 0x84ca,
  GL_TEXTURE11 = 0x84cb,
  GL_TEXTURE12 = 0x84cc,
  GL_TEXTURE13 = 0x84cd,
  GL_TEXTURE14 = 0x84ce,
  GL_TEXTURE15 = 0x84cf,
  GL_TEXTURE16 = 0x84d0,
  GL_TEXTURE17 = 0x84d1,
  GL_TEXTURE18 = 0x84d2,
  GL_TEXTURE19 = 0x84d3,
  GL_TEXTURE2 = 0x84c2,
  GL_TEXTURE20 = 0x84d4,
  GL_TEXTURE21 = 0x84d5,
  GL_TEXTURE22 = 0x84d6,
  GL_TEXTURE23 = 0x84d7,
  GL_TEXTURE24 = 0x84d8,
  GL_TEXTURE25 = 0x84d9,
  GL_TEXTURE26 = 0x84da,
  GL_TEXTURE27 = 0x84db,
  GL_TEXTURE28 = 0x84dc,
  GL_TEXTURE29 = 0x84dd,
  GL_TEXTURE3 = 0x84c3,
  GL_TEXTURE30 = 0x84de,
  GL_TEXTURE31 = 0x84df,
  GL_TEXTURE4 = 0x84c4,
  GL_TEXTURE5 = 0x84c5,
  GL_TEXTURE6 = 0x84c6,
  GL_TEXTURE7 = 0x84c7,
  GL_TEXTURE8 = 0x84c8,
  GL_TEXTURE9 = 0x84c9,

  /* TextureWrapMode */
  GL_CLAMP = 0x2900,
  GL_CLAMP_TO_EDGE = 0x812f,
  GL_REPEAT = 0x2901,

  /* VertexPointerType */
  /*      GL_BYTE */
  /*      GL_FIXED */
  /*      GL_FLOAT */
  /*      GL_SHORT */

  /* ClipPlaneName */
  GL_CLIP_PLANE0 = 0x3000,
  GL_CLIP_PLANE1 = 0x3001,
  GL_CLIP_PLANE2 = 0x3002,
  GL_CLIP_PLANE3 = 0x3003,
  GL_CLIP_PLANE4 = 0x3004,
  GL_CLIP_PLANE5 = 0x3005,

  /* GetMapTarget */
  GL_COEFF = 0x0a00,
  GL_ORDER = 0x0a01,
  GL_DOMAIN = 0x0a02,

  /* GetPointervPName */
  GL_VERTEX_ARRAY_POINTER = 0x808e,
  GL_NORMAL_ARRAY_POINTER = 0x808f,
  GL_COLOR_ARRAY_POINTER = 0x8090,
  GL_TEXTURE_COORD_ARRAY_POINTER = 0x8092,

  /* RenderMode */
  GL_RENDER = 0x1c00,
  GL_FEEDBACK = 0x1c01,
  GL_SELECT = 0x1c02,

  /* TexLevelParameter */
  GL_TEXTURE_WIDTH = 0x1000,
  GL_TEXTURE_HEIGHT = 0x1001,
  GL_TEXTURE_COMPONENTS = 0x1003,
  GL_TEXTURE_BORDER = 0x1005,

  /* PixelTransferParameter */
  GL_ALPHA_BIAS = 0x0d1d,
  GL_ALPHA_SCALE = 0x0d1c,
  GL_BLUE_BIAS = 0x0d1b,
  GL_BLUE_SCALE = 0x0d1a,
  GL_DEPTH_BIAS = 0x0d1f,
  GL_DEPTH_SCALE = 0x0d1e,
  GL_GREEN_BIAS = 0x0d19,
  GL_GREEN_SCALE = 0x0d18,
  GL_INDEX_OFFSET = 0x0d13,
  GL_INDEX_SHIFT = 0x0d12,
  GL_MAP_COLOR = 0x0d10,
  GL_MAP_STENCIL = 0x0d11,
  GL_RED_BIAS = 0x0d15,
  GL_RED_SCALE = 0x0d14,

  /* FeedbackType */
  GL_2D = 0x0600,
  GL_3D = 0x0601,
  GL_3D_COLOR = 0x0602,
  GL_3D_COLOR_TEXTURE = 0x0603,
  GL_4D_COLOR_TEXTURE = 0x0604,

  /* ClientAttribMask */
  GL_CLIENT_PIXEL_STORE_BIT = 0x00000001,
  GL_CLIENT_VERTEX_ARRAY_BIT = 0x00000002,
  GL_CLIENT_ALL_ATTRIB_BITS = 0xffffffff,
}

export type GLbitfield = number;
export type GLboolean = (typeof GLenum)['GL_FALSE' | 'GL_TRUE'];
export type GLbyte = number;
export type GLclampd = number;
export type GLclampf = number;
export type GLdouble = number;
export type GLfloat = number;
export type GLint = number;
export type GLshort = number;
export type GLsizei = number;
export type GLubyte = number;
export type GLuint = number;
export type GLushort = number;

// Extension types (OpenGL 1.5+/2.0+)
export type GLchar = number;
export type GLsizeiptr = number | bigint;
export type GLintptr = number | bigint;

// Pointer variants for common GL types
export type GLboolean_ = Pointer;
export type GLbyte_ = Pointer;
export type GLchar_ = Pointer;
export type GLclampd_ = Pointer;
export type GLsizei_ = Pointer;
export type GLclampf_ = Pointer;
export type GLdouble_ = Pointer;
export type GLenum_ = Pointer;
export type GLfloat_ = Pointer;
export type GLint_ = Pointer;
export type GLshort_ = Pointer;
export type GLubyte_ = Pointer;
export type GLuint_ = Pointer;
export type GLushort_ = Pointer;
export type GLvoid_ = Pointer;

// Windows/WGL related types (aliases for clarity in bindings)
export type HDC = bigint;
export type HGLRC = bigint;
export type LPPIXELFORMATDESCRIPTOR = Pointer;
export type LPLAYERPLANEDESCRIPTOR = Pointer;
export type LPGLYPHMETRICSFLOAT = Pointer;
export type LPWGLSWAP = Pointer;
export type PROC = Pointer;
