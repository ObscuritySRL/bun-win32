import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, EDefaultDevmodeType, EPrintTicketScope, HPTPROVIDER, HRESULT, IStream, LPCWSTR, NULL, PBSTR, PCWSTR, PDEVMODE, PDWORD, PHPTPROVIDER, PPDEVMODE, PPVOID, PTBUFFER, PULONG, REFCLSID, REFIID, ULONG } from '../types/Prntvpt';

/**
 * Thin, lazy-loaded FFI bindings for `prntvpt.dll`.
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
 * import Prntvpt from './structs/Prntvpt';
 *
 * // Lazy: bind on first call
 * const result = Prntvpt.PTOpenProvider(printerName.ptr, 1, phProvider.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Prntvpt.Preload(['PTOpenProvider', 'PTCloseProvider']);
 * ```
 */
class Prntvpt extends Win32 {
  protected static override name = 'prntvpt.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
    PTCloseProvider: { args: [FFIType.u64], returns: FFIType.i32 },
    PTConvertDevModeToPrintTicket: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    PTConvertPrintTicketToDevMode: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PTGetPrintCapabilities: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PTGetPrintDeviceCapabilities: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PTGetPrintDeviceResources: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PTMergeAndValidatePrintTicket: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PTOpenProvider: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PTOpenProviderEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PTQuerySchemaVersionSupport: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PTReleaseMemory: { args: [FFIType.u64], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Prntvpt.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv: PPVOID): HRESULT {
    return Prntvpt.Load('DllGetClassObject')(rclsid, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Prntvpt.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return Prntvpt.Load('DllUnregisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptcloseprovider
  public static PTCloseProvider(hProvider: HPTPROVIDER): HRESULT {
    return Prntvpt.Load('PTCloseProvider')(hProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptconvertdevmodetoprintticket
  public static PTConvertDevModeToPrintTicket(hProvider: HPTPROVIDER, cbDevmode: ULONG, pDevmode: PDEVMODE, scope: EPrintTicketScope, pPrintTicket: IStream): HRESULT {
    return Prntvpt.Load('PTConvertDevModeToPrintTicket')(hProvider, cbDevmode, pDevmode, scope, pPrintTicket);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptconvertprinttickettodevmode
  public static PTConvertPrintTicketToDevMode(hProvider: HPTPROVIDER, pPrintTicket: IStream, baseDevmodeType: EDefaultDevmodeType, scope: EPrintTicketScope, pcbDevmode: PULONG, ppDevmode: PPDEVMODE, pbstrErrorMessage: PBSTR | NULL): HRESULT {
    return Prntvpt.Load('PTConvertPrintTicketToDevMode')(hProvider, pPrintTicket, baseDevmodeType, scope, pcbDevmode, ppDevmode, pbstrErrorMessage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptgetprintcapabilities
  public static PTGetPrintCapabilities(hProvider: HPTPROVIDER, pPrintTicket: IStream | 0n, pCapabilities: IStream, pbstrErrorMessage: PBSTR | NULL): HRESULT {
    return Prntvpt.Load('PTGetPrintCapabilities')(hProvider, pPrintTicket, pCapabilities, pbstrErrorMessage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptgetprintdevicecapabilities
  public static PTGetPrintDeviceCapabilities(hProvider: HPTPROVIDER, pPrintTicket: IStream | 0n, pDeviceCapabilities: IStream, pbstrErrorMessage: PBSTR | NULL): HRESULT {
    return Prntvpt.Load('PTGetPrintDeviceCapabilities')(hProvider, pPrintTicket, pDeviceCapabilities, pbstrErrorMessage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptgetprintdeviceresources
  public static PTGetPrintDeviceResources(hProvider: HPTPROVIDER, pszLocaleName: LPCWSTR | NULL, pPrintTicket: IStream | 0n, pDeviceResources: IStream, pbstrErrorMessage: PBSTR | NULL): HRESULT {
    return Prntvpt.Load('PTGetPrintDeviceResources')(hProvider, pszLocaleName, pPrintTicket, pDeviceResources, pbstrErrorMessage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptmergeandvalidateprintticket
  public static PTMergeAndValidatePrintTicket(hProvider: HPTPROVIDER, pBaseTicket: IStream, pDeltaTicket: IStream | 0n, scope: EPrintTicketScope, pResultTicket: IStream, pbstrErrorMessage: PBSTR | NULL): HRESULT {
    return Prntvpt.Load('PTMergeAndValidatePrintTicket')(hProvider, pBaseTicket, pDeltaTicket, scope, pResultTicket, pbstrErrorMessage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptopenprovider
  public static PTOpenProvider(pszPrinterName: PCWSTR, dwVersion: DWORD, phProvider: PHPTPROVIDER): HRESULT {
    return Prntvpt.Load('PTOpenProvider')(pszPrinterName, dwVersion, phProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptopenproviderex
  public static PTOpenProviderEx(pszPrinterName: PCWSTR, dwMaxVersion: DWORD, dwPrefVersion: DWORD, phProvider: PHPTPROVIDER, pUsedVersion: PDWORD): HRESULT {
    return Prntvpt.Load('PTOpenProviderEx')(pszPrinterName, dwMaxVersion, dwPrefVersion, phProvider, pUsedVersion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptqueryschemaversionsupport
  public static PTQuerySchemaVersionSupport(pszPrinterName: PCWSTR, pMaxVersion: PDWORD): HRESULT {
    return Prntvpt.Load('PTQuerySchemaVersionSupport')(pszPrinterName, pMaxVersion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prntvpt/nf-prntvpt-ptreleasememory
  public static PTReleaseMemory(pBuffer: PTBUFFER): HRESULT {
    return Prntvpt.Load('PTReleaseMemory')(pBuffer);
  }
}

export default Prntvpt;
