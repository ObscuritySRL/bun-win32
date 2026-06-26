import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  HMODULE,
  HRESULT,
  IDXGIAdapter,
  IDXGIDevice,
  IDXGISurface,
  IUnknown,
  Nullable,
  Optional,
  PD3D_FEATURE_LEVEL,
  PDXGI_SWAP_CHAIN_DESC,
  PID3D11Device,
  PID3D11DeviceContext,
  PIDXGISwapChain,
  PIInspectable,
  PIUnknown,
  UINT,
} from '../types/D3d11';
import type { D3D_DRIVER_TYPE } from '../types/D3d11';

/**
 * Thin, lazy-loaded FFI bindings for `d3d11.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import D3d11, { D3D_DRIVER_TYPE, D3D11_SDK_VERSION } from './structs/D3d11';
 *
 * // Lazy: bind on first call
 * const ppDevice = Buffer.alloc(8);
 * const ppImmediateContext = Buffer.alloc(8);
 * const hr = D3d11.D3D11CreateDevice(null, D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, 0n, 0, null, 0, D3D11_SDK_VERSION, ppDevice.ptr, null, ppImmediateContext.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * D3d11.Preload(['D3D11CreateDevice', 'D3D11CreateDeviceAndSwapChain']);
 * ```
 */
class D3d11 extends Win32 {
  protected static override name = 'd3d11.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CreateDirect3D11DeviceFromDXGIDevice: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateDirect3D11SurfaceFromDXGISurface: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D11CreateDevice: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D11CreateDeviceAndSwapChain: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D11On12CreateDevice: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/windows.graphics.directx.direct3d11.interop/nf-windows-graphics-directx-direct3d11-interop-createdirect3d11devicefromdxgidevice
  public static CreateDirect3D11DeviceFromDXGIDevice(dxgiDevice: IDXGIDevice, graphicsDevice_out: PIInspectable): HRESULT {
    return D3d11.Load('CreateDirect3D11DeviceFromDXGIDevice')(dxgiDevice, graphicsDevice_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windows.graphics.directx.direct3d11.interop/nf-windows-graphics-directx-direct3d11-interop-createdirect3d11surfacefromdxgisurface
  public static CreateDirect3D11SurfaceFromDXGISurface(dgxiSurface: IDXGISurface, graphicsSurface_out: PIInspectable): HRESULT {
    return D3d11.Load('CreateDirect3D11SurfaceFromDXGISurface')(dgxiSurface, graphicsSurface_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d11/nf-d3d11-d3d11createdevice
  public static D3D11CreateDevice(
    pAdapter: Optional<IDXGIAdapter>,
    DriverType: D3D_DRIVER_TYPE,
    Software: Nullable<HMODULE>,
    Flags: UINT,
    pFeatureLevels: Optional<PD3D_FEATURE_LEVEL>,
    FeatureLevels: UINT,
    SDKVersion: UINT,
    ppDevice_out: Optional<PID3D11Device>,
    pFeatureLevel_out: Optional<PD3D_FEATURE_LEVEL>,
    ppImmediateContext_out: Optional<PID3D11DeviceContext>,
  ): HRESULT {
    return D3d11.Load('D3D11CreateDevice')(pAdapter, DriverType, Software, Flags, pFeatureLevels, FeatureLevels, SDKVersion, ppDevice_out, pFeatureLevel_out, ppImmediateContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d11/nf-d3d11-d3d11createdeviceandswapchain
  public static D3D11CreateDeviceAndSwapChain(
    pAdapter: Optional<IDXGIAdapter>,
    DriverType: D3D_DRIVER_TYPE,
    Software: Nullable<HMODULE>,
    Flags: UINT,
    pFeatureLevels: Optional<PD3D_FEATURE_LEVEL>,
    FeatureLevels: UINT,
    SDKVersion: UINT,
    pSwapChainDesc: Optional<PDXGI_SWAP_CHAIN_DESC>,
    ppSwapChain_out: Optional<PIDXGISwapChain>,
    ppDevice_out: Optional<PID3D11Device>,
    pFeatureLevel_out: Optional<PD3D_FEATURE_LEVEL>,
    ppImmediateContext_out: Optional<PID3D11DeviceContext>,
  ): HRESULT {
    return D3d11.Load('D3D11CreateDeviceAndSwapChain')(pAdapter, DriverType, Software, Flags, pFeatureLevels, FeatureLevels, SDKVersion, pSwapChainDesc, ppSwapChain_out, ppDevice_out, pFeatureLevel_out, ppImmediateContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d11on12/nf-d3d11on12-d3d11on12createdevice
  public static D3D11On12CreateDevice(
    pDevice: IUnknown,
    Flags: UINT,
    pFeatureLevels: Optional<PD3D_FEATURE_LEVEL>,
    FeatureLevels: UINT,
    ppCommandQueues: Optional<PIUnknown>,
    NumQueues: UINT,
    NodeMask: UINT,
    ppDevice_out: Optional<PID3D11Device>,
    ppImmediateContext_out: Optional<PID3D11DeviceContext>,
    pChosenFeatureLevel_out: Optional<PD3D_FEATURE_LEVEL>,
  ): HRESULT {
    return D3d11.Load('D3D11On12CreateDevice')(pDevice, Flags, pFeatureLevels, FeatureLevels, ppCommandQueues, NumQueues, NodeMask, ppDevice_out, ppImmediateContext_out, pChosenFeatureLevel_out);
  }
}

export default D3d11;
