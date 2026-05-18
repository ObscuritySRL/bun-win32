import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  COMPOSITION_FRAME_ID,
  COMPOSITION_FRAME_ID_TYPE,
  DWORD,
  HRESULT,
  HWND,
  IDCompositionVisual,
  IDXGIDevice,
  IUnknown,
  LPLPVOID,
  LPSECURITY_ATTRIBUTES,
  NULL,
  PCOMPOSITION_FRAME_ID,
  PCOMPOSITION_FRAME_STATS,
  PCOMPOSITION_TARGET_ID,
  PCOMPOSITION_TARGET_STATS,
  PHANDLE,
  PUINT,
  REFCLSID,
  REFIID,
  UINT,
} from '../types/Dcomp';

/**
 * Thin, lazy-loaded FFI bindings for `dcomp.dll`.
 *
 * Covers the documented Microsoft DirectComposition flat surface (`dcomp.h`):
 * device creation (`DCompositionCreateDevice`/`2`/`3`), composition surface
 * handles, the compositor-clock frame/statistics APIs, mouse-input redirection,
 * and the COM in-proc-server entry points. The rest of DirectComposition (the
 * `IDCompositionDevice`/`IDCompositionVisual` object graph) rides the COM vtable
 * on top of the device created here.
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
 * import Dcomp from './structs/Dcomp';
 *
 * const deviceOut = Buffer.alloc(8);
 * const hr = Dcomp.DCompositionCreateDevice2(null, iidBuf.ptr!, deviceOut.ptr!);
 * Dcomp.Preload(['DCompositionGetFrameId', 'DCompositionGetStatistics']);
 * ```
 */
class Dcomp extends Win32 {
  protected static override name = 'dcomp.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DCompositionAttachMouseDragToHwnd: { args: [FFIType.ptr, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    DCompositionAttachMouseWheelToHwnd: { args: [FFIType.ptr, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    DCompositionBoostCompositorClock: { args: [FFIType.i32], returns: FFIType.i32 },
    DCompositionCreateDevice: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DCompositionCreateDevice2: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DCompositionCreateDevice3: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DCompositionCreateSurfaceHandle: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DCompositionGetFrameId: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DCompositionGetStatistics: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DCompositionGetTargetStatistics: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DCompositionWaitForCompositorClock: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositionattachmousedragtohwnd
  public static DCompositionAttachMouseDragToHwnd(visual: IDCompositionVisual, hwnd: HWND, enable: BOOL): HRESULT {
    return Dcomp.Load('DCompositionAttachMouseDragToHwnd')(visual, hwnd, enable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositionattachmousewheeltohwnd
  public static DCompositionAttachMouseWheelToHwnd(visual: IDCompositionVisual, hwnd: HWND, enable: BOOL): HRESULT {
    return Dcomp.Load('DCompositionAttachMouseWheelToHwnd')(visual, hwnd, enable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositionboostcompositorclock
  public static DCompositionBoostCompositorClock(enable: BOOL): HRESULT {
    return Dcomp.Load('DCompositionBoostCompositorClock')(enable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositioncreatedevice
  public static DCompositionCreateDevice(dxgiDevice: IDXGIDevice, iid: REFIID, dcompositionDevice: LPLPVOID): HRESULT {
    return Dcomp.Load('DCompositionCreateDevice')(dxgiDevice, iid, dcompositionDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositioncreatedevice2
  public static DCompositionCreateDevice2(renderingDevice: IUnknown | NULL, iid: REFIID, dcompositionDevice: LPLPVOID): HRESULT {
    return Dcomp.Load('DCompositionCreateDevice2')(renderingDevice, iid, dcompositionDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositioncreatedevice3
  public static DCompositionCreateDevice3(renderingDevice: IUnknown | NULL, iid: REFIID, dcompositionDevice: LPLPVOID): HRESULT {
    return Dcomp.Load('DCompositionCreateDevice3')(renderingDevice, iid, dcompositionDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositioncreatesurfacehandle
  public static DCompositionCreateSurfaceHandle(desiredAccess: DWORD, securityAttributes: LPSECURITY_ATTRIBUTES | NULL, surfaceHandle: PHANDLE): HRESULT {
    return Dcomp.Load('DCompositionCreateSurfaceHandle')(desiredAccess, securityAttributes, surfaceHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositiongetframeid
  public static DCompositionGetFrameId(frameIdType: COMPOSITION_FRAME_ID_TYPE, frameId: PCOMPOSITION_FRAME_ID): HRESULT {
    return Dcomp.Load('DCompositionGetFrameId')(frameIdType, frameId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositiongetstatistics
  public static DCompositionGetStatistics(frameId: COMPOSITION_FRAME_ID, frameStats: PCOMPOSITION_FRAME_STATS, targetIdCount: UINT, targetIds: PCOMPOSITION_TARGET_ID | NULL, actualTargetIdCount: PUINT | NULL): HRESULT {
    return Dcomp.Load('DCompositionGetStatistics')(frameId, frameStats, targetIdCount, targetIds, actualTargetIdCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositiongettargetstatistics
  public static DCompositionGetTargetStatistics(frameId: COMPOSITION_FRAME_ID, targetId: PCOMPOSITION_TARGET_ID, targetStats: PCOMPOSITION_TARGET_STATS): HRESULT {
    return Dcomp.Load('DCompositionGetTargetStatistics')(frameId, targetId, targetStats);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-dcompositionwaitforcompositorclock
  public static DCompositionWaitForCompositorClock(count: UINT, handles: PHANDLE, timeoutInMs: DWORD): DWORD {
    return Dcomp.Load('DCompositionWaitForCompositorClock')(count, handles, timeoutInMs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Dcomp.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv: LPLPVOID): HRESULT {
    return Dcomp.Load('DllGetClassObject')(rclsid, riid, ppv);
  }
}

export default Dcomp;
