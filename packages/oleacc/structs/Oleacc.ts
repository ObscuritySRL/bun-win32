import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, HRESULT, HWND, IAccessible, LONG, LPCSTR, LPCWSTR, LPSTR, LPUNKNOWN, LPWSTR, LRESULT, Optional, PACKED_POINT, PDWORD, PHWND, PLONG, PPVOID, PVARIANT, REFCLSID, REFIID, UINT, VOID, WPARAM } from '../types/Oleacc';

/**
 * Thin, lazy-loaded FFI bindings for `oleacc.dll`.
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
 * import Oleacc from './structs/Oleacc';
 *
 * // Lazy: bind on first call
 * const ppAcc = Buffer.alloc(8);
 * const hr = Oleacc.AccessibleObjectFromWindow(hwnd, 0xffffffff, iid.ptr!, ppAcc.ptr!);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Oleacc.Preload(['AccessibleObjectFromWindow', 'GetRoleTextW']);
 * ```
 */
class Oleacc extends Win32 {
  protected static override name = 'oleacc.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AccNotifyTouchInteraction: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    AccSetRunningUtilityState: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    AccessibleChildren: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessibleObjectFromEvent: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessibleObjectFromPoint: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessibleObjectFromWindow: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateStdAccessibleObject: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateStdAccessibleProxyA: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateStdAccessibleProxyW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
    GetOleaccVersionInfo: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    GetRoleTextA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetRoleTextW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetStateTextA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetStateTextW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    LresultFromObject: { args: [FFIType.ptr, FFIType.u64, FFIType.u64], returns: FFIType.i64 },
    ObjectFromLresult: { args: [FFIType.i64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WindowFromAccessibleObject: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-accnotifytouchinteraction
  public static AccNotifyTouchInteraction(hwndApp: HWND, hwndTarget: HWND, ptTarget: PACKED_POINT): HRESULT {
    return Oleacc.Load('AccNotifyTouchInteraction')(hwndApp, hwndTarget, ptTarget);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-accsetrunningutilitystate
  public static AccSetRunningUtilityState(hwndApp: HWND, dwUtilityStateMask: DWORD, dwUtilityState: DWORD): HRESULT {
    return Oleacc.Load('AccSetRunningUtilityState')(hwndApp, dwUtilityStateMask, dwUtilityState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-accessiblechildren
  public static AccessibleChildren(paccContainer: IAccessible, iChildStart: LONG, cChildren: LONG, rgvarChildren_out: PVARIANT, pcObtained_out: PLONG): HRESULT {
    return Oleacc.Load('AccessibleChildren')(paccContainer, iChildStart, cChildren, rgvarChildren_out, pcObtained_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-accessibleobjectfromevent
  public static AccessibleObjectFromEvent(hwnd: HWND, dwId: DWORD, dwChildId: DWORD, ppacc_out: PPVOID, pvarChild_out: PVARIANT): HRESULT {
    return Oleacc.Load('AccessibleObjectFromEvent')(hwnd, dwId, dwChildId, ppacc_out, pvarChild_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-accessibleobjectfrompoint
  public static AccessibleObjectFromPoint(ptScreen: PACKED_POINT, ppacc_out: PPVOID, pvarChild_out: PVARIANT): HRESULT {
    return Oleacc.Load('AccessibleObjectFromPoint')(ptScreen, ppacc_out, pvarChild_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-accessibleobjectfromwindow
  public static AccessibleObjectFromWindow(hwnd: HWND, dwId: DWORD, riid: REFIID, ppvObject_out: PPVOID): HRESULT {
    return Oleacc.Load('AccessibleObjectFromWindow')(hwnd, dwId, riid, ppvObject_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-createstdaccessibleobject
  public static CreateStdAccessibleObject(hwnd: HWND, idObject: LONG, riid: REFIID, ppvObject_out: PPVOID): HRESULT {
    return Oleacc.Load('CreateStdAccessibleObject')(hwnd, idObject, riid, ppvObject_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-createstdaccessibleproxya
  public static CreateStdAccessibleProxyA(hwnd: HWND, pClassName: LPCSTR, idObject: LONG, riid: REFIID, ppvObject_out: PPVOID): HRESULT {
    return Oleacc.Load('CreateStdAccessibleProxyA')(hwnd, pClassName, idObject, riid, ppvObject_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-createstdaccessibleproxyw
  public static CreateStdAccessibleProxyW(hwnd: HWND, pClassName: LPCWSTR, idObject: LONG, riid: REFIID, ppvObject_out: PPVOID): HRESULT {
    return Oleacc.Load('CreateStdAccessibleProxyW')(hwnd, pClassName, idObject, riid, ppvObject_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Oleacc.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: PPVOID): HRESULT {
    return Oleacc.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Oleacc.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return Oleacc.Load('DllUnregisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-getoleaccversioninfo
  public static GetOleaccVersionInfo(pVer_out: PDWORD, pBuild_out: PDWORD): VOID {
    return Oleacc.Load('GetOleaccVersionInfo')(pVer_out, pBuild_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-getroletexta
  public static GetRoleTextA(lRole: DWORD, lpszRole_out: Optional<LPSTR>, cchRoleMax: UINT): UINT {
    return Oleacc.Load('GetRoleTextA')(lRole, lpszRole_out, cchRoleMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-getroletextw
  public static GetRoleTextW(lRole: DWORD, lpszRole_out: Optional<LPWSTR>, cchRoleMax: UINT): UINT {
    return Oleacc.Load('GetRoleTextW')(lRole, lpszRole_out, cchRoleMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-getstatetexta
  public static GetStateTextA(lStateBit: DWORD, lpszState_out: Optional<LPSTR>, cchState: UINT): UINT {
    return Oleacc.Load('GetStateTextA')(lStateBit, lpszState_out, cchState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-getstatetextw
  public static GetStateTextW(lStateBit: DWORD, lpszState_out: Optional<LPWSTR>, cchState: UINT): UINT {
    return Oleacc.Load('GetStateTextW')(lStateBit, lpszState_out, cchState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-lresultfromobject
  public static LresultFromObject(riid: REFIID, wParam: WPARAM, punk: LPUNKNOWN): LRESULT {
    return Oleacc.Load('LresultFromObject')(riid, wParam, punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-objectfromlresult
  public static ObjectFromLresult(lResult: LRESULT, riid: REFIID, wParam: WPARAM, ppvObject_out: PPVOID): HRESULT {
    return Oleacc.Load('ObjectFromLresult')(lResult, riid, wParam, ppvObject_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleacc/nf-oleacc-windowfromaccessibleobject
  public static WindowFromAccessibleObject(unnamedParam1: IAccessible, phwnd_out: Optional<PHWND>): HRESULT {
    return Oleacc.Load('WindowFromAccessibleObject')(unnamedParam1, phwnd_out);
  }
}

export default Oleacc;
