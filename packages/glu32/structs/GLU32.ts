import { type FFIFunction, FFIType } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  GLUquadric,
  GLUquadricErrorProc,
  GLUnurbs,
  GLUnurbsErrorProc,
  GLUtessCallbackProc,
  GLUtesselator,
  GLboolean,
  GLdouble,
  GLdouble_,
  GLenum,
  GLfloat,
  GLfloat_,
  GLint,
  GLint_,
  GLubyte_,
  GLvoid_,
  GLWChar_,
  NULL,
} from '../types/GLU32';

/**
 * Thin, lazy-loaded FFI bindings for `glu32.dll`.
 *
 * Each static method maps directly to a Win32 export described in `Symbols`.
 * Callers normally rely on the lazy getters; those use `Load` to bind the native
 * function via `bun:ffi` and memoize it on the class. `Preload` binds an entire
 * subset (or all) of the exports up front.
 *
 * Symbols are declared alphabetically, typed with `FFIType`, and consumed by
 * `Load`/`Preload` so you can treat each static helper as a drop-in Win32 call.
 *
 * @example
 * ```ts
 * import GLU32 from './structs/GLU32';
 *
 * const quadric = GLU32.gluNewQuadric();
 * GLU32.Preload(['gluSphere', 'gluDisk']);
 * ```
 */
class GLU32 extends Win32 {
  protected static override name = 'glu32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    gluBeginCurve: { args: [FFIType.ptr], returns: FFIType.void },
    gluBeginPolygon: { args: [FFIType.ptr], returns: FFIType.void },
    gluBeginSurface: { args: [FFIType.ptr], returns: FFIType.void },
    gluBeginTrim: { args: [FFIType.ptr], returns: FFIType.void },
    gluBuild1DMipmaps: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    gluBuild2DMipmaps: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    gluCylinder: { args: [FFIType.ptr, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.i32, FFIType.i32], returns: FFIType.void },
    gluDeleteNurbsRenderer: { args: [FFIType.ptr], returns: FFIType.void },
    gluDeleteQuadric: { args: [FFIType.ptr], returns: FFIType.void },
    gluDeleteTess: { args: [FFIType.ptr], returns: FFIType.void },
    gluDisk: { args: [FFIType.ptr, FFIType.f64, FFIType.f64, FFIType.i32, FFIType.i32], returns: FFIType.void },
    gluEndCurve: { args: [FFIType.ptr], returns: FFIType.void },
    gluEndPolygon: { args: [FFIType.ptr], returns: FFIType.void },
    gluEndSurface: { args: [FFIType.ptr], returns: FFIType.void },
    gluEndTrim: { args: [FFIType.ptr], returns: FFIType.void },
    gluErrorString: { args: [FFIType.u32], returns: FFIType.ptr },
    gluErrorUnicodeStringEXT: { args: [FFIType.u32], returns: FFIType.ptr },
    gluGetNurbsProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    gluGetString: { args: [FFIType.u32], returns: FFIType.ptr },
    gluGetTessProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    gluLoadSamplingMatrices: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    gluLookAt: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    gluNewNurbsRenderer: { args: [], returns: FFIType.ptr },
    gluNewQuadric: { args: [], returns: FFIType.ptr },
    gluNewTess: { args: [], returns: FFIType.ptr },
    gluNextContour: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    gluNurbsCallback: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    gluNurbsCurve: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.void },
    gluNurbsProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.f32], returns: FFIType.void },
    gluNurbsSurface: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.void },
    gluOrtho2D: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    gluPartialDisk: { args: [FFIType.ptr, FFIType.f64, FFIType.f64, FFIType.i32, FFIType.i32, FFIType.f64, FFIType.f64], returns: FFIType.void },
    gluPerspective: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    gluPickMatrix: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.ptr], returns: FFIType.void },
    gluProject: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    gluPwlCurve: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.void },
    gluQuadricCallback: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    gluQuadricDrawStyle: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    gluQuadricNormals: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    gluQuadricOrientation: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    gluQuadricTexture: { args: [FFIType.ptr, FFIType.u8], returns: FFIType.void },
    gluScaleImage: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    gluSphere: { args: [FFIType.ptr, FFIType.f64, FFIType.i32, FFIType.i32], returns: FFIType.void },
    gluTessBeginContour: { args: [FFIType.ptr], returns: FFIType.void },
    gluTessBeginPolygon: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    gluTessCallback: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    gluTessEndContour: { args: [FFIType.ptr], returns: FFIType.void },
    gluTessEndPolygon: { args: [FFIType.ptr], returns: FFIType.void },
    gluTessNormal: { args: [FFIType.ptr, FFIType.f64, FFIType.f64, FFIType.f64], returns: FFIType.void },
    gluTessProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.f64], returns: FFIType.void },
    gluTessVertex: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    gluUnProject: { args: [FFIType.f64, FFIType.f64, FFIType.f64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glubegincurve
  public static gluBeginCurve(nobj: GLUnurbs): void {
    return GLU32.Load('gluBeginCurve')(nobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glubeginpolygon
  public static gluBeginPolygon(tess: GLUtesselator): void {
    return GLU32.Load('gluBeginPolygon')(tess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glubeginsurface
  public static gluBeginSurface(nobj: GLUnurbs): void {
    return GLU32.Load('gluBeginSurface')(nobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glubegintrim
  public static gluBeginTrim(nobj: GLUnurbs): void {
    return GLU32.Load('gluBeginTrim')(nobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glubuild1dmipmaps
  public static gluBuild1DMipmaps(target: GLenum, components: GLint, width: GLint, format: GLenum, type: GLenum, data: GLvoid_): GLint {
    return GLU32.Load('gluBuild1DMipmaps')(target, components, width, format, type, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glubuild2dmipmaps
  public static gluBuild2DMipmaps(target: GLenum, components: GLint, width: GLint, height: GLint, format: GLenum, type: GLenum, data: GLvoid_): GLint {
    return GLU32.Load('gluBuild2DMipmaps')(target, components, width, height, format, type, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glucylinder
  public static gluCylinder(qobj: GLUquadric, baseRadius: GLdouble, topRadius: GLdouble, height: GLdouble, slices: GLint, stacks: GLint): void {
    return GLU32.Load('gluCylinder')(qobj, baseRadius, topRadius, height, slices, stacks);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gludeletenurbsrenderer
  public static gluDeleteNurbsRenderer(nobj: GLUnurbs): void {
    return GLU32.Load('gluDeleteNurbsRenderer')(nobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gludeletequadric
  public static gluDeleteQuadric(state: GLUquadric): void {
    return GLU32.Load('gluDeleteQuadric')(state);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gludeletetess
  public static gluDeleteTess(tess: GLUtesselator): void {
    return GLU32.Load('gluDeleteTess')(tess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gludisk
  public static gluDisk(qobj: GLUquadric, innerRadius: GLdouble, outerRadius: GLdouble, slices: GLint, loops: GLint): void {
    return GLU32.Load('gluDisk')(qobj, innerRadius, outerRadius, slices, loops);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluendcurve
  public static gluEndCurve(nobj: GLUnurbs): void {
    return GLU32.Load('gluEndCurve')(nobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluendpolygon
  public static gluEndPolygon(tess: GLUtesselator): void {
    return GLU32.Load('gluEndPolygon')(tess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluendsurface
  public static gluEndSurface(nobj: GLUnurbs): void {
    return GLU32.Load('gluEndSurface')(nobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluendtrim
  public static gluEndTrim(nobj: GLUnurbs): void {
    return GLU32.Load('gluEndTrim')(nobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluerrorstring
  public static gluErrorString(errCode: GLenum): GLubyte_ {
    return GLU32.Load('gluErrorString')(errCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluerrorunicodestringext
  public static gluErrorUnicodeStringEXT(errCode: GLenum): GLWChar_ {
    return GLU32.Load('gluErrorUnicodeStringEXT')(errCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glugetnurbsproperty
  public static gluGetNurbsProperty(nobj: GLUnurbs, property: GLenum, value: GLfloat_): void {
    return GLU32.Load('gluGetNurbsProperty')(nobj, property, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glugetstring
  public static gluGetString(name: GLenum): GLubyte_ {
    return GLU32.Load('gluGetString')(name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glugettessproperty
  public static gluGetTessProperty(tess: GLUtesselator, which: GLenum, value: GLdouble_): void {
    return GLU32.Load('gluGetTessProperty')(tess, which, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluloadsamplingmatrices
  public static gluLoadSamplingMatrices(nobj: GLUnurbs, modelMatrix: GLfloat_, projMatrix: GLfloat_, viewport: GLint_): void {
    return GLU32.Load('gluLoadSamplingMatrices')(nobj, modelMatrix, projMatrix, viewport);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glulookat
  public static gluLookAt(eyex: GLdouble, eyey: GLdouble, eyez: GLdouble, centerx: GLdouble, centery: GLdouble, centerz: GLdouble, upx: GLdouble, upy: GLdouble, upz: GLdouble): void {
    return GLU32.Load('gluLookAt')(eyex, eyey, eyez, centerx, centery, centerz, upx, upy, upz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glunewnurbsrenderer
  public static gluNewNurbsRenderer(): GLUnurbs {
    return GLU32.Load('gluNewNurbsRenderer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glunewquadric
  public static gluNewQuadric(): GLUquadric {
    return GLU32.Load('gluNewQuadric')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glunewtess
  public static gluNewTess(): GLUtesselator {
    return GLU32.Load('gluNewTess')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glunextcontour
  public static gluNextContour(tess: GLUtesselator, type: GLenum): void {
    return GLU32.Load('gluNextContour')(tess, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glunurbscallback
  public static gluNurbsCallback(nobj: GLUnurbs, which: GLenum, fn: GLUnurbsErrorProc | NULL): void {
    return GLU32.Load('gluNurbsCallback')(nobj, which, fn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glunurbscurve
  public static gluNurbsCurve(nobj: GLUnurbs, nknots: GLint, knot: GLfloat_, stride: GLint, ctlarray: GLfloat_, order: GLint, type: GLenum): void {
    return GLU32.Load('gluNurbsCurve')(nobj, nknots, knot, stride, ctlarray, order, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glunurbsproperty
  public static gluNurbsProperty(nobj: GLUnurbs, property: GLenum, value: GLfloat): void {
    return GLU32.Load('gluNurbsProperty')(nobj, property, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glunurbssurface
  public static gluNurbsSurface(nobj: GLUnurbs, sknot_count: GLint, sknot: GLfloat_, tknot_count: GLint, tknot: GLfloat_, s_stride: GLint, t_stride: GLint, ctlarray: GLfloat_, sorder: GLint, torder: GLint, type: GLenum): void {
    return GLU32.Load('gluNurbsSurface')(nobj, sknot_count, sknot, tknot_count, tknot, s_stride, t_stride, ctlarray, sorder, torder, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluortho2d
  public static gluOrtho2D(left: GLdouble, right: GLdouble, bottom: GLdouble, top: GLdouble): void {
    return GLU32.Load('gluOrtho2D')(left, right, bottom, top);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glupartialdisk
  public static gluPartialDisk(qobj: GLUquadric, innerRadius: GLdouble, outerRadius: GLdouble, slices: GLint, loops: GLint, startAngle: GLdouble, sweepAngle: GLdouble): void {
    return GLU32.Load('gluPartialDisk')(qobj, innerRadius, outerRadius, slices, loops, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluperspective
  public static gluPerspective(fovy: GLdouble, aspect: GLdouble, zNear: GLdouble, zFar: GLdouble): void {
    return GLU32.Load('gluPerspective')(fovy, aspect, zNear, zFar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glupickmatrix
  public static gluPickMatrix(x: GLdouble, y: GLdouble, width: GLdouble, height: GLdouble, viewport: GLint_): void {
    return GLU32.Load('gluPickMatrix')(x, y, width, height, viewport);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluproject
  public static gluProject(objx: GLdouble, objy: GLdouble, objz: GLdouble, modelMatrix: GLdouble_, projMatrix: GLdouble_, viewport: GLint_, winx: GLdouble_, winy: GLdouble_, winz: GLdouble_): GLint {
    return GLU32.Load('gluProject')(objx, objy, objz, modelMatrix, projMatrix, viewport, winx, winy, winz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glupwlcurve
  public static gluPwlCurve(nobj: GLUnurbs, count: GLint, array: GLfloat_, stride: GLint, type: GLenum): void {
    return GLU32.Load('gluPwlCurve')(nobj, count, array, stride, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluquadriccallback
  public static gluQuadricCallback(qobj: GLUquadric, which: GLenum, fn: GLUquadricErrorProc | NULL): void {
    return GLU32.Load('gluQuadricCallback')(qobj, which, fn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluquadricdrawstyle
  public static gluQuadricDrawStyle(qobj: GLUquadric, drawStyle: GLenum): void {
    return GLU32.Load('gluQuadricDrawStyle')(qobj, drawStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluquadricnormals
  public static gluQuadricNormals(qobj: GLUquadric, normals: GLenum): void {
    return GLU32.Load('gluQuadricNormals')(qobj, normals);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluquadricorientation
  public static gluQuadricOrientation(qobj: GLUquadric, orientation: GLenum): void {
    return GLU32.Load('gluQuadricOrientation')(qobj, orientation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluquadrictexture
  public static gluQuadricTexture(qobj: GLUquadric, textureCoords: GLboolean): void {
    return GLU32.Load('gluQuadricTexture')(qobj, textureCoords);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluscaleimage
  public static gluScaleImage(format: GLenum, widthin: GLint, heightin: GLint, typein: GLenum, datain: GLvoid_, widthout: GLint, heightout: GLint, typeout: GLenum, dataout: GLvoid_): GLint {
    return GLU32.Load('gluScaleImage')(format, widthin, heightin, typein, datain, widthout, heightout, typeout, dataout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glusphere
  public static gluSphere(qobj: GLUquadric, radius: GLdouble, slices: GLint, stacks: GLint): void {
    return GLU32.Load('gluSphere')(qobj, radius, slices, stacks);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glutessbegincontour
  public static gluTessBeginContour(tess: GLUtesselator): void {
    return GLU32.Load('gluTessBeginContour')(tess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glutessbeginpolygon
  public static gluTessBeginPolygon(tess: GLUtesselator, polygon_data: GLvoid_ | NULL): void {
    return GLU32.Load('gluTessBeginPolygon')(tess, polygon_data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glutesscallback
  public static gluTessCallback(tess: GLUtesselator, which: GLenum, fn: GLUtessCallbackProc | NULL): void {
    return GLU32.Load('gluTessCallback')(tess, which, fn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glutessendcontour
  public static gluTessEndContour(tess: GLUtesselator): void {
    return GLU32.Load('gluTessEndContour')(tess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glutessendpolygon
  public static gluTessEndPolygon(tess: GLUtesselator): void {
    return GLU32.Load('gluTessEndPolygon')(tess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glutessnormal
  public static gluTessNormal(tess: GLUtesselator, x: GLdouble, y: GLdouble, z: GLdouble): void {
    return GLU32.Load('gluTessNormal')(tess, x, y, z);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glutessproperty
  public static gluTessProperty(tess: GLUtesselator, which: GLenum, value: GLdouble): void {
    return GLU32.Load('gluTessProperty')(tess, which, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/glutessvertex
  public static gluTessVertex(tess: GLUtesselator, coords: GLdouble_, data: GLvoid_): void {
    return GLU32.Load('gluTessVertex')(tess, coords, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/opengl/gluunproject
  public static gluUnProject(winx: GLdouble, winy: GLdouble, winz: GLdouble, modelMatrix: GLdouble_, projMatrix: GLdouble_, viewport: GLint_, objx: GLdouble_, objy: GLdouble_, objz: GLdouble_): GLint {
    return GLU32.Load('gluUnProject')(winx, winy, winz, modelMatrix, projMatrix, viewport, objx, objy, objz);
  }
}

export default GLU32;
