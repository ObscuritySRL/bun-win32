import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  FLOAT,
  HRESULT,
  IDXGIDevice,
  IDXGISurface,
  LPLPVOID,
  OPTIONAL,
  PACKED_D2D1_POINT_2F,
  PD2D1_COLOR_F,
  PD2D1_CREATION_PROPERTIES,
  PD2D1_FACTORY_OPTIONS,
  PD2D1_MATRIX_3X2_F,
  PD2D1_POINT_2F,
  PFLOAT,
  PID2D1Device,
  PID2D1DeviceContext,
  REFIID,
} from '../types/D2D1';
import type { D2D1_COLOR_SPACE, D2D1_FACTORY_TYPE } from '../types/D2D1';

/**
 * Thin, lazy-loaded FFI bindings for `d2d1.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * `d2d1.dll` exposes only thirteen flat C exports; the rest of Direct2D is reached
 * through the COM vtable of the `ID2D1Factory` obtained from `D2D1CreateFactory`.
 *
 * @example
 * ```ts
 * import D2D1, { D2D1_FACTORY_TYPE } from './structs/D2D1';
 *
 * // Lazy: bind on first call
 * const iid = Buffer.alloc(16);
 * const ppFactory = Buffer.alloc(8);
 * const hr = D2D1.D2D1CreateFactory(D2D1_FACTORY_TYPE.D2D1_FACTORY_TYPE_SINGLE_THREADED, iid.ptr, null, ppFactory.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * D2D1.Preload(['D2D1CreateFactory', 'D2D1MakeRotateMatrix']);
 * ```
 */
class D2D1 extends Win32 {
  protected static override name = 'd2d1.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    D2D1ComputeMaximumScaleFactor: { args: [FFIType.ptr], returns: FFIType.f32 },
    D2D1ConvertColorSpace: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    D2D1CreateDevice: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D2D1CreateDeviceContext: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D2D1CreateFactory: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D2D1GetGradientMeshInteriorPointsFromCoonsPatch: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.void,
    },
    D2D1InvertMatrix: { args: [FFIType.ptr], returns: FFIType.i32 },
    D2D1IsMatrixInvertible: { args: [FFIType.ptr], returns: FFIType.i32 },
    D2D1MakeRotateMatrix: { args: [FFIType.f32, FFIType.u64, FFIType.ptr], returns: FFIType.void },
    D2D1MakeSkewMatrix: { args: [FFIType.f32, FFIType.f32, FFIType.u64, FFIType.ptr], returns: FFIType.void },
    D2D1SinCos: { args: [FFIType.f32, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    D2D1Tan: { args: [FFIType.f32], returns: FFIType.f32 },
    D2D1Vec3Length: { args: [FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.f32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1_2/nf-d2d1_2-d2d1computemaximumscalefactor
  public static D2D1ComputeMaximumScaleFactor(matrix: PD2D1_MATRIX_3X2_F): FLOAT {
    return D2D1.Load('D2D1ComputeMaximumScaleFactor')(matrix);
  }

  // The x64 ABI returns the 16-byte D2D1_COLOR_F by hidden pointer: the caller allocates the
  // result buffer and passes it as an implicit leading argument; the same pointer is returned.
  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1_1/nf-d2d1_1-d2d1convertcolorspace
  public static D2D1ConvertColorSpace(convertedColor_out: PD2D1_COLOR_F, sourceColorSpace: D2D1_COLOR_SPACE, destinationColorSpace: D2D1_COLOR_SPACE, color: PD2D1_COLOR_F): PD2D1_COLOR_F {
    return D2D1.Load('D2D1ConvertColorSpace')(convertedColor_out, sourceColorSpace, destinationColorSpace, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1_1/nf-d2d1_1-d2d1createdevice
  public static D2D1CreateDevice(dxgiDevice: IDXGIDevice, creationProperties: OPTIONAL<PD2D1_CREATION_PROPERTIES>, d2dDevice_out: PID2D1Device): HRESULT {
    return D2D1.Load('D2D1CreateDevice')(dxgiDevice, creationProperties, d2dDevice_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1_1/nf-d2d1_1-d2d1createdevicecontext
  public static D2D1CreateDeviceContext(dxgiSurface: IDXGISurface, creationProperties: OPTIONAL<PD2D1_CREATION_PROPERTIES>, d2dDeviceContext_out: PID2D1DeviceContext): HRESULT {
    return D2D1.Load('D2D1CreateDeviceContext')(dxgiSurface, creationProperties, d2dDeviceContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1/nf-d2d1-d2d1createfactory
  public static D2D1CreateFactory(factoryType: D2D1_FACTORY_TYPE, riid: REFIID, pFactoryOptions: OPTIONAL<PD2D1_FACTORY_OPTIONS>, ppIFactory_out: LPLPVOID): HRESULT {
    return D2D1.Load('D2D1CreateFactory')(factoryType, riid, pFactoryOptions, ppIFactory_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1_3/nf-d2d1_3-d2d1getgradientmeshinteriorpointsfromcoonspatch
  public static D2D1GetGradientMeshInteriorPointsFromCoonsPatch(
    pPoint0: PD2D1_POINT_2F,
    pPoint1: PD2D1_POINT_2F,
    pPoint2: PD2D1_POINT_2F,
    pPoint3: PD2D1_POINT_2F,
    pPoint4: PD2D1_POINT_2F,
    pPoint5: PD2D1_POINT_2F,
    pPoint6: PD2D1_POINT_2F,
    pPoint7: PD2D1_POINT_2F,
    pPoint8: PD2D1_POINT_2F,
    pPoint9: PD2D1_POINT_2F,
    pPoint10: PD2D1_POINT_2F,
    pPoint11: PD2D1_POINT_2F,
    pTensorPoint11_out: PD2D1_POINT_2F,
    pTensorPoint12_out: PD2D1_POINT_2F,
    pTensorPoint21_out: PD2D1_POINT_2F,
    pTensorPoint22_out: PD2D1_POINT_2F,
  ): void {
    return D2D1.Load('D2D1GetGradientMeshInteriorPointsFromCoonsPatch')(
      pPoint0,
      pPoint1,
      pPoint2,
      pPoint3,
      pPoint4,
      pPoint5,
      pPoint6,
      pPoint7,
      pPoint8,
      pPoint9,
      pPoint10,
      pPoint11,
      pTensorPoint11_out,
      pTensorPoint12_out,
      pTensorPoint21_out,
      pTensorPoint22_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1/nf-d2d1-d2d1invertmatrix
  public static D2D1InvertMatrix(matrix_in_out: PD2D1_MATRIX_3X2_F): BOOL {
    return D2D1.Load('D2D1InvertMatrix')(matrix_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1/nf-d2d1-d2d1ismatrixinvertible
  public static D2D1IsMatrixInvertible(matrix: PD2D1_MATRIX_3X2_F): BOOL {
    return D2D1.Load('D2D1IsMatrixInvertible')(matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1/nf-d2d1-d2d1makerotatematrix
  public static D2D1MakeRotateMatrix(angle: FLOAT, center: PACKED_D2D1_POINT_2F, matrix_out: PD2D1_MATRIX_3X2_F): void {
    return D2D1.Load('D2D1MakeRotateMatrix')(angle, center, matrix_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1/nf-d2d1-d2d1makeskewmatrix
  public static D2D1MakeSkewMatrix(angleX: FLOAT, angleY: FLOAT, center: PACKED_D2D1_POINT_2F, matrix_out: PD2D1_MATRIX_3X2_F): void {
    return D2D1.Load('D2D1MakeSkewMatrix')(angleX, angleY, center, matrix_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1_1/nf-d2d1_1-d2d1sincos
  public static D2D1SinCos(angle: FLOAT, s_out: PFLOAT, c_out: PFLOAT): void {
    return D2D1.Load('D2D1SinCos')(angle, s_out, c_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1_1/nf-d2d1_1-d2d1tan
  public static D2D1Tan(angle: FLOAT): FLOAT {
    return D2D1.Load('D2D1Tan')(angle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d2d1_1/nf-d2d1_1-d2d1vec3length
  public static D2D1Vec3Length(x: FLOAT, y: FLOAT, z: FLOAT): FLOAT {
    return D2D1.Load('D2D1Vec3Length')(x, y, z);
  }
}

export default D2D1;
