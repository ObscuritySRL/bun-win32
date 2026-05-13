import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BYTE,
  DWORD,
  HANDLE,
  HMONITOR,
  HRESULT,
  IDirect3DDevice9,
  IDirect3DDevice9Ex,
  LPDWORD,
  LPLUID,
  LPMC_COLOR_TEMPERATURE,
  LPMC_DISPLAY_TECHNOLOGY_TYPE,
  LPMC_TIMING_REPORT,
  LPMC_VCP_CODE_TYPE,
  LPPHYSICAL_MONITOR,
  LPSTR,
  LPUINT,
  NULL,
  PDXVAHD_CONTENT_DESC,
  PDXVAHDSW_Plugin,
  PIDirect3DDeviceManager9,
  PIDXVAHD_Device,
  PIOPMVideoOutput,
  PIOPMVideoOutputArray,
  PVOID_PTR,
  REFIID,
  ULONG,
} from '../types/Dxva2';
import type { DXVAHD_DEVICE_USAGE, MC_COLOR_TEMPERATURE, MC_DRIVE_TYPE, MC_GAIN_TYPE, MC_POSITION_TYPE, MC_SIZE_TYPE, OPM_VIDEO_OUTPUT_SEMANTICS } from '../types/Dxva2';

/**
 * Thin, lazy-loaded FFI bindings for `dxva2.dll`.
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
 * import Dxva2 from './structs/Dxva2';
 *
 * // Lazy: bind on first call
 * const count = Buffer.alloc(4);
 * const ok = Dxva2.GetNumberOfPhysicalMonitorsFromHMONITOR(hMonitor, count.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Dxva2.Preload(['GetPhysicalMonitorsFromHMONITOR', 'GetMonitorBrightness', 'SetMonitorBrightness']);
 * ```
 */
class Dxva2 extends Win32 {
  protected static override name = 'dxva2.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CapabilitiesRequestAndCapabilitiesReply: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DegaussMonitor: { args: [FFIType.u64], returns: FFIType.i32 },
    DestroyPhysicalMonitor: { args: [FFIType.u64], returns: FFIType.i32 },
    DestroyPhysicalMonitors: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DXVA2CreateDirect3DDeviceManager9: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DXVA2CreateVideoService: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DXVAHD_CreateDevice: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetCapabilitiesStringLength: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetMonitorBrightness: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetMonitorCapabilities: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetMonitorColorTemperature: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetMonitorContrast: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetMonitorDisplayAreaPosition: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetMonitorDisplayAreaSize: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetMonitorRedGreenOrBlueDrive: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetMonitorRedGreenOrBlueGain: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetMonitorTechnologyType: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNumberOfPhysicalMonitorsFromHMONITOR: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNumberOfPhysicalMonitorsFromIDirect3DDevice9: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPhysicalMonitorsFromHMONITOR: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPhysicalMonitorsFromIDirect3DDevice9: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetTimingReport: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetVCPFeatureAndVCPFeatureReply: { args: [FFIType.u64, FFIType.u8, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OPMGetVideoOutputForTarget: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    OPMGetVideoOutputsFromHMONITOR: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OPMGetVideoOutputsFromIDirect3DDevice9Object: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RestoreMonitorFactoryColorDefaults: { args: [FFIType.u64], returns: FFIType.i32 },
    RestoreMonitorFactoryDefaults: { args: [FFIType.u64], returns: FFIType.i32 },
    SaveCurrentMonitorSettings: { args: [FFIType.u64], returns: FFIType.i32 },
    SaveCurrentSettings: { args: [FFIType.u64], returns: FFIType.i32 },
    SetMonitorBrightness: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetMonitorColorTemperature: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetMonitorContrast: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetMonitorDisplayAreaPosition: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetMonitorDisplayAreaSize: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetMonitorRedGreenOrBlueDrive: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetMonitorRedGreenOrBlueGain: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetVCPFeature: { args: [FFIType.u64, FFIType.u8, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/lowlevelmonitorconfigurationapi/nf-lowlevelmonitorconfigurationapi-capabilitiesrequestandcapabilitiesreply
  public static CapabilitiesRequestAndCapabilitiesReply(hMonitor: HANDLE, pszASCIICapabilitiesString: LPSTR, dwCapabilitiesStringLengthInCharacters: DWORD): BOOL {
    return Dxva2.Load('CapabilitiesRequestAndCapabilitiesReply')(hMonitor, pszASCIICapabilitiesString, dwCapabilitiesStringLengthInCharacters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-degaussmonitor
  public static DegaussMonitor(hMonitor: HANDLE): BOOL {
    return Dxva2.Load('DegaussMonitor')(hMonitor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/physicalmonitorenumerationapi/nf-physicalmonitorenumerationapi-destroyphysicalmonitor
  public static DestroyPhysicalMonitor(hMonitor: HANDLE): BOOL {
    return Dxva2.Load('DestroyPhysicalMonitor')(hMonitor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/physicalmonitorenumerationapi/nf-physicalmonitorenumerationapi-destroyphysicalmonitors
  public static DestroyPhysicalMonitors(dwPhysicalMonitorArraySize: DWORD, pPhysicalMonitorArray: LPPHYSICAL_MONITOR): BOOL {
    return Dxva2.Load('DestroyPhysicalMonitors')(dwPhysicalMonitorArraySize, pPhysicalMonitorArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dxva2api/nf-dxva2api-dxva2createdirect3ddevicemanager9
  public static DXVA2CreateDirect3DDeviceManager9(pResetToken: LPUINT, ppDeviceManager: PIDirect3DDeviceManager9): HRESULT {
    return Dxva2.Load('DXVA2CreateDirect3DDeviceManager9')(pResetToken, ppDeviceManager);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dxva2api/nf-dxva2api-dxva2createvideoservice
  public static DXVA2CreateVideoService(pDD: IDirect3DDevice9, riid: REFIID, ppService: PVOID_PTR): HRESULT {
    return Dxva2.Load('DXVA2CreateVideoService')(pDD, riid, ppService);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dxvahd/nf-dxvahd-dxvahd_createdevice
  public static DXVAHD_CreateDevice(pD3DDevice: IDirect3DDevice9Ex, pContentDesc: PDXVAHD_CONTENT_DESC, Usage: DXVAHD_DEVICE_USAGE, pPlugin: PDXVAHDSW_Plugin | NULL, ppDevice: PIDXVAHD_Device): HRESULT {
    return Dxva2.Load('DXVAHD_CreateDevice')(pD3DDevice, pContentDesc, Usage, pPlugin, ppDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lowlevelmonitorconfigurationapi/nf-lowlevelmonitorconfigurationapi-getcapabilitiesstringlength
  public static GetCapabilitiesStringLength(hMonitor: HANDLE, pdwCapabilitiesStringLengthInCharacters: LPDWORD): BOOL {
    return Dxva2.Load('GetCapabilitiesStringLength')(hMonitor, pdwCapabilitiesStringLengthInCharacters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-getmonitorbrightness
  public static GetMonitorBrightness(hMonitor: HANDLE, pdwMinimumBrightness: LPDWORD, pdwCurrentBrightness: LPDWORD, pdwMaximumBrightness: LPDWORD): BOOL {
    return Dxva2.Load('GetMonitorBrightness')(hMonitor, pdwMinimumBrightness, pdwCurrentBrightness, pdwMaximumBrightness);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-getmonitorcapabilities
  public static GetMonitorCapabilities(hMonitor: HANDLE, pdwMonitorCapabilities: LPDWORD, pdwSupportedColorTemperatures: LPDWORD): BOOL {
    return Dxva2.Load('GetMonitorCapabilities')(hMonitor, pdwMonitorCapabilities, pdwSupportedColorTemperatures);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-getmonitorcolortemperature
  public static GetMonitorColorTemperature(hMonitor: HANDLE, pctCurrentColorTemperature: LPMC_COLOR_TEMPERATURE): BOOL {
    return Dxva2.Load('GetMonitorColorTemperature')(hMonitor, pctCurrentColorTemperature);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-getmonitorcontrast
  public static GetMonitorContrast(hMonitor: HANDLE, pdwMinimumContrast: LPDWORD, pdwCurrentContrast: LPDWORD, pdwMaximumContrast: LPDWORD): BOOL {
    return Dxva2.Load('GetMonitorContrast')(hMonitor, pdwMinimumContrast, pdwCurrentContrast, pdwMaximumContrast);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-getmonitordisplayareaposition
  public static GetMonitorDisplayAreaPosition(hMonitor: HANDLE, ptPositionType: MC_POSITION_TYPE, pdwMinimumPosition: LPDWORD, pdwCurrentPosition: LPDWORD, pdwMaximumPosition: LPDWORD): BOOL {
    return Dxva2.Load('GetMonitorDisplayAreaPosition')(hMonitor, ptPositionType, pdwMinimumPosition, pdwCurrentPosition, pdwMaximumPosition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-getmonitordisplayareasize
  public static GetMonitorDisplayAreaSize(hMonitor: HANDLE, stSizeType: MC_SIZE_TYPE, pdwMinimumWidthOrHeight: LPDWORD, pdwCurrentWidthOrHeight: LPDWORD, pdwMaximumWidthOrHeight: LPDWORD): BOOL {
    return Dxva2.Load('GetMonitorDisplayAreaSize')(hMonitor, stSizeType, pdwMinimumWidthOrHeight, pdwCurrentWidthOrHeight, pdwMaximumWidthOrHeight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-getmonitorredgreenorbluedrive
  public static GetMonitorRedGreenOrBlueDrive(hMonitor: HANDLE, dtDriveType: MC_DRIVE_TYPE, pdwMinimumDrive: LPDWORD, pdwCurrentDrive: LPDWORD, pdwMaximumDrive: LPDWORD): BOOL {
    return Dxva2.Load('GetMonitorRedGreenOrBlueDrive')(hMonitor, dtDriveType, pdwMinimumDrive, pdwCurrentDrive, pdwMaximumDrive);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-getmonitorredgreenorbluegain
  public static GetMonitorRedGreenOrBlueGain(hMonitor: HANDLE, gtGainType: MC_GAIN_TYPE, pdwMinimumGain: LPDWORD, pdwCurrentGain: LPDWORD, pdwMaximumGain: LPDWORD): BOOL {
    return Dxva2.Load('GetMonitorRedGreenOrBlueGain')(hMonitor, gtGainType, pdwMinimumGain, pdwCurrentGain, pdwMaximumGain);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-getmonitortechnologytype
  public static GetMonitorTechnologyType(hMonitor: HANDLE, pdtyDisplayTechnologyType: LPMC_DISPLAY_TECHNOLOGY_TYPE): BOOL {
    return Dxva2.Load('GetMonitorTechnologyType')(hMonitor, pdtyDisplayTechnologyType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/physicalmonitorenumerationapi/nf-physicalmonitorenumerationapi-getnumberofphysicalmonitorsfromhmonitor
  public static GetNumberOfPhysicalMonitorsFromHMONITOR(hMonitor: HMONITOR, pdwNumberOfPhysicalMonitors: LPDWORD): BOOL {
    return Dxva2.Load('GetNumberOfPhysicalMonitorsFromHMONITOR')(hMonitor, pdwNumberOfPhysicalMonitors);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/physicalmonitorenumerationapi/nf-physicalmonitorenumerationapi-getnumberofphysicalmonitorsfromidirect3ddevice9
  public static GetNumberOfPhysicalMonitorsFromIDirect3DDevice9(pDirect3DDevice9: IDirect3DDevice9, pdwNumberOfPhysicalMonitors: LPDWORD): HRESULT {
    return Dxva2.Load('GetNumberOfPhysicalMonitorsFromIDirect3DDevice9')(pDirect3DDevice9, pdwNumberOfPhysicalMonitors);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/physicalmonitorenumerationapi/nf-physicalmonitorenumerationapi-getphysicalmonitorsfromhmonitor
  public static GetPhysicalMonitorsFromHMONITOR(hMonitor: HMONITOR, dwPhysicalMonitorArraySize: DWORD, pPhysicalMonitorArray: LPPHYSICAL_MONITOR): BOOL {
    return Dxva2.Load('GetPhysicalMonitorsFromHMONITOR')(hMonitor, dwPhysicalMonitorArraySize, pPhysicalMonitorArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/physicalmonitorenumerationapi/nf-physicalmonitorenumerationapi-getphysicalmonitorsfromidirect3ddevice9
  public static GetPhysicalMonitorsFromIDirect3DDevice9(pDirect3DDevice9: IDirect3DDevice9, dwPhysicalMonitorArraySize: DWORD, pPhysicalMonitorArray: LPPHYSICAL_MONITOR): HRESULT {
    return Dxva2.Load('GetPhysicalMonitorsFromIDirect3DDevice9')(pDirect3DDevice9, dwPhysicalMonitorArraySize, pPhysicalMonitorArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lowlevelmonitorconfigurationapi/nf-lowlevelmonitorconfigurationapi-gettimingreport
  public static GetTimingReport(hMonitor: HANDLE, pmtrMonitorTimingReport: LPMC_TIMING_REPORT): BOOL {
    return Dxva2.Load('GetTimingReport')(hMonitor, pmtrMonitorTimingReport);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lowlevelmonitorconfigurationapi/nf-lowlevelmonitorconfigurationapi-getvcpfeatureandvcpfeaturereply
  public static GetVCPFeatureAndVCPFeatureReply(hMonitor: HANDLE, bVCPCode: BYTE, pvct: LPMC_VCP_CODE_TYPE | NULL, pdwCurrentValue: LPDWORD, pdwMaximumValue: LPDWORD | NULL): BOOL {
    return Dxva2.Load('GetVCPFeatureAndVCPFeatureReply')(hMonitor, bVCPCode, pvct, pdwCurrentValue, pdwMaximumValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/opmapi/nf-opmapi-opmgetvideooutputfortarget
  public static OPMGetVideoOutputForTarget(pAdapterLuid: LPLUID, VidPnTarget: ULONG, vos: OPM_VIDEO_OUTPUT_SEMANTICS, ppOPMVideoOutput: PIOPMVideoOutput): HRESULT {
    return Dxva2.Load('OPMGetVideoOutputForTarget')(pAdapterLuid, VidPnTarget, vos, ppOPMVideoOutput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/opmapi/nf-opmapi-opmgetvideooutputsfromhmonitor
  public static OPMGetVideoOutputsFromHMONITOR(hMonitor: HMONITOR, vos: OPM_VIDEO_OUTPUT_SEMANTICS, pulNumVideoOutputs: LPDWORD, pppOPMVideoOutputArray: PIOPMVideoOutputArray): HRESULT {
    return Dxva2.Load('OPMGetVideoOutputsFromHMONITOR')(hMonitor, vos, pulNumVideoOutputs, pppOPMVideoOutputArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/opmapi/nf-opmapi-opmgetvideooutputsfromidirect3ddevice9object
  public static OPMGetVideoOutputsFromIDirect3DDevice9Object(pDirect3DDevice9: IDirect3DDevice9, vos: OPM_VIDEO_OUTPUT_SEMANTICS, pulNumVideoOutputs: LPDWORD, pppOPMVideoOutputArray: PIOPMVideoOutputArray): HRESULT {
    return Dxva2.Load('OPMGetVideoOutputsFromIDirect3DDevice9Object')(pDirect3DDevice9, vos, pulNumVideoOutputs, pppOPMVideoOutputArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-restoremonitorfactorycolordefaults
  public static RestoreMonitorFactoryColorDefaults(hMonitor: HANDLE): BOOL {
    return Dxva2.Load('RestoreMonitorFactoryColorDefaults')(hMonitor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-restoremonitorfactorydefaults
  public static RestoreMonitorFactoryDefaults(hMonitor: HANDLE): BOOL {
    return Dxva2.Load('RestoreMonitorFactoryDefaults')(hMonitor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-savecurrentmonitorsettings
  public static SaveCurrentMonitorSettings(hMonitor: HANDLE): BOOL {
    return Dxva2.Load('SaveCurrentMonitorSettings')(hMonitor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lowlevelmonitorconfigurationapi/nf-lowlevelmonitorconfigurationapi-savecurrentsettings
  public static SaveCurrentSettings(hMonitor: HANDLE): BOOL {
    return Dxva2.Load('SaveCurrentSettings')(hMonitor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-setmonitorbrightness
  public static SetMonitorBrightness(hMonitor: HANDLE, dwNewBrightness: DWORD): BOOL {
    return Dxva2.Load('SetMonitorBrightness')(hMonitor, dwNewBrightness);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-setmonitorcolortemperature
  public static SetMonitorColorTemperature(hMonitor: HANDLE, ctCurrentColorTemperature: MC_COLOR_TEMPERATURE): BOOL {
    return Dxva2.Load('SetMonitorColorTemperature')(hMonitor, ctCurrentColorTemperature);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-setmonitorcontrast
  public static SetMonitorContrast(hMonitor: HANDLE, dwNewContrast: DWORD): BOOL {
    return Dxva2.Load('SetMonitorContrast')(hMonitor, dwNewContrast);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-setmonitordisplayareaposition
  public static SetMonitorDisplayAreaPosition(hMonitor: HANDLE, ptPositionType: MC_POSITION_TYPE, dwNewPosition: DWORD): BOOL {
    return Dxva2.Load('SetMonitorDisplayAreaPosition')(hMonitor, ptPositionType, dwNewPosition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-setmonitordisplayareasize
  public static SetMonitorDisplayAreaSize(hMonitor: HANDLE, stSizeType: MC_SIZE_TYPE, dwNewDisplayAreaWidthOrHeight: DWORD): BOOL {
    return Dxva2.Load('SetMonitorDisplayAreaSize')(hMonitor, stSizeType, dwNewDisplayAreaWidthOrHeight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-setmonitorredgreenorbluedrive
  public static SetMonitorRedGreenOrBlueDrive(hMonitor: HANDLE, dtDriveType: MC_DRIVE_TYPE, dwNewDrive: DWORD): BOOL {
    return Dxva2.Load('SetMonitorRedGreenOrBlueDrive')(hMonitor, dtDriveType, dwNewDrive);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/highlevelmonitorconfigurationapi/nf-highlevelmonitorconfigurationapi-setmonitorredgreenorbluegain
  public static SetMonitorRedGreenOrBlueGain(hMonitor: HANDLE, gtGainType: MC_GAIN_TYPE, dwNewGain: DWORD): BOOL {
    return Dxva2.Load('SetMonitorRedGreenOrBlueGain')(hMonitor, gtGainType, dwNewGain);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lowlevelmonitorconfigurationapi/nf-lowlevelmonitorconfigurationapi-setvcpfeature
  public static SetVCPFeature(hMonitor: HANDLE, bVCPCode: BYTE, dwNewValue: DWORD): BOOL {
    return Dxva2.Load('SetVCPFeature')(hMonitor, bVCPCode, dwNewValue);
  }
}

export default Dxva2;
