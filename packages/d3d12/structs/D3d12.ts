import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { HRESULT, IUnknown, LPCVOID, LPLPVOID, LPVOID, Optional, PD3D12_ROOT_SIGNATURE_DESC, PD3D12_VERSIONED_ROOT_SIGNATURE_DESC, PID3DBlob, PUINT, REFCLSID, REFIID, SIZE_T, UINT } from '../types/D3d12';
import type { D3D_FEATURE_LEVEL, D3D_ROOT_SIGNATURE_VERSION } from '../types/D3d12';

/**
 * Thin, lazy-loaded FFI bindings for `d3d12.dll`.
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
 * import D3d12, { D3D_FEATURE_LEVEL } from './structs/D3d12';
 *
 * // Lazy: bind on first call
 * const iidDevice = Buffer.alloc(16);
 * const ppDevice = Buffer.alloc(8);
 * const hr = D3d12.D3D12CreateDevice(null, D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0, iidDevice.ptr, ppDevice.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * D3d12.Preload(['D3D12CreateDevice', 'D3D12GetDebugInterface']);
 * ```
 */
class D3d12 extends Win32 {
  protected static override name = 'd3d12.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    D3D12CreateDevice: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D12CreateRootSignatureDeserializer: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D12CreateVersionedRootSignatureDeserializer: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D12EnableExperimentalFeatures: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D12GetDebugInterface: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D12GetInterface: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D12SerializeRootSignature: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    D3D12SerializeVersionedRootSignature: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-d3d12createdevice
  public static D3D12CreateDevice(pAdapter: Optional<IUnknown>, MinimumFeatureLevel: D3D_FEATURE_LEVEL, riid: REFIID, ppDevice_out: Optional<LPLPVOID>): HRESULT {
    return D3d12.Load('D3D12CreateDevice')(pAdapter, MinimumFeatureLevel, riid, ppDevice_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-d3d12createrootsignaturedeserializer
  public static D3D12CreateRootSignatureDeserializer(pSrcData: LPCVOID, SrcDataSizeInBytes: SIZE_T, pRootSignatureDeserializerInterface: REFIID, ppRootSignatureDeserializer_out: LPLPVOID): HRESULT {
    return D3d12.Load('D3D12CreateRootSignatureDeserializer')(pSrcData, SrcDataSizeInBytes, pRootSignatureDeserializerInterface, ppRootSignatureDeserializer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-d3d12createversionedrootsignaturedeserializer
  public static D3D12CreateVersionedRootSignatureDeserializer(pSrcData: LPCVOID, SrcDataSizeInBytes: SIZE_T, pRootSignatureDeserializerInterface: REFIID, ppRootSignatureDeserializer_out: LPLPVOID): HRESULT {
    return D3d12.Load('D3D12CreateVersionedRootSignatureDeserializer')(pSrcData, SrcDataSizeInBytes, pRootSignatureDeserializerInterface, ppRootSignatureDeserializer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-d3d12enableexperimentalfeatures
  public static D3D12EnableExperimentalFeatures(NumFeatures: UINT, pIIDs: REFIID, pConfigurationStructs: Optional<LPVOID>, pConfigurationStructSizes: Optional<PUINT>): HRESULT {
    return D3d12.Load('D3D12EnableExperimentalFeatures')(NumFeatures, pIIDs, pConfigurationStructs, pConfigurationStructSizes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-d3d12getdebuginterface
  public static D3D12GetDebugInterface(riid: REFIID, ppvDebug_out: Optional<LPLPVOID>): HRESULT {
    return D3d12.Load('D3D12GetDebugInterface')(riid, ppvDebug_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-d3d12getinterface
  public static D3D12GetInterface(rclsid: REFCLSID, riid: REFIID, ppvDebug_out: Optional<LPLPVOID>): HRESULT {
    return D3d12.Load('D3D12GetInterface')(rclsid, riid, ppvDebug_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-d3d12serializerootsignature
  public static D3D12SerializeRootSignature(pRootSignature: PD3D12_ROOT_SIGNATURE_DESC, Version: D3D_ROOT_SIGNATURE_VERSION, ppBlob_out: PID3DBlob, ppErrorBlob_out: Optional<PID3DBlob>): HRESULT {
    return D3d12.Load('D3D12SerializeRootSignature')(pRootSignature, Version, ppBlob_out, ppErrorBlob_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-d3d12serializeversionedrootsignature
  public static D3D12SerializeVersionedRootSignature(pRootSignature: PD3D12_VERSIONED_ROOT_SIGNATURE_DESC, ppBlob_out: PID3DBlob, ppErrorBlob_out: Optional<PID3DBlob>): HRESULT {
    return D3d12.Load('D3D12SerializeVersionedRootSignature')(pRootSignature, ppBlob_out, ppErrorBlob_out);
  }
}

export default D3d12;
